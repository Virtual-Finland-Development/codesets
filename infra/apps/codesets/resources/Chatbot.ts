import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsNative from '@pulumi/aws-native';
import { ISetup } from '../../../utils/Setup';

const config = new pulumi.Config();

export function createChatbotSlackConfig(setup: ISetup, snsTopic: aws.sns.Topic) {
    // Create an IAM role for Chatbot configuration
    const chatbotRole = new aws.iam.Role(setup.getResourceName('ChatBotRole'), {
        description: 'IAM role for AWS Chatbot',
        assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'chatbot.amazonaws.com',
                    },
                },
            ],
        }),
    });

    // Attach policies to the role as needed (e.g., AWS managed policies or custom policies)
    /* new aws.iam.RolePolicy(setup.getResourceName('ChatBotPolicy'), {
        role: chatbotRole.id,
        policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowReadActionsOnSNS',
                    Effect: 'Allow',
                    Action: ['sns:ListTopics', 'sns:GetTopicAttributes', 'sns:Receive'],
                    Resource: '*',
                },
            ],
        }),
    }); */

    const slackChannelConfig = new awsNative.chatbot.SlackChannelConfiguration(
        setup.getResourceName('SlackChannelConfig'),
        {
            configurationName: 'SlackChannelAlertsConfig',
            iamRoleArn: chatbotRole.arn,
            slackChannelId: config.require('slackChannelId'),
            slackWorkspaceId: config.require('slackWorkspaceId'),
            snsTopicArns: [snsTopic.arn],
            loggingLevel: 'ERROR',
            userRoleRequired: false,
        }
    );

    return slackChannelConfig;
}
