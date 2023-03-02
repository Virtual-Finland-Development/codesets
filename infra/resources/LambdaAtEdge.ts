import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import { ISetup } from '../tools/Setup';

export default function createLambdaAtEdgeFunction(setup: ISetup, s3bucket: aws.s3.Bucket) {

    const lambdaAtEdgeRoleConfig = setup.getResourceConfig('LambdaAtEdgeRole');
    const lambdaAtEdgeRole = new aws.iam.Role(lambdaAtEdgeRoleConfig.name, {
        assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: [ 
                            'lambda.amazonaws.com', 
                            'edgelambda.amazonaws.com' 
                        ],
                    },
                    Effect: 'Allow',
                },
            ],
        }),
        tags: lambdaAtEdgeRoleConfig.tags,
    });

    const lambdaAtEdgeRolePolicyConfig = setup.getResourceConfig('LambdaAtEdgeRolePolicy');
    new aws.iam.RolePolicy(lambdaAtEdgeRolePolicyConfig.name, {
        role: lambdaAtEdgeRole.id,
        policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                    Resource: 'arn:aws:logs:*:*:*',
                    Effect: 'Allow',
                }
            ],
        }),
    });
    
    // Write bucket name to file
    const bucketName = s3bucket.bucket;
    fs.writeFileSync('./dist/build/bucket-info.json', JSON.stringify({ bucketName }));

    const lambdaAtEdgeFunctionConfig = setup.getResourceConfig('LambdaAtEdge');
    const lambdaAtEdgeFunction = new aws.lambda.Function(lambdaAtEdgeFunctionConfig.name, {
        code: new pulumi.asset.FileArchive('./dist'),
        handler: 'app.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        role: lambdaAtEdgeRole.arn,
        tags: lambdaAtEdgeFunctionConfig.tags,
        publish: true,
    }); 
    // { provider: new aws.Provider("us-east-1", { region: "us-east-1"} ) }
    // Lambda@Edge functions must be in us-east-1

    return {
        lambdaAtEdgeFunction,
        lambdaAtEdgeRole,
    };
}