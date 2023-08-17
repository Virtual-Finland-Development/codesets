import { RuntimeFlags } from '../../runtime';
import ExternalResourceCache from '../../services/ExternalResourceCache';
import BaseResource from './shared/BaseResource';

export default class ExternalResource extends BaseResource {
    public type = 'external';

    private extrenalResourceCache?: ExternalResourceCache;
    private getExternalResourceCache(): ExternalResourceCache {
        if (!this.extrenalResourceCache) {
            if (!this.requestApp?.storage) throw new Error('ExternalResource requires a storage service');
            this.extrenalResourceCache = new ExternalResourceCache(this.requestApp.storage);
        }
        return this.extrenalResourceCache;
    }

    public async retrieveDataPackage(params?: Record<string, string>): Promise<{
        data: string;
        mime: string;
    }> {
        
        if (!RuntimeFlags.isSystemTask) {
            const { exists, expired } = await this.getExternalResourceCache().getExistsAndExpiredInfo(this.name);
            if (exists) {
                if (expired) {
                    this.requestApp?.logger.debug(`Cache expired for resource: ${this.name}`);
                    try {
                        // Retrieve data package from source
                        const freshDataPackage = await super.retrieveDataPackage(params);
                        // Validate input/output by parsing
                        await this.parseRawData(freshDataPackage.data, freshDataPackage.mime);
                        // Store data in cache
                        await this.getExternalResourceCache().store(this.name, freshDataPackage);
                        // Short circuit to return fresh data
                        return freshDataPackage;
                    } catch (error) {
                        // Pass: If there is an error, we don't want to overwrite the cache, pass the expired cache through instead
                        this.requestApp?.logger.catchError(error); // Flag as error for alerts // @TODO: alerts to admin
                    }
                }
                this.requestApp?.logger.debug(`Using externals cache for resource: ${this.name}`);
                return this.getExternalResourceCache().retrieve(this.name);
            }
        }

        const dataPackage = await super.retrieveDataPackage(params);

        if (!RuntimeFlags.isSystemTask) {
            this.requestApp?.logger.debug(`Caching resource in externals store: ${this.name}`);
            await this.getExternalResourceCache().store(this.name, dataPackage);
        }

        return dataPackage;
    }
}
