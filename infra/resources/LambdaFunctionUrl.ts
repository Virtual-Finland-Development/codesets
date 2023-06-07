import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../utils/Setup';

export function createEscoApiLambdaFunctionUrl(setup: ISetup, codesetsUrl: pulumi.Output<string>) {
    const escoApiLambdaFunctionExecRoleConfig = setup.getResourceConfig('EscoApiLambdaFunctionExecRole');
    const escoApiLambdaFunctionExecRoleRole = new aws.iam.Role(escoApiLambdaFunctionExecRoleConfig.name, {
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
        tags: escoApiLambdaFunctionExecRoleConfig.tags,
    });

    const escoApiLambdaFunctionExecRolePolicy = setup.getResourceConfig('EscoApiLambdaFunctionExecRolePolicy');
    new aws.iam.RolePolicy(escoApiLambdaFunctionExecRolePolicy.name, {
        role: escoApiLambdaFunctionExecRoleRole.id,
        policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: 'arn:aws:logs:*:*:*',
                    Effect: 'Allow',
                },
            ],
        }),
    });

    const escoApiConfig = new pulumi.Config('escoApi');
    const escoApiRegionConfig = setup.getResourceConfig('EscoApiRegion');
    const escoApiRegion = new aws.Provider(escoApiRegionConfig.name, {
        region: escoApiConfig.require('awsRegion') as aws.Region,
    });

    const escoApiLambdaFunctionConfig = setup.getResourceConfig('EscoApiLambdaFunction');
    const escoApiLambdaFunction = new aws.lambda.Function(
        escoApiLambdaFunctionConfig.name,
        {
            role: escoApiLambdaFunctionExecRoleRole.arn,
            runtime: 'nodejs18.x',
            handler: 'index.handler',
            timeout: 30,
            memorySize: 256,
            code: new pulumi.asset.FileArchive('./dist/escoApi'),
            tags: escoApiLambdaFunctionConfig.tags,
            environment: {
                variables: {
                    CODESETS_API_ENDPOINT: pulumi.interpolate`${codesetsUrl}`,
                },
            },
        },
        { provider: escoApiRegion }
    );

    const escoApiLambdaFunctionUrlConfig = setup.getResourceConfig('EscoApiLambdaFunctionUrl');
    const escoApiLambdaFunctionUrl = new aws.lambda.FunctionUrl(
        escoApiLambdaFunctionUrlConfig.name,
        {
            functionName: escoApiLambdaFunction.name,
            authorizationType: 'NONE',
            cors: {
                allowCredentials: false,
                allowOrigins: ['*'],
                allowMethods: ['POST'],
            },
        },
        { provider: escoApiRegion }
    );

    // Warmup scheduler for lambda function
    if (setup.isProductionLikeEnvironment()) {
        setupLambdaWarmerScheduler(setup, escoApiLambdaFunction, escoApiRegion);
    }

    return {
        lambdaFunctionExecRoleRole: escoApiLambdaFunctionExecRoleRole,
        lambdaFunction: escoApiLambdaFunction,
        lambdaFunctionUrl: escoApiLambdaFunctionUrl,
    };
}

function setupLambdaWarmerScheduler(
    setup: ISetup,
    escoApiLambdaFunction: aws.lambda.Function,
    escoApiRegion: aws.Provider
) {
    const escoApiWarmupSchedulerEventConfig = setup.getResourceConfig('EscoApiWarmupSchedulerEvent');
    const escoApiWarmupSchedulerEvent = new aws.cloudwatch.EventRule(
        escoApiWarmupSchedulerEventConfig.name,
        {
            scheduleExpression: 'rate(5 minutes)',
            description: 'Warmup scheduler for Esco API lambda function',
            tags: escoApiWarmupSchedulerEventConfig.tags,
        },
        { provider: escoApiRegion }
    );

    const escoApiWarmupSchedulerTargetConfig = setup.getResourceConfig('EscoApiWarmupSchedulerTarget');
    new aws.cloudwatch.EventTarget(
        escoApiWarmupSchedulerTargetConfig.name,
        {
            rule: escoApiWarmupSchedulerEvent.name,
            arn: escoApiLambdaFunction.arn,
            input: JSON.stringify({ source: 'warmup' }),
        },
        { provider: escoApiRegion }
    );

    // Permission for the warmup scheduler to invoke the lambda function
    const escoApiWarmupSchedulerPermissionConfig = setup.getResourceConfig('EscoApiWarmupSchedulerPermission');
    new aws.lambda.Permission(
        escoApiWarmupSchedulerPermissionConfig.name,
        {
            action: 'lambda:InvokeFunction',
            function: escoApiLambdaFunction.name,
            principal: 'events.amazonaws.com',
            sourceArn: escoApiWarmupSchedulerEvent.arn,
        },
        { provider: escoApiRegion }
    );
}
