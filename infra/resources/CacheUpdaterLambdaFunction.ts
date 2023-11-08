import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { getResourceName, getTags, regions } from '../setup';

export function createCacheUpdaterLambdaFunction(bucketName: string) {
    const functionExecRole = new aws.iam.Role(getResourceName('CacheUpdaterFunctionExecRole'), {
        assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: ['lambda.amazonaws.com'],
                    },
                    Effect: 'Allow',
                },
            ],
        }),
        tags: getTags(),
    });

    // Attach S3 read-write policy to exec role
    new aws.iam.RolePolicy(getResourceName('CacheUpdaterFunctionExecRoleS3RwPolicy'), {
        role: functionExecRole,
        policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: `arn:aws:s3:::${bucketName}/*`,
                    Effect: 'Allow',
                },
            ],
        }),
    });

    // Attach basic lambda execution policy
    new aws.iam.RolePolicyAttachment(getResourceName('CacheUpdaterFunctionExecRolePolicyAttachment'), {
        role: functionExecRole,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const lambdaFunction = new aws.lambda.Function(getResourceName('CacheUpdaterFunction'), {
        role: functionExecRole.arn,
        runtime: 'nodejs18.x',
        handler: 'codesets-cache-updater.handler',
        timeout: 900, // 15 minutes
        memorySize: 1024,
        code: new pulumi.asset.FileArchive('./dist'),
        tags: getTags(),
        environment: {
            variables: {
                AWS_S3_BUCKET_REGION: regions.resourcesRegion.name,
            },
        },
    });

    return {
        lambdaFunction,
    };
}

export function invokeTheCacheUpdatingFunction(lambdaFunction: aws.lambda.Function) {
    const triggerToken = new Date().getTime().toString(); // Trigger always
    const region = regions.resourcesRegion.name;
    new local.Command(getResourceName('CacheUpdaterFunctionInvoke'), {
        create: pulumi.interpolate`aws lambda invoke --function-name ${lambdaFunction.name} --region ${region} /dev/null`,
        triggers: [triggerToken],
    });
}
