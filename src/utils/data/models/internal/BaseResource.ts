import { BaseSchema, parse } from 'valibot';

export interface IResource {
    uri: string;
    name: string;
    type: string;
    /**
     * Retrieve the data from the resource
     */
    retrieve(params: Record<string, string>): Promise<{ data: string; mime: string; size: number }>;
}

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export default class BaseResource<I = any, O = any> implements IResource {
    public name: string;
    public uri: string;
    public type = 'external';
    protected _mime: string | undefined;

    protected _parsers: {
        rawInput?: (data: string) => unknown;
        input?: BaseSchema<I> | ((data: unknown) => I);
        transform?: (data: I, params: Record<string, string>) => Promise<O>;
        output?: BaseSchema<O> | ((data: O) => O);
        rawOutput?: (data: O) => string;
    };

    protected _dataGetter: ((params: Record<string, string>) => Promise<{ data: string; mime: string }>) | undefined;
    protected _settings: Record<string, string | number | boolean>;

    constructor({
        name,
        uri,
        mime,
        type,
        dataGetter,
        parsers,
        settings,
    }: {
        name: string;
        type?: 'external' | 'library' | 'internal';
        uri?: string;
        mime?: string;
        dataGetter?: (params: Record<string, string>) => Promise<{ data: string; mime: string }>;
        parsers?: {
            rawInput?: (data: string) => unknown;
            input?: BaseSchema<I> | ((data: unknown) => I);
            transform?: (data: I, params: Record<string, string>) => Promise<O>;
            output?: BaseSchema<O> | ((data: O) => O);
            rawOutput?: (data: O) => string;
        };
        settings?: Record<string, string | number | boolean>;
    }) {
        this.name = name;
        this.uri = uri || '';
        this.type = type || this.type;
        this._mime = mime;
        this._dataGetter = dataGetter;
        this._parsers = parsers || {};
        this._settings = settings || {};
    }

    public async retrieve(params: Record<string, string>): Promise<{
        data: string;
        mime: string;
        size: number;
    }> {
        this.validateSelf();
        const dataPackage = await this._retrieveDataPackage(params);
        const mime = this._mime || dataPackage.mime;
        const finalData = await this._parseRawData(dataPackage.data, mime, params);
        return {
            data: finalData,
            mime: mime,
            size: Buffer.byteLength(finalData, 'utf8'),
        };
    }

    private validateSelf(): void {
        if (this.type === 'external' && !this.uri) {
            throw new Error('External resources must have a URI');
        }
    }

    /**
     * The retriever
     * 
     * @param params 
     * @returns 
     */
    protected async _retrieveDataPackage(params: Record<string, string>): Promise<{
        data: string;
        mime: string;
    }> {
        if (typeof this._dataGetter === 'function') {
            return await this._dataGetter(params);
        }

        const response = await this._fetchData(this.uri);
        const resolved = await this._resolveDataResponse(response.response);
        const rawData = await this._parseResponseRawData(resolved);
        return {
            data: rawData,
            mime: response.mime,
        };
    }

    protected async _fetchData(uri: string): Promise<{ response: Response; mime: string }> {
        const response = await fetch(uri);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }

        return {
            response: response,
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
    protected async _parseRawData(rawData: string, mime: string, params: Record<string, string>): Promise<string> {
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
        if (typeof this._parsers.input === "object" && typeof this._parsers.input.parse === "function") { // Identify BaseSchema type
            rawData = parse(this._parsers.input, rawData);
        } else if (typeof this._parsers.input === "function") {
            rawData = this._parsers.input(rawData);
        }
        return rawData as I;
    }

    protected async _parseRawData_transform(data: I, params: Record<string, string>): Promise<O> {
        if (typeof this._parsers.transform === 'function') {
            return await this._parsers.transform(data, params);
        }
        return Promise.resolve(data as unknown as O);
    }

    protected _parseRawData_parseOutputSchema(data: O): O {
        if (typeof this._parsers.output === "object" && typeof this._parsers.output.parse === "function") { // Identify BaseSchema type
            data = parse(this._parsers.output, data);
        } else if (typeof this._parsers.output === "function") {
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
