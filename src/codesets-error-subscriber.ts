import { CloudWatchLogsEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { gunzipSync } from 'node:zlib';

const snsTopicArn = process.env.SNS_TOPIC_ARN;
const snsClient = new SNSClient({ region: 'eu-north-1' });
const isHandlingTimeout = 1000 * 60; // 1 minute
let isHandlingEvent = false;

// Logs that are sent to a receiving service through a subscription filter are base64 encoded and compressed with the gzip format.
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
export const handler = async (event: CloudWatchLogsEvent) => {
    console.log('[Received Event]:', event);
    if (!isHandlingEvent) {
        isHandlingEvent = true;
        console.log('[Try catch]');
        try {
            if (!snsTopicArn) {
                throw new Error('SNS topic arn could not be read from env.');
            }

            const buffer = Buffer.from(event.awslogs.data, 'base64');
            const decompressedData = gunzipSync(buffer).toString('utf-8');
            const parsed = JSON.parse(decompressedData);
            console.log('[Parsed]:', parsed);
            const message = parsed?.logEvents[0]?.message;
            console.log(JSON.stringify(message, null, 2));
            const messageString = JSON.stringify(message, null, 2);
            console.log('[Message]:', messageString);

            const publishCommand = new PublishCommand({
                TopicArn: snsTopicArn,
                Message: message,
                Subject: `Alarm Testing`,
            });

            await snsClient.send(publishCommand);
            console.log(`Published message to SNS: ${message}`);

            setTimeout(() => (isHandlingEvent = false), isHandlingTimeout);
        } catch (err) {
            isHandlingEvent = false;
            console.error('Error:', err);

            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            };
        }
    }
};
