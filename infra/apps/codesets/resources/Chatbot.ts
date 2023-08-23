import * as aws from '@pulumi/aws';
import * as awsNative from '@pulumi/aws-native';
import { ISetup } from '../../../utils/Setup';

export function createChatbotSlackConfig(setup: ISetup, SnsTopic: aws.sns.Topic) {
    const slackChannelConfig = new awsNative.chatbot.SlackChannelConfiguration(
        setup.getResourceName('SlackChannelConfig'),
        {
            configurationName: 'mySlackChannelConfig',
            iamRoleArn: 'arn:aws:iam::123456789012:role/service-role/AWS_ChatBot_Slack_Role',
            slackChannelId: '',
            slackWorkspaceId: '',
            snsTopicArns: [SnsTopic.arn],
            loggingLevel: 'ERROR',
            userRoleRequired: false,
        }
    );

    return slackChannelConfig;
}
