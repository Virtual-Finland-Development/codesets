import * as aws from '@pulumi/aws';
import { Bucket } from '@pulumi/aws/s3';
import { getResourceName, getTags, stage } from '../setup';

export function createStandardLogsBucket(): Bucket {
    const bucket = new aws.s3.Bucket(getResourceName('standard-logs'), {
        lifecycleRules: [
            {
                enabled: true,
                expiration: {
                    days: 2,
                },
                id: `standard-logs-expiration-rule-${stage}`,
            },
        ],
        acl: 'private',
        tags: getTags(),
    });

    new aws.s3.BucketOwnershipControls('controls', {
        bucket: bucket.id,
        rule: {
            objectOwnership: 'BucketOwnerPreferred',
        },
    });

    return bucket;
}
