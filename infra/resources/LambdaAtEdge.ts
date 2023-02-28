import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../tools/Setup';

export default function createLambdaAtEdgeFunction(setup: ISetup, cloudFrontDistribution: aws.cloudfront.Distribution) {

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
    
    const lambdaAtEdgeFunctionConfig = setup.getResourceConfig('LambdaAtEdge');
    const lambdaAtEdgeFunction = new aws.lambda.Function(lambdaAtEdgeFunctionConfig.name, {
        code: new pulumi.asset.FileArchive('../dist'),
        handler: 'app.handler',
        runtime: 'nodejs18.x',
        memorySize: 128,
        timeout: 10,
        role: lambdaAtEdgeRole.arn,
        tags: lambdaAtEdgeFunctionConfig.tags,
    });

    const LambdaAtEdgePermissionConfig = setup.getResourceConfig('LambdaAtEdgePermission');
    new aws.lambda.Permission(LambdaAtEdgePermissionConfig.name, {
        action: 'lambda:GetFunction',
        function: lambdaAtEdgeFunction.name,
        principal: 'edgelambda.amazonaws.com',
        sourceArn: cloudFrontDistribution.arn,
    });

    return lambdaAtEdgeFunction;
}