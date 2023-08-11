import { InternalResources } from '../../../resources';
import { Environment, getInternalResourceInfo } from '../../runtime';
import S3BucketStorage from '../../services/S3BucketStorage';
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
            console.log('Using in-memory cache for resource');
            return inMemoryCache[this.uri];
        }

        const fileName = this.uri;

        if (Environment.isLocal) {
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

        const bucketName = getInternalResourceInfo().name;
        const bucketKey = `resources/${fileName}`;
        inMemoryCache[this.uri] = await S3BucketStorage.retrieve(bucketName, bucketKey);
        return inMemoryCache[this.uri];
    }
}
