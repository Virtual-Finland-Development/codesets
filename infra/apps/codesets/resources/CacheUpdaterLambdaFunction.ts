import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export function createCacheUpdaterLambdaFunction(setup: ISetup, bucketName: string) {
    const execRoleConfig = setup.getResourceConfig('CacheUpdaterFunctionExecRole');
    const functionExecRole = new aws.iam.Role(execRoleConfig.name, {
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
        tags: execRoleConfig.tags,
    });

    // Attach S3 read-write policy to exec role
    new aws.iam.RolePolicy(setup.getResourceName('CacheUpdaterFunctionExecRoleS3RwPolicy'), {
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
    new aws.iam.RolePolicyAttachment(setup.getResourceName('CacheUpdaterFunctionExecRolePolicyAttachment'), {
        role: functionExecRole,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const functionConfig = setup.getResourceConfig('CacheUpdaterFunction');
    const lambdaFunction = new aws.lambda.Function(functionConfig.name, {
        role: functionExecRole.arn,
        runtime: 'nodejs18.x',
        handler: 'codesets-cache-updater.handler',
        timeout: 900, // 15 minutes
        memorySize: 1024,
        code: new pulumi.asset.FileArchive('./dist/codesets'),
        tags: functionConfig.tags,
        environment: {
            variables: {
                AWS_S3_BUCKET_REGION: setup.resourcesRegion.region,
            },
        },
    });

    const initialInvokeCommand = invokeInitialExecution(setup, lambdaFunction);

    return {
        lambdaFunction,
        initialInvokeCommand,
    };
}

/**
 * Invokes the function once to ensure the creation of the log group
 *
 * @param setup
 * @param lambdaFunction
 */
function invokeInitialExecution(setup: ISetup, lambdaFunction: aws.lambda.Function) {
    const invokeConfig = setup.getResourceConfig('CacheUpdaterInitialExecution');
    const region = setup.edgeRegion.region;
    return new local.Command(
        invokeConfig.name,
        {
            create: pulumi.interpolate`aws lambda invoke --payload '{"action": "ping"}' --cli-binary-format raw-in-base64-out --function-name ${lambdaFunction.name} --region ${region} /dev/null`,
        },
        { dependsOn: [lambdaFunction] }
    );
}

export function invokeTheCacheUpdatingFunction(setup: ISetup, lambdaFunction: aws.lambda.Function) {
    const invokeConfig = setup.getResourceConfig('CacheUpdaterFunctionInvoke');
    const triggerToken = new Date().getTime().toString(); // Trigger always
    const region = setup.resourcesRegion.region;
    new local.Command(invokeConfig.name, {
        create: pulumi.interpolate`aws lambda invoke --function-name ${lambdaFunction.name} --region ${region} /dev/null`,
        triggers: [triggerToken],
    });
}
