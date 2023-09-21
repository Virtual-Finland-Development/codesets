import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

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

    const escoApiLambdaFunctionConfig = setup.getResourceConfig('EscoApiLambdaFunction');
    const escoApiLambdaFunction = new aws.lambda.Function(escoApiLambdaFunctionConfig.name, {
        role: escoApiLambdaFunctionExecRoleRole.arn,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        timeout: 30,
        memorySize: 1024,
        code: new pulumi.asset.FileArchive('./dist/escoApi'),
        tags: escoApiLambdaFunctionConfig.tags,
        environment: {
            variables: {
                CODESETS_API_ENDPOINT: pulumi.interpolate`${codesetsUrl}`,
            },
        },
        publish: true,
    });

    const initialInvokeCommand = invokeInitialExecution(setup, escoApiLambdaFunction);

    const escoApiLambdaFunctionUrlConfig = setup.getResourceConfig('EscoApiLambdaFunctionUrl');
    const escoApiLambdaFunctionUrl = new aws.lambda.FunctionUrl(escoApiLambdaFunctionUrlConfig.name, {
        functionName: escoApiLambdaFunction.name,
        authorizationType: 'NONE',
        cors: {
            allowCredentials: false,
            allowOrigins: ['*'],
            allowMethods: ['POST'],
        },
    });

    return {
        lambdaFunctionExecRoleRole: escoApiLambdaFunctionExecRoleRole,
        lambdaFunction: escoApiLambdaFunction,
        lambdaFunctionUrl: escoApiLambdaFunctionUrl,
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
    const invokeConfig = setup.getResourceConfig('EscoApiInitialInvoke');
    const awsConfig = new pulumi.Config('aws');
    const region = awsConfig.require('region');
    return new local.Command(
        invokeConfig.name,
        {
            create: pulumi.interpolate`aws lambda invoke --payload '{"action": "ping"}' --cli-binary-format raw-in-base64-out --function-name ${lambdaFunction.name} --region ${region} /dev/null`,
        },
        { dependsOn: [lambdaFunction] }
    );
}
