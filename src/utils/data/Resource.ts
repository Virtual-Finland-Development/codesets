export interface IResource {
    uri: string;
    name: string;
    retrieve(): Promise<{ data: string, mime: string; size: number }>;
}

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export default class Resource implements IResource {
    protected _name: string;
    protected _uri: string;
    protected _transformer: ((data: ResourceData) => Promise<string>) | undefined;

    constructor({ name, uri, transformer }: { name: string, uri: string, transformer?: (data: ResourceData) => Promise<string> }) {
        this._name = name;
        this._uri = uri;
        this._transformer = transformer;
    }

    public get name() {
        return this._name;
    }

    public get uri(): string {
        const resourceName = this.name; // Name of the class, e.g. "OccupationsFlatURL"
        if (typeof process.env[`Resources:${resourceName}`] === "string") {
            return process.env[`Resources:${resourceName}`] as string;
        }
        return this._uri;
    }

    public async retrieve(): Promise<{ data: string, mime: string; size: number }> {
        try {
            const response = await this._fetchData(this.uri);
            const data = await this._resolveData(response.response);
            const transformedData = await this._transform(data);
            return {
                data: transformedData,
                mime: response.mime,
                size: Buffer.byteLength(transformedData, 'utf8'),
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    protected async _fetchData(uri: string): Promise<{ response: Response, mime: string }> {
        const response = await fetch(uri);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }
        
        return {
            response: response,
            mime: response.headers.get("content-type") || "text/plain",
        };
    }

    protected async _resolveData(response: Response): Promise<ResourceData> {
        return await response.text();
    }
    
    protected  async _transform(data: ResourceData): Promise<string> {
        if (typeof this._transformer === "function") {
            return await this._transformer(data);
        }
        return typeof data === "string" ? data : data !== null ? data.toString() : "";
    }
}