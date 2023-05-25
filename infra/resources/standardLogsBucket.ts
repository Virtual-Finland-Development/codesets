import * as aws from "@pulumi/aws";
import {Bucket} from "@pulumi/aws/s3";
import {ISetup} from "../utils/Setup";

export function createStandardLogsBucket(setup: ISetup): Bucket {
    return new aws.s3.Bucket(`standard-logs-bucket-${setup.stage}`, {
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
    });
}
