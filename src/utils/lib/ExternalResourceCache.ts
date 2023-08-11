import IDataPackage from '../data/models/shared/IDataPackage';
import S3BucketStorage from './S3BucketStorage';

class ExternalResourceCache {

    private readonly bucketName = 'codesets-cache';
    private readonly keyPrefix = 'external';

    public async store(key: string, dataPackage: IDataPackage): Promise<void> {
        return S3BucketStorage.store(this.bucketName, `${this.keyPrefix}/${key}`, JSON.stringify(dataPackage), "application/json");
    }

    public async retrieve(key: string): Promise<{ data: string; mime: string }> {
        const stored = await S3BucketStorage.retrieve(this.bucketName, `${this.keyPrefix}/${key}`);
        return JSON.parse(stored.data);
    }
    
    public async exists(key: string): Promise<boolean> {
        return S3BucketStorage.exists(this.bucketName, `${this.keyPrefix}/${key}`);
    }
}

export default new ExternalResourceCache();