import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import { getResourceName, getTags, organizationName, regions, stage } from '../setup';

export default function createLambdaAtEdgeFunction(s3BucketSetup: { name: string; bucket: aws.s3.Bucket }) {
    const lambdaAtEdgeRole = new aws.iam.Role(
        getResourceName('LambdaAtEdgeRole'),
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
            tags: getTags(),
        },
        { provider: regions.edgeRegion.provider }
    );

    new aws.iam.RolePolicy(
        getResourceName('LambdaAtEdgeRolePolicy'),
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
        { provider: regions.edgeRegion.provider }
    );

    // Esco API reference
    const escoApiEndpoint = new pulumi.StackReference(`${organizationName}/esco-api/${stage}`).getOutput('escoApiUrl');

    // pass the bucket name and other environment variables to the lambda function dist folder
    // ..as lambda@edge does not support environment variables
    fs.writeFileSync(
        './dist/build/environment.json',
        JSON.stringify({
            escoApi: {
                endpoint: pulumi.interpolate`${escoApiEndpoint}`,
            },
            s3Bucket: {
                name: s3BucketSetup.name,
                region: regions.resourcesRegion.name,
            },
        })
    );

    const lambdaAtEdgeFunction = new aws.lambda.Function(
        getResourceName('LambdaAtEdge'),
        {
            code: new pulumi.asset.FileArchive('./dist'),
            handler: 'codesets.handler',
            runtime: 'nodejs18.x',
            memorySize: 256,
            timeout: 30,
            role: lambdaAtEdgeRole.arn,
            tags: getTags(),
            publish: true,
        },
        { provider: regions.edgeRegion.provider }
    );

    return {
        lambdaAtEdgeFunction,
        lambdaAtEdgeRole,
    };
}
