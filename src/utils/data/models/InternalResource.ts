import { InternalResources } from '../../../resources';
import { RuntimeFlags, getStorageBucketInfo } from '../../runtime';
import BaseResource from './shared/BaseResource';
import IDataPackage from './shared/IDataPackage';

const inMemoryCache: Record<
    string,
    {
        data: string;
        mime: string;
    }
> = {};

export default class InternalResource extends BaseResource {
    public type = 'internal';

    public async retrieveDataPackage(): Promise<IDataPackage> {
        if (typeof inMemoryCache[this.uri] !== 'undefined') {
            return inMemoryCache[this.uri];
        }

        const fileName = this.uri;

        if (RuntimeFlags.isLocal) {
            const resource = await InternalResources.getResourcePassThrough(fileName);
            if (resource) {
                inMemoryCache[this.uri] = {
                    data: resource.body,
                    mime: this._mime || resource.mime || 'application/json',
                };

                return inMemoryCache[this.uri];
            }
            throw new Error(`Resource ${fileName} not found`);
        }

        const bucketName = getStorageBucketInfo().name;
        const bucketKey = `resources/${fileName}`;

        if (!this.requestApp?.storage) throw new Error('Internal storage not initialized');
        const result = await this.requestApp.storage.retrieve(bucketName, bucketKey);
        inMemoryCache[this.uri] = {
            data: result.data,
            mime: this._mime || result.mime || 'application/json',
        };
        return inMemoryCache[this.uri];
    }
}
