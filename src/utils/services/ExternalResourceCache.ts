import IDataPackage from '../data/models/shared/IDataPackage';
import { Environment, getStorageBucketInfo } from '../runtime';
import S3BucketStorage from './S3BucketStorage';

class ExternalResourceCache {

    private readonly bucketName = getStorageBucketInfo().name;
    private readonly keyPrefix = 'external-cache';
    private readonly cacheDuration = 7884000; // 3 months in seconds
    private readonly localInMemoryCache: Record<
        string,
        {
            data: string;
            mime: string;
        }
    > = {};

    public async store(key: string, dataPackage: IDataPackage): Promise<void> {
        if (Environment.isLocal) {
            console.log(`Caching resource in-memory: ${key}`);
            this.localInMemoryCache[key] = dataPackage;
            return;
        }  
        return S3BucketStorage.store(this.bucketName, `${this.keyPrefix}/${key}.json`, JSON.stringify(dataPackage), "application/json");
    }

    public async retrieve(key: string): Promise<{ data: string; mime: string }> {
        if (Environment.isLocal) {
            return this.localInMemoryCache[key];
        }  
        const stored = await S3BucketStorage.retrieve(this.bucketName, `${this.keyPrefix}/${key}.json`);
        return JSON.parse(stored.data);
    }
    
    public async getExistsAndExpiredInfo(key: string): Promise<{
        exists: boolean,
        expired: boolean,
    }> {
        if (Environment.isLocal) {
            return {
                exists: typeof this.localInMemoryCache[key] !== 'undefined',
                expired: false,
            };
        }
        return S3BucketStorage.getExistsAndExpiredInfo(this.bucketName, `${this.keyPrefix}/${key}.json`, this.cacheDuration);
    }
}

export default new ExternalResourceCache();