import { getInternalResourceInfo } from '../../utils/runtime';
import IDataPackage from '../data/models/shared/IDataPackage';
import S3BucketStorage from './S3BucketStorage';

class ExternalResourceCache {

    private readonly bucketName = getInternalResourceInfo().name;
    private readonly keyPrefix = 'external-cache';
    private readonly cacheDuration = 60 * 60 * 24 * 7; // 1 week

    public async store(key: string, dataPackage: IDataPackage): Promise<void> {
        return S3BucketStorage.store(this.bucketName, `${this.keyPrefix}/${key}.json`, JSON.stringify(dataPackage), "application/json");
    }

    public async retrieve(key: string): Promise<{ data: string; mime: string }> {
        const stored = await S3BucketStorage.retrieve(this.bucketName, `${this.keyPrefix}/${key}.json`);
        return JSON.parse(stored.data);
    }
    
    public async getExistsAndExpiredInfo(key: string): Promise<{
        exists: boolean,
        expired: boolean,
    }> {
        return S3BucketStorage.getExistsAndExpiredInfo(this.bucketName, `${this.keyPrefix}/${key}.json`, this.cacheDuration);
    }
}

export default new ExternalResourceCache();