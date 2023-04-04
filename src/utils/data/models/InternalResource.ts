import { InternalResources } from '../../../resources';
import { retrieveFromS3 } from '../../lib/S3Bucket';
import { Environment, getInternalResourceInfo } from '../../runtime';
import BaseResource from './internal/BaseResource';

export default class InternalResource extends BaseResource {
    public type = 'internal';

    protected async _retrieveDataPackage(): Promise<{
        data: string;
        mime: string;
    }> {
        const fileName = this.uri;

        if (Environment.isLocal) {
            const resource = await InternalResources.getResourcePassThrough(fileName);
            if (resource) {
                return {
                    data: resource.body,
                    mime: resource.mime || 'application/json',
                };
            }
            throw new Error(`Resource ${fileName} not found`);
        }

        const bucketName = getInternalResourceInfo().name;
        const bucketKey = `resources/${fileName}`;
        return retrieveFromS3(bucketName, bucketKey);
    }
}
