export interface IResource {
    uri: string;
    name: string;
    type: string;
    /**
     * Retrieve the data from the resource
     */
    retrieve(): Promise<{ data: string; mime: string; size: number }>;
}

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export default class BaseResource implements IResource {
    public name: string;
    public uri: string;
    public type = 'external';
    protected _mime: string | undefined;

    protected _parsers: {
        input?: (data: string) => unknown;
        transform?: (data: unknown) => Promise<unknown>;
        output?: (data: unknown) => string;
    } = {};

    protected _dataGetter: (() => Promise<{ data: string; mime: string }>) | undefined;

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
        dataGetter?: () => Promise<{ data: string; mime: string }>;
        parsers?: {
            input?: (data: string) => unknown; // Raw data intake -> data
            transform?: (data: unknown) => Promise<unknown>; // Data intake -> transformed data
            output?: (data: unknown) => string; // Transformed data intake -> raw output data
        };
    }) {
        this.name = name;
        this.uri = uri || '';
        this.type = type || this.type;
        this._mime = mime;
        this._dataGetter = dataGetter;
        this._parsers = parsers || {};

        if (this.type === 'external' && !this.uri) {
            throw new Error('External resources must have a URI');
        }
    }

    public async retrieve(): Promise<{
        data: string;
        mime: string;
        size: number;
    }> {
        try {
            const dataPackage = await this._retrieveDataPackage();
            const mime = this._mime || dataPackage.mime;
            const finalData = await this._parseRawData(dataPackage.data, mime);
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

    protected async _retrieveDataPackage(): Promise<{
        data: string;
        mime: string;
    }> {
        if (typeof this._dataGetter === 'function') {
            return await this._dataGetter();
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

    protected async _parseRawData(data: string, mime: string): Promise<string> {
        let rawData: any = data;

        if (typeof this._parsers.input === 'function') {
            rawData = this._parsers.input(rawData);
        } else if (mime.startsWith('application/json')) {
            rawData = JSON.parse(rawData);
        }

        if (typeof this._parsers.transform === 'function') {
            rawData = await this._parsers.transform(rawData);
        }

        if (typeof this._parsers.output === 'function') {
            return this._parsers.output(rawData);
        } else if (mime.startsWith('application/json')) {
            return JSON.stringify(rawData);
        }
        return rawData;
    }
}
