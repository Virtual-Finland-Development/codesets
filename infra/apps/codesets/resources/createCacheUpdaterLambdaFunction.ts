
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export default function createCacheUpdaterLambdaFunction(setup: ISetup, s3Bucket: aws.s3.Bucket) {

    const execRoleConfig = setup.getResourceConfig('CodesetsCacheUpdaterLambdaFunctionExecRole');
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
    new aws.iam.RolePolicy(
        setup.getResourceName('CodesetsCacheUpdaterLambdaFunctionExecRoleS3RwPolicy'),
        {
            role: functionExecRole,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: ['s3:GetObject', 's3:PutObject'],
                        Resource: s3Bucket.arn + '/*',
                        Effect: 'Allow',
                    },
                ],
            }),
        }
    );
    
    // Attach basic lambda execution policy
    new aws.iam.RolePolicyAttachment(
        setup.getResourceName('CodesetsCacheUpdaterLambdaFunctionExecRolePolicyAttachment'),
        {
            role: functionExecRole,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }
    );

    const functionConfig = setup.getResourceConfig('CodesetsCacheUpdaterLambdaFunction');
    const lambdaFunction = new aws.lambda.Function(
        functionConfig.name,
        {
            role: functionExecRole.arn,
            runtime: 'nodejs18.x',
            handler: 'codesets-cache-updater.handler',
            timeout: 900, // 15 minutes
            memorySize: 1024,
            code: new pulumi.asset.FileArchive('./dist/codesets'),
            tags: functionConfig.tags,
        }
    );

    return lambdaFunction;
}