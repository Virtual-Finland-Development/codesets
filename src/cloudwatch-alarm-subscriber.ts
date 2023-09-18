// import { CloudWatchLogsEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: 'eu-north-1' });

export const handler = async (event: any) => {
    try {
        console.log(event);
        const snsTopicArn = process.env.SNS_TOPIC_ARN || undefined;

        if (!snsTopicArn) {
            throw new Error('SNS topic arn could not be read from env.');
        }

        // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudwatch-alarm.html
        // ????
        /* const alarmName: string = event.detail['alarmName'];
        const alarmDescription: string = event.detail['alarmDescription'];
        const alarmStateValue: string = event.detail['newStateValue']; */

        /*  const message = `Alarm "${alarmName}" has entered state "${alarmStateValue}" - ${alarmDescription}`; */
        const message = 'Test 123 123.';

        const publishCommand = new PublishCommand({
            TopicArn: snsTopicArn,
            Message: message,
            Subject: `CloudWatch Alarm: ${message}`,
        });

        await snsClient.send(publishCommand);
        console.log(`Published message to SNS: ${message}`);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
