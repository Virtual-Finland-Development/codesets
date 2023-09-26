import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ISetup } from '../../../utils/Setup';

const config = new pulumi.Config();

export function createSnsTopicAndSubscriptions(setup: ISetup) {
    // SNS topic for email subs
    const snSTopicForEmail = new aws.sns.Topic(setup.getResourceName('SnsTopicForEmail'));

    // SNS topic for chatbot
    const snsTopicForChatbot = new aws.sns.Topic(setup.getResourceName('SnsTopicForChatbot'));

    // email subscribers
    const emailEndpoints = [''];

    // create sub for each subscriber
    emailEndpoints.forEach((email, i) => {
        new aws.sns.TopicSubscription(setup.getResourceName(`SnsEmailSub-${i + 1}`), {
            protocol: 'email',
            endpoint: email,
            topic: snSTopicForEmail.arn,
        });
    });

    // create sub for slackbot
    /* new aws.sns.TopicSubscription(setup.getResourceName('SnsSlackSub'), {
        protocol: 'https', // chatbot has no dedicated protocol defined, https should suffice
        endpoint: config.require('slackWebhookUrl'), // Slack webhook url
        topic: SnSTopic.arn,
    }); */

    return {
        snSTopicForEmail,
        snsTopicForChatbot,
    };
}
