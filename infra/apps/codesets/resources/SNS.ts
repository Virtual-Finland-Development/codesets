import * as aws from '@pulumi/aws';
import { ISetup } from '../../../utils/Setup';

export function createSnsTopicAndSubscriptions(setup: ISetup) {
    // SNS topic
    const SnSTopic = new aws.sns.Topic(setup.getResourceName('SnsTopic'));

    // email subscribers
    const emailEndpoints = ['email1@email.com', 'email2@email.com'];

    // create sub for each subscriber
    emailEndpoints.map((email, i) => {
        new aws.sns.TopicSubscription(setup.getResourceName(`SnsEmailSub-${i + 1}`), {
            protocol: 'email',
            endpoint: email,
            topic: SnSTopic.arn,
        });
    });

    // create sub for slackbot
    new aws.sns.TopicSubscription(setup.getResourceName('SnsSlackSub'), {
        protocol: 'https', // chatbot has no dedicated protocol defined, https should suffice
        endpoint: 'https://hooks.slack.com/services/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX', // SLACK WEBHOOK URL
        topic: SnSTopic.arn,
    });

    return SnSTopic;
}