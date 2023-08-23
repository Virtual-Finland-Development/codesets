import * as aws from '@pulumi/aws';
import { ISetup } from '../../../utils/Setup';

export function createSnsTopicAndSubscriptions(setup: ISetup) {
    // SNS topic
    const SNSTopic = new aws.sns.Topic(setup.getResourceName('SNSTopic'));

    // email subscribers
    const emailEndpoints = ['email1@email.com', 'email2@email.com'];

    // create sub for each subscriber
    emailEndpoints.map((email, i) => {
        new aws.sns.TopicSubscription(setup.getResourceName(`SNSEmailSub-${i + 1}`), {
            protocol: 'email',
            endpoint: email,
            topic: SNSTopic.arn,
        });
    });

    return SNSTopic;
}
