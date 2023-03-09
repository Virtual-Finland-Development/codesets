export interface IResource {
    uri: string;
    name: string;
    type: string;
    retrieve(): Promise<{ data: string, mime: string; size: number }>;
}

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export default class Resource implements IResource {
    public name: string;
    public uri: string;
    public type: string = "external";
    protected _mime: string | undefined;
    protected _transformer: ((data: string) => Promise<string>) | undefined;
    protected _dataGetter: (() => Promise<{ data: string, mime: string }>) | undefined;

    constructor({ name, uri, mime, transformer, type, dataGetter }: { name: string, type?: 'external' | 'library', uri?: string, mime?: string, transformer?: (data: string) => Promise<string>, dataGetter?: () => Promise<{ data: string, mime: string }> }) {
        this.name = name;
        this.uri = uri || "";
        this.type = type || this.type;
        this._mime = mime;
        this._transformer = transformer;
        this._dataGetter = dataGetter;

        if (this.type === "external" && !this.uri) {
            throw new Error("External resources must have a URI");
        }
    }

    public async retrieve(): Promise<{ data: string, mime: string; size: number }> {
        try {
            const dataPackage = await this._retrieveDataPackage();
            const transformedData = await this._transform(dataPackage.data);
            return {
                data: transformedData,
                mime: this._mime || dataPackage.mime,
                size: Buffer.byteLength(transformedData, 'utf8'),
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    protected async _retrieveDataPackage(): Promise<{ data: string, mime: string }> {
        if (typeof this._dataGetter === "function") {
            return await this._dataGetter();
        }

        const response = await this._fetchData(this.uri);
        const resolved = await this._resolveDataResponse(response.response);
        const parsed = await this._parseResponseData(resolved);
        return {
            data: parsed,
            mime: response.mime,
        };
    }

    protected async _fetchData(uri: string): Promise<{ response: Response, mime: string }> {
        const response = await fetch(uri);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }
        
        return {
            response: response,
            mime: response.headers.get("content-type") || "application/json",
        };
    }

    protected async _resolveDataResponse(response: Response): Promise<ResourceData> {
        return await response.text();
    }
    
    protected  async _parseResponseData(data: ResourceData): Promise<string> {
        return typeof data === "string" ? data : data !== null ? data.toString() : "";
    }

    protected  async _transform(data: string): Promise<string> {
        if (typeof this._transformer === "function") {
            return await this._transformer(data);
        }
        return data;
    }
}