import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import { ISetup } from '../../../utils/Setup';
export default function createLambdaAtEdgeFunction(
    setup: ISetup,
    s3BucketSetup: { name: string; bucket: aws.s3.Bucket }
) {
    const lambdaAtEdgeRoleConfig = setup.getResourceConfig('LambdaAtEdgeRole');
    const lambdaAtEdgeRole = new aws.iam.Role(
        lambdaAtEdgeRoleConfig.name,
        {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Principal: {
                            Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
                        },
                        Effect: 'Allow',
                    },
                ],
            }),
            tags: lambdaAtEdgeRoleConfig.tags,
        },
        { provider: setup.edgeRegion }
    );

    const lambdaAtEdgeRolePolicyConfig = setup.getResourceConfig('LambdaAtEdgeRolePolicy');
    new aws.iam.RolePolicy(
        lambdaAtEdgeRolePolicyConfig.name,
        {
            role: lambdaAtEdgeRole.id,
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
        },
        { provider: setup.edgeRegion }
    );

    // pass the bucket name to the lambda function dist folder
    fs.writeFileSync(
        './dist/codesets/build/bucket-info.json',
        JSON.stringify({
            name: s3BucketSetup.name,
        })
    );

    const lambdaAtEdgeFunctionConfig = setup.getResourceConfig('LambdaAtEdge');
    const lambdaAtEdgeFunction = new aws.lambda.Function(
        lambdaAtEdgeFunctionConfig.name,
        {
            code: new pulumi.asset.FileArchive('./dist/codesets'),
            handler: 'codesets.handler',
            runtime: 'nodejs18.x',
            memorySize: 256,
            timeout: 30,
            role: lambdaAtEdgeRole.arn,
            tags: lambdaAtEdgeFunctionConfig.tags,
            publish: true,
        },
        { provider: setup.edgeRegion }
    );

    const initialInvokeCommand = invokeInitialExecution(setup, lambdaAtEdgeFunction);

    return {
        lambdaAtEdgeFunction,
        lambdaAtEdgeRole,
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
    const invokeConfig = setup.getResourceConfig('LambdaAtEdgeInitialInvoke');
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
