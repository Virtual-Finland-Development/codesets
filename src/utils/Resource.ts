export interface IResource {
    uri: string;
    name: string;
    retrieve(queryParams?: string): Promise<any>;
}

export type ResourceData = Response | string | ReadableStream<Uint8Array> | null;

export default class Resource implements IResource {
    protected _uri: string;
    protected _transformer: ((data: ResourceData) => Promise<string>) | undefined;

    constructor({ uri, transformer }: { uri: string, transformer?: (data: ResourceData) => Promise<string> }) {
        this._uri = uri;
        this._transformer = transformer;
    }

    public get name() {
        return this.constructor.name;
    }

    public get uri(): string {
        const resourceName = this.name; // Name of the class, e.g. "OccupationsFlatURL"
        if (typeof process.env[`Resources:${resourceName}`] === "string") {
            return process.env[`Resources:${resourceName}`] as string;
        }
        return this._uri;
    }

    public async retrieve(): Promise<any> {
        return await this._engage(this.uri);
    }

    protected async _engage(uri: string): Promise<any> {
        const data = await this._getData(uri);
        return this._transform(data);
    }

    protected  async _transform(data: ResourceData) {
        if (typeof this._transformer === "function") {
            return await this._transformer(data);
        }
        return Promise.resolve(typeof data === "string" ? data : data !== null ? data.toString() : null);
    }

    protected async _getData(uri: string): Promise<ResourceData> {
        const response = await fetch(uri);
        return await response.text();
    }
}