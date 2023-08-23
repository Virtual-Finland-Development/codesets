import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export function createCloudWatchAlarmLambdaFunction(setup: ISetup, SnsTopic: aws.sns.Topic) {
    const execRoleConfig = setup.getResourceConfig('CloudWatchAlarmLambdaFunctionExecRole');

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
    new aws.iam.RolePolicyAttachment(setup.getResourceName('CloudWatchAlarmLambdaFunctionExecRolePolicyAttachment'), {
        role: functionExecRole,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const functionConfig = setup.getResourceConfig('CloudWatchAlarmLambdaFunction');

    const lambdaFunction = new aws.lambda.Function(functionConfig.name, {
        role: functionExecRole.arn,
        runtime: 'nodejs18.x',
        handler: 'cloudwatch-alarm-subscriber.handler',
        timeout: 900, // 15 minutes
        memorySize: 1024,
        code: new pulumi.asset.FileArchive('./dist/codesets'),
        tags: functionConfig.tags,
        environment: {
            variables: {
                SNS_TOPIC_ARN: SnsTopic.arn,
            },
        },
    });

    /**
     * FROM aws.cloudwatch.LogSubscriptionFilter.roleArn
     * The ARN of an IAM role that grants Amazon CloudWatch Logs permissions to deliver ingested log events to the destination.
     * If you use Lambda as a destination, you should skip this argument and use aws.lambda.Permission resource for granting access from CloudWatch logs to the destination Lambda function.
     *
     * ----- not sure if needed. If cloudwatch related stuff should be refined as sourceArn, might create circular deps situation
     */
    new aws.lambda.Permission(setup.getResourceName('CloudWatchLambdaPermission'), {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        // sourceArn: '???'
    });

    return lambdaFunction;
}
