import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export function createErrorSubLambdaFunction(setup: ISetup, SnsTopic: aws.sns.Topic) {
    const execRoleConfig = setup.getResourceConfig('ErrorSubLambdaFunctionExecRole');

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

    // Attach basic lambda execution policy
    new aws.iam.RolePolicyAttachment(setup.getResourceName('ErrorSubLambdaFunctionExecRolePolicyAttachment'), {
        role: functionExecRole,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const functionConfig = setup.getResourceConfig('ErrorSubLambdaFunction');

    const lambdaFunction = new aws.lambda.Function(functionConfig.name, {
        role: functionExecRole.arn,
        runtime: 'nodejs18.x',
        handler: 'codesets-error-subscriber.handler',
        timeout: 900, // 15 minutes
        memorySize: 512, // how much needed?
        code: new pulumi.asset.FileArchive('./dist/codesets'),
        tags: functionConfig.tags,
        environment: {
            variables: {
                SNS_TOPIC_ARN: SnsTopic.arn,
            },
        },
    });

    return lambdaFunction;
}

export function grantLambdaPermissionForCloudWatch(
    setup: ISetup,
    codesetsLambda: aws.lambda.Function,
    errorSubLambda: aws.lambda.Function
) {
    /**
     * FROM aws.cloudwatch.LogSubscriptionFilter.roleArn
     * The ARN of an IAM role that grants Amazon CloudWatch Logs permissions to deliver ingested log events to the destination.
     * If you use Lambda as a destination, you should skip this argument and use aws.lambda.Permission resource for granting access from CloudWatch logs to the destination Lambda function.
     */
    const edgeLambdaLogGroupName = pulumi.interpolate`/aws/lambda/us-east-1.${codesetsLambda.name}`;
    const logGroupSourceArn = edgeLambdaLogGroupName.apply((name) =>
        aws.cloudwatch.getLogGroup({ name }).then((logGroup) => logGroup.arn)
    );

    const lambdaPermission = new aws.lambda.Permission(setup.getResourceName('ErrorSubLambdaFunctionPermission'), {
        action: 'lambda:InvokeFunction',
        function: errorSubLambda.name,
        principal: 'logs.us-east-1.amazonaws.com',
        sourceArn: logGroupSourceArn,
    });

    return lambdaPermission;
}
