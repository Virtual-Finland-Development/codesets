import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import { ISetup } from '../utils/Setup';
export default function createLambdaAtEdgeFunction(setup: ISetup, bucketName: string) {

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

    // pass the bucket name to the lambda function dist folder
    fs.writeFileSync('./dist/build/bucket-info.json', JSON.stringify({ bucketName }));
    console.log("Wrote bucket info to dist folder");
    
    const lambdaAtEdgeFunctionConfig = setup.getResourceConfig('LambdaAtEdge');
    const lambdaAtEdgeFunction = new aws.lambda.Function(lambdaAtEdgeFunctionConfig.name, {
        code: new pulumi.asset.FileArchive('./dist'),
        handler: 'app.handler',
        runtime: 'nodejs18.x',
        memorySize: 256,
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

// 