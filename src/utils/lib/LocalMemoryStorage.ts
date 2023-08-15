import mime from 'mime';
import { IStorage } from "./IStorage";

export default class LocalMemoryStorage implements IStorage {
    private storage: Map<string, string> = new Map<string, string>();

    async store(bucketName: string, key: string, data: string): Promise<void>
    {
        this.storage.set(`${bucketName}/${key}`, data);
        return Promise.resolve();
    }

    async retrieve(bucketName: string, key: string): Promise<{ data: string; mime: string }>
    {
        const data = this.storage.get(`${bucketName}/${key}`);
        if (data === undefined) throw new Error(`Key ${key} not found in bucket ${bucketName}`);
        return Promise.resolve({ data, mime: mime.getType(key) || 'application/json' });
    }
}