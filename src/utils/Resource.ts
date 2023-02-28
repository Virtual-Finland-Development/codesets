export interface IResource {
    uri: string;
    name: string;
    retrieve(queryParams?: string): Promise<any>;
}

export default class Resource implements IResource {
    protected _uri: string;
    protected _transformer: (body: string) => string;

    constructor({ uri, transformer }: { uri: string, transformer?: (body: string) => string }) {
        this._uri = uri;
        this._transformer = typeof transformer === 'function' ? transformer : (body: string) => body;
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

    private async _engage(uri: string): Promise<any> {
        const response = await fetch(uri);
        const body = await response.text();
        return this._transformer(body);
    }
}