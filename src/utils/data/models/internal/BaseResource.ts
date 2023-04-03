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

export default class BaseResource implements IResource {
    public name: string;
    public uri: string;
    public type = 'external';
    protected _mime: string | undefined;

    protected _parsers: {
        input?: (data: string) => unknown;
        transform?: (data: unknown, params: Record<string, string>) => Promise<unknown>;
        output?: (data: unknown) => string;
    } = {};

    protected _dataGetter: ((params: Record<string, string>) => Promise<{ data: string; mime: string }>) | undefined;

    constructor({
        name,
        uri,
        mime,
        type,
        dataGetter,
        parsers,
    }: {
        name: string;
        type?: 'external' | 'library';
        uri?: string;
        mime?: string;
        dataGetter?: (params: Record<string, string>) => Promise<{ data: string; mime: string }>;
        parsers?: {
            input?: (data: string) => unknown; // Raw data intake -> data
            transform?: (data: unknown, params: Record<string, string>) => Promise<unknown>; // Data intake -> transformed data
            output?: (data: unknown) => string; // Transformed data intake -> raw output data
        };
    }) {
        this.name = name;
        this.uri = uri || '';
        this.type = type || this.type;
        this._mime = mime;
        this._dataGetter = dataGetter;
        this._parsers = parsers || {};
    }

    public async retrieve(params: Record<string, string>): Promise<{
        data: string;
        mime: string;
        size: number;
    }> {
        try {
            this.validateSelf();
            const dataPackage = await this._retrieveDataPackage(params);
            const mime = this._mime || dataPackage.mime;
            const finalData = await this._parseRawData(dataPackage.data, mime, params);
            return {
                data: finalData,
                mime: mime,
                size: Buffer.byteLength(finalData, 'utf8'),
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    private validateSelf(): void {
        if (this.type === 'external' && !this.uri) {
            throw new Error('External resources must have a URI');
        }
    }

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

    protected async _parseRawData(data: string, mime: string, params: Record<string, string>): Promise<string> {
        let rawData = this._parseRawData_input(data, mime);
        rawData = await this._parseRawData_transform(rawData, params);
        return this._parseRawData_output(rawData, mime);
    }

    protected _parseRawData_input(rawData: string, mime: string): any {
        if (typeof this._parsers.input === 'function') {
            rawData = this._parsers.input(rawData) as any;
        } else if (mime.startsWith('application/json')) {
            rawData = JSON.parse(rawData);
        }
        return rawData;
    }

    protected async _parseRawData_transform(rawData: any, params: Record<string, string>): Promise<any> {
        if (typeof this._parsers.transform === 'function') {
            rawData = await this._parsers.transform(rawData, params);
        }

        return rawData;
    }

    protected _parseRawData_output(rawData: any, mime: string): string {
        if (typeof this._parsers.output === 'function') {
            return this._parsers.output(rawData);
        } else if (mime.startsWith('application/json')) {
            return JSON.stringify(rawData);
        }
        return rawData;
    }
}
