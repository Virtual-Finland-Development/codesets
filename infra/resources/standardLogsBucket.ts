import * as aws from "@pulumi/aws";
import {Bucket} from "@pulumi/aws/s3";
import {ISetup} from "../utils/Setup";

export function createStandardLogsBucket(setup: ISetup): Bucket {
    const awsEuNorth1 = new aws.Provider("aws-eu-north-1", {region: "eu-north-1"});
    const bucket = new aws.s3.Bucket(`standard-logs-bucket-${setup.stage}`, {
        lifecycleRules: [
            {
                enabled: true,
                expiration: {
                    days: 2
                },
                id: `standard-logs-expiration-rule-${setup.stage}`
            }
        ],
        acl: 'private',
        tags: setup.getResourceConfig('standard-logs-bucket').tags
    }, {
        provider: awsEuNorth1
    });

    const bucketOwnershipControls = new aws.s3.BucketOwnershipControls('controls', {
        bucket: bucket.id,
        rule: {
            objectOwnership: "BucketOwnerPreferred"
        }
    });

    return bucket;
}
