import IDataPackage from '../data/models/shared/IDataPackage';
import { RuntimeFlags, getStorageBucketInfo } from '../runtime';
import { IStorage } from './IStorage';

export default class ExternalResourceCache {

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

    private readonly requestAppStorage: IStorage;

    public constructor(requestAppStorage: IStorage) {
        this.requestAppStorage = requestAppStorage;
    }

    public async store(key: string, dataPackage: IDataPackage): Promise<void> {
        if (RuntimeFlags.isLocal) {
            this.localInMemoryCache[key] = dataPackage;
            return;
        }  
        return this.requestAppStorage.store(this.bucketName, `${this.keyPrefix}/${key}.json`, JSON.stringify(dataPackage), "application/json");
    }

    public async retrieve(key: string): Promise<{ data: string; mime: string }> {
        if (RuntimeFlags.isLocal) {
            return this.localInMemoryCache[key];
        }  
        const stored = await this.requestAppStorage.retrieve(this.bucketName, `${this.keyPrefix}/${key}.json`);
        return JSON.parse(stored.data);
    }
    
    public async getExistsAndExpiredInfo(key: string): Promise<{
        exists: boolean,
        expired: boolean,
    }> {
        if (RuntimeFlags.isLocal) {
            return {
                exists: typeof this.localInMemoryCache[key] !== 'undefined',
                expired: false,
            };
        }
        return this.requestAppStorage.getExistsAndExpiredInfo(this.bucketName, `${this.keyPrefix}/${key}.json`, this.cacheDuration);
    }
}