import { InternalResources } from '../../../resources';
import { RuntimeFlags, getStorageBucketInfo } from '../../runtime';
import BaseResource from './shared/BaseResource';

const inMemoryCache: Record<
    string,
    {
        data: string;
        mime: string;
    }
> = {};

export default class InternalResource extends BaseResource {
    public type = 'internal';

    protected async _retrieveDataPackage(): Promise<{
        data: string;
        mime: string;
    }> {
        if (typeof inMemoryCache[this.uri] !== 'undefined') {
            return inMemoryCache[this.uri];
        }

        const fileName = this.uri;

        if (RuntimeFlags.isLocal) {
            const resource = await InternalResources.getResourcePassThrough(fileName);
            if (resource) {
                inMemoryCache[this.uri] = {
                    data: resource.body,
                    mime: resource.mime || 'application/json',
                };

                return inMemoryCache[this.uri];
            }
            throw new Error(`Resource ${fileName} not found`);
        }

        const bucketName = getStorageBucketInfo().name;
        const bucketKey = `resources/${fileName}`;

        if (!this.requestApp?.storage) throw new Error('Internal storage not initialized');
        inMemoryCache[this.uri] = await this.requestApp.storage.retrieve(bucketName, bucketKey);
        return inMemoryCache[this.uri];
    }
}
