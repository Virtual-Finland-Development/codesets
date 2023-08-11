import ExternalResourceCache from '../../lib/ExternalResourceCache';
import { Environment } from '../../runtime';
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

    public async retrieveDataPackage(params?: Record<string, string>): Promise<{
        data: string;
        mime: string;
    }> {
        if (Environment.isLocal && typeof inMemoryCache[this.uri] !== 'undefined') {
            console.log(`Using in-memory cache for resource: ${this.name}`);
            return inMemoryCache[this.uri];
        } else if (!Environment.isSystemTask) {
            const { exists, expired } = await ExternalResourceCache.getExistsAndExpiredInfo(this.name);
            if (exists) {
                if (expired) {
                    console.log(`Cache expired for resource: ${this.name}`);
                    try {
                        // Retrieve data package from source
                        const freshDataPackage = await super.retrieveDataPackage(params);
                        // Validate input/output by parsing
                        await this.parseRawData(freshDataPackage.data, freshDataPackage.mime);
                        // Store data in cache
                        await ExternalResourceCache.store(this.name, freshDataPackage);
                        // Short circuit to return fresh data
                        return freshDataPackage;
                    } catch (error) {
                        // Pass: If there is an error, we don't want to overwrite the cache, pass the expired cache through instead
                        console.error(error); // Flag as error for alerts
                    }
                }
                console.log(`Using S3 cache for resource: ${this.name}`);
                return ExternalResourceCache.retrieve(this.name);
            }
        }

        const dataPackage = await super.retrieveDataPackage(params);

        if (Environment.isLocal) {
            console.log(`Caching resource in-memory: ${this.name}`);
            inMemoryCache[this.uri] = dataPackage;
        } else if (!Environment.isSystemTask) {
            console.log(`Caching resource in S3: ${this.name}`);
            await ExternalResourceCache.store(this.name, dataPackage);
        }

        return dataPackage;
    }
}
