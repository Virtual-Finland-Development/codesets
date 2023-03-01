export interface IResource {
    uri: string;
    name: string;
    retrieve(queryParams?: string): Promise<string>;
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

    public async retrieve(): Promise<string> {
        try {
            return await this._engage(this.uri);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    protected async _engage(uri: string): Promise<string> {
        const data = await this._getData(uri);
        return await this._transform(data);
    }

    protected  async _transform(data: ResourceData): Promise<string> {
        if (typeof this._transformer === "function") {
            return await this._transformer(data);
        }
        return typeof data === "string" ? data : data !== null ? data.toString() : "";
    }

    protected async _getData(uri: string): Promise<ResourceData> {
        const response = await fetch(uri);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }
}