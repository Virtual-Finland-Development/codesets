import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../utils/Setup';

export function createLambdaFunctionUrl(setup: ISetup, codesetsUrl: pulumi.Output<string>) {
    const lambdaFunctionExecRoleConfig = setup.getResourceConfig('LambdaFunctionExecRole');
    const lambdaFunctionExecRoleRole = new aws.iam.Role(lambdaFunctionExecRoleConfig.name, {
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
        tags: lambdaFunctionExecRoleConfig.tags,
    });

    const functionExecRoleAttachmentConfig = setup.getResourceConfig('FunctionExecRoleAttachment');
    new aws.iam.RolePolicyAttachment(functionExecRoleAttachmentConfig.name, {
        role: lambdaFunctionExecRoleRole.name,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    });

    const lambdaFunctionConfig = setup.getResourceConfig('LambdaFunction');
    const lambdaFunction = new aws.lambda.Function(lambdaFunctionConfig.name, {
        role: lambdaFunctionExecRoleRole.arn,
        runtime: 'nodejs18.x',
        handler: 'app.escoApiHandler',
        timeout: 30,
        memorySize: 256,
        code: new pulumi.asset.FileArchive('./dist'),
        tags: lambdaFunctionConfig.tags,
        environment: {
            variables: {
                CODESETS_API_ENDPOINT: pulumi.interpolate`${codesetsUrl}`,
            },
        },
    });

    const lambdaFunctionUrlConfig = setup.getResourceConfig('LambdaFunctionUrl');
    const lambdaFunctionUrl = new aws.lambda.FunctionUrl(lambdaFunctionUrlConfig.name, {
        functionName: lambdaFunction.name,
        authorizationType: 'NONE',
        cors: {
            allowCredentials: false,
            allowOrigins: ['*'],
            allowMethods: ['POST'],
        },
    });

    // Warmup scheduler for lambda function
    const warmupSchedulerEventConfig = setup.getResourceConfig('WarmupSchedulerEvent');
    const warmupSchedulerEvent = new aws.cloudwatch.EventRule(warmupSchedulerEventConfig.name, {
        scheduleExpression: 'rate(5 minutes)',
        description: 'Warmup scheduler for lambda function',
        tags: warmupSchedulerEventConfig.tags,
    });

    const warmupSchedulerTargetConfig = setup.getResourceConfig('WarmupSchedulerTarget');
    new aws.cloudwatch.EventTarget(warmupSchedulerTargetConfig.name, {
        rule: warmupSchedulerEvent.name,
        arn: lambdaFunction.arn,
        input: 'warmup',
    });

    // Permission for the warmup scheduler to invoke the lambda function
    const warmupSchedulerPermissionConfig = setup.getResourceConfig('WarmupSchedulerPermission');
    new aws.lambda.Permission(warmupSchedulerPermissionConfig.name, {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: warmupSchedulerEvent.arn,
    });

    return {
        lambdaFunctionExecRoleRole,
        lambdaFunction,
        lambdaFunctionUrl,
    };
}
