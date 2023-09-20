import { CloudWatchLogsEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { gunzip } from 'zlib';

const snsClient = new SNSClient({ region: 'eu-north-1' });

const isHandlingTimeout = 1000 * 60; // 1 minute
let isHandlingEvent = false;

// https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
export const handler = async (event: CloudWatchLogsEvent) => {
    if (!isHandlingEvent) {
        isHandlingEvent = true;

        try {
            const snsTopicArn = process.env.SNS_TOPIC_ARN || undefined;

            if (!snsTopicArn) {
                throw new Error('SNS topic arn could not be read from env.');
            }

            const payload = Buffer.from(event.awslogs.data, 'base64');

            gunzip(payload, async (err, result) => {
                if (err) {
                    throw err;
                }

                const data = JSON.parse(result.toString());
                console.log('Event Data:', JSON.stringify(data, null, 2));

                const message = 'Test 123 123.';

                const publishCommand = new PublishCommand({
                    TopicArn: snsTopicArn,
                    Message: message,
                    Subject: `Alarm: ${message}`,
                });

                await snsClient.send(publishCommand);
                console.log(`Published message to SNS: ${message}`);
            });
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setTimeout(() => {
                isHandlingEvent = false;
            }, isHandlingTimeout);
        }
    }
};

/* export const handler = async (event: any) => {
    try {
        console.log(event);
        const snsTopicArn = process.env.SNS_TOPIC_ARN || undefined;

        if (!snsTopicArn) {
            throw new Error('SNS topic arn could not be read from env.');
        }

        // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudwatch-alarm.html
        // ????
        const alarmName: string = event.detail['alarmName'];
        const alarmDescription: string = event.detail['alarmDescription'];
        const alarmStateValue: string = event.detail['newStateValue'];

         const message = `Alarm "${alarmName}" has entered state "${alarmStateValue}" - ${alarmDescription}`;
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
 */
