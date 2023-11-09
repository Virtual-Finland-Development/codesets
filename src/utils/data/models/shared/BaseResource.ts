import { BaseSchema, parse } from 'valibot';
import RequestApp from '../../../../app/RequestApp';
import { ResourceRetrievalError } from '../../../exceptions';
import IDataPackage from './IDataPackage';
import IResource from './IResource';

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export interface IResourceConstructorParams<I = any, O = any> {
    name: string;
    type?: 'external' | 'library' | 'internal';
    httpMethod?: 'GET' | 'POST';
    uri?: string;
    mime?: string;
    dataGetter?: (params?: Record<string, string>) => Promise<{ data: string; mime: string }>;
    parsers?: IResourceParserParams<I, O>;
    settings?: Record<string, string | number | boolean>;
}

export interface IResourceParserParams<I = any, O = any> {
    rawInput?: (data: string) => unknown;
    input?: BaseSchema<I> | ((data: unknown) => I);
    transform?: (data: I, params?: Record<string, string>) => Promise<O>;
    output?: BaseSchema<O> | ((data: O) => O);
    rawOutput?: (data: O) => string;
}

export default abstract class BaseResource<I = any, O = any> implements IResource {
    public name: string;
    public uri: string;
    public type = 'external';
    public httpMethod = 'GET';

    protected _mime: string | undefined;

    protected _parsers: IResourceParserParams;

    protected _dataGetter: ((params?: Record<string, string>) => Promise<{ data: string; mime: string }>) | undefined;
    protected _settings: Record<string, string | number | boolean>;

    protected requestApp?: RequestApp;

    constructor({ name, uri, mime, type, dataGetter, parsers, settings, httpMethod }: IResourceConstructorParams) {
        this.name = name;
        this.uri = uri || '';
        this.type = type || this.type;
        this.httpMethod = httpMethod || this.httpMethod;
        this._mime = mime;
        this._dataGetter = dataGetter;
        this._parsers = parsers || {};
        this._settings = settings || {};
    }

    public async retrieve(
        requestApp: RequestApp,
        params: Record<string, string>
    ): Promise<{
        data: string;
        mime: string;
        size: number;
    }> {
        this.initializeSelf(requestApp);
        const dataPackage = await this.retrieveDataPackage(params);
        const finalData = await this.parseRawData(dataPackage.data, dataPackage.mime, params);
        return {
            data: finalData,
            mime: dataPackage.mime,
            size: Buffer.byteLength(finalData, 'utf8'),
        };
    }

    protected initializeSelf(requestApp: RequestApp): void {
        if (this.type === 'external' && !this.uri) {
            throw new Error('External resources must have a URI');
        }
        this.requestApp = requestApp;
    }

    /**
     * The retriever
     *
     * @param params
     * @returns
     */
    public async retrieveDataPackage(params?: Record<string, string>): Promise<IDataPackage> {
        try {
            if (typeof this._dataGetter === 'function') {
                return await this._dataGetter(params);
            }

            const response = await this._fetchData();
            const rawData = await this._parseResponseRawData(response.data);
            return {
                data: rawData,
                mime: this._mime || response.mime,
            };
        } catch (error: any) {
            throw new ResourceRetrievalError(error);
        }
    }

    protected async _fetchData(): Promise<{ data: ResourceData; mime: string }> {
        const response = await fetch(this.uri, {
            method: this.httpMethod,
        });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }

        return {
            data: await this._resolveDataResponse(response),
            mime: response.headers.get('content-type') || 'application/json',
        };
    }

    protected async _resolveDataResponse(response: Response): Promise<ResourceData> {
        return await response.text();
    }

    protected async _parseResponseRawData(data: ResourceData): Promise<string> {
        return typeof data === 'string' ? data : data !== null ? data.toString() : '';
    }

    /**
     * The data parser / transformer
     *
     * @param data
     * @param mime
     * @param params
     * @returns
     */
    public async parseRawData(rawData: string, mime: string, params?: Record<string, string>): Promise<string> {
        let parsedData = this._parseRawData_input(rawData, mime);
        parsedData = this._parseRawData_parseInputSchema(parsedData);
        parsedData = await this._parseRawData_transform(parsedData as I, params);
        parsedData = this._parseRawData_parseOutputSchema(parsedData as O);
        return this._parseRawData_output(parsedData as O, mime);
    }

    protected _parseRawData_input(rawData: string, mime: string): unknown {
        if (typeof this._parsers.rawInput === 'function') {
            rawData = this._parsers.rawInput(rawData) as any;
        } else if (mime.startsWith('application/json')) {
            rawData = JSON.parse(rawData);
        }
        return rawData;
    }

    protected _parseRawData_parseInputSchema(rawData: unknown): I {
        if (typeof this._parsers.input === 'object' && typeof this._parsers.input.parse === 'function') {
            // Identify BaseSchema type
            rawData = parse(this._parsers.input, rawData);
        } else if (typeof this._parsers.input === 'function') {
            rawData = this._parsers.input(rawData);
        }
        return rawData as I;
    }

    protected async _parseRawData_transform(data: I, params?: Record<string, string>): Promise<O> {
        if (typeof this._parsers.transform === 'function') {
            return await this._parsers.transform(data, params);
        }
        return Promise.resolve(data as unknown as O);
    }

    protected _parseRawData_parseOutputSchema(data: O): O {
        if (typeof this._parsers.output === 'object' && typeof this._parsers.output.parse === 'function') {
            // Identify BaseSchema type
            data = parse(this._parsers.output, data);
        } else if (typeof this._parsers.output === 'function') {
            data = this._parsers.output(data);
        }
        return data;
    }

    protected _parseRawData_output(data: O, mime: string): string {
        if (typeof this._parsers.rawOutput === 'function') {
            return this._parsers.rawOutput(data);
        } else if (mime.startsWith('application/json')) {
            return JSON.stringify(data);
        } else if (typeof data === 'object' && data !== null && typeof data.toString === 'function') {
            return data.toString();
        }
        return data as unknown as string;
    }
}
