import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export function createErrorSubLambdaFunction(
    setup: ISetup,
    snsTopicForEmail: aws.sns.Topic,
    snsTopicForChatbot: aws.sns.Topic
) {
    const execRoleConfig = setup.getResourceConfig('ErrorSubLambdaFunctionExecRole');

    const functionExecRole = new aws.iam.Role(
        execRoleConfig.name,
        {
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
        },
        {
            provider: setup.regions.edgeRegion.provider,
        }
    );

    // Assign SNS publish policy
    new aws.iam.RolePolicy(
        setup.getResourceName('ErrorSubLambdaSnsPublishPolicy'),
        {
            role: functionExecRole.id,
            policy: pulumi.output({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: 'sns:Publish',
                        Resource: [snsTopicForEmail.arn, snsTopicForChatbot.arn],
                    },
                ],
            }),
        },
        {
            provider: setup.regions.edgeRegion.provider,
        }
    );

    // Attach basic lambda execution policy
    new aws.iam.RolePolicyAttachment(setup.getResourceName('ErrorSubLambdaFunctionExecRolePolicyAttachment'), {
        role: functionExecRole,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const functionConfig = setup.getResourceConfig('ErrorSubLambdaFunction');

    const lambdaFunction = new aws.lambda.Function(
        functionConfig.name,
        {
            role: functionExecRole.arn,
            runtime: 'nodejs18.x',
            handler: 'codesets-error-subscriber.handler',
            timeout: 60,
            memorySize: 256,
            code: new pulumi.asset.FileArchive('./dist/codesets'),
            tags: functionConfig.tags,
            environment: {
                variables: {
                    STAGE: setup.stage,
                    LOG_GROUPS_REGION: pulumi.interpolate`${setup.regions.edgeRegion.provider.region}`,
                    SNS_TOPIC_EMAIL_ARN: snsTopicForEmail.arn,
                    SNS_TOPIC_CHATBOT_ARN: snsTopicForChatbot.arn,
                },
            },
        },
        {
            provider: setup.regions.edgeRegion.provider,
        }
    );

    return lambdaFunction;
}
