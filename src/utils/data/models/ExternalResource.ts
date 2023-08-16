import { RuntimeFlags } from '../../runtime';
import BaseResource from './shared/BaseResource';

const inMemoryCache: Record<
    string,
    {
        data: string;
        mime: string;
    }
> = {};

export default class ExternalResource extends BaseResource {
    public type = 'external';

    protected async _retrieveDataPackage(params: Record<string, string>): Promise<{
        data: string;
        mime: string;
    }> {
        if (RuntimeFlags.isLocal && typeof inMemoryCache[this.uri] !== 'undefined') {
            console.log(`Using in-memory cache for resource: ${this.name}`);
            return inMemoryCache[this.uri];
        }

        const dataPackage = await super._retrieveDataPackage(params);

        if (RuntimeFlags.isLocal) {
            console.log(`Caching resource in-memory: ${this.name}`);
            inMemoryCache[this.uri] = dataPackage;
        }

        return dataPackage;
    }
}
