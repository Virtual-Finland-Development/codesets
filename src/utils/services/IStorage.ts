export interface IStorage {
    store(bucketName: string, key: string, data: string, mime: string): Promise<void>;
    retrieve(bucketName: string, key: string): Promise<{ data: string; mime: string }>;
    exists(bucketName: string, key: string): Promise<boolean>;
    getExistsAndExpiredInfo(bucketName: string, key: string, secondsToLive: number): Promise<{
        exists: boolean,
        expired: boolean,
    }>;
}