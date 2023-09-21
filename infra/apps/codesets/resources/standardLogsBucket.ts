import * as aws from '@pulumi/aws';
import { Bucket } from '@pulumi/aws/s3';
import { ISetup } from '../../../utils/Setup';

export function createStandardLogsBucket(setup: ISetup): Bucket {
    const bucket = new aws.s3.Bucket(`${setup.projectName}-standard-logs-${setup.stage}`, {
        lifecycleRules: [
            {
                enabled: true,
                expiration: {
                    days: 2,
                },
                id: `standard-logs-expiration-rule-${setup.stage}`,
            },
        ],
        acl: 'private',
        tags: setup.getResourceConfig('standard-logs-bucket').tags,
    });

    new aws.s3.BucketOwnershipControls('controls', {
        bucket: bucket.id,
        rule: {
            objectOwnership: 'BucketOwnerPreferred',
        },
    });

    return bucket;
}
