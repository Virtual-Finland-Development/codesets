import { InternalResources } from '../../../resources';
import { retrieveFromS3 } from '../../lib/S3Bucket';
import { Environment, getInternalResourceInfo } from '../../runtime';
import BaseResource from './internal/BaseResource';

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
        inMemoryCache[this.uri] = await retrieveFromS3(bucketName, bucketKey);
        return inMemoryCache[this.uri];
    }
}
