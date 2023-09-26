import { CloudWatchLogsEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { gunzipSync } from 'node:zlib';

const stage = process.env.STAGE;
const logGroupsRegion = process.env.LOG_GROUPS_REGION;
const snsTopicEmailArn = process.env.SNS_TOPIC_EMAIL_ARN;
const snsTopicChatbotArn = process.env.SNS_TOPIC_CHATBOT_ARN;

// https://stackoverflow.com/questions/60796991/is-there-a-way-to-generate-the-aws-console-urls-for-cloudwatch-log-group-filters
function getLogEventsUrl(logGroup: string, logStream: string) {
    return `https://console.aws.amazon.com/cloudwatch/home?region=${logGroupsRegion}#logEventViewer:group=${logGroup};stream=${logStream}`;
}

function getCodesetsDashboardUrl() {
    return `https://${logGroupsRegion}.console.aws.amazon.com/cloudwatch/home?region=${logGroupsRegion}#dashboards/dashboard/codesets-dashboard-${stage}`;
}

function publishSnsMessage(topicArn: string, message: string) {
    return snsClient.send(
        new PublishCommand({
            TopicArn: topicArn,
            Subject: 'Codesets Error!',
            Message: message,
        })
    );
}

const snsClient = new SNSClient({ region: 'eu-north-1' });
const isHandlingTimeout = 1000 * 60; // 1 minute
let isHandlingEvent = false;

// Logs that are sent to a receiving service through a subscription filter are base64 encoded and compressed with the gzip format.
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
export const handler = async (event: CloudWatchLogsEvent) => {
    console.log('[Received Event]:', event);

    if (!isHandlingEvent) {
        // prevent consecutive executions (at least in theory)
        isHandlingEvent = true;

        try {
            if (!stage || !logGroupsRegion || !snsTopicEmailArn || !snsTopicChatbotArn) {
                throw new Error('Required environment variables are missing.');
            }

            const buffer = Buffer.from(event.awslogs.data, 'base64');
            const decompressedData = gunzipSync(buffer).toString('utf-8');
            const parsed = JSON.parse(decompressedData);
            console.log('[Parsed]:', parsed);
            const message = parsed?.logEvents[0]?.message ?? 'Message could not be parsed.';
            const messageString = JSON.stringify(message, null, 2);
            console.log('[Message]:', messageString);

            const logGroup = parsed?.logGroup;
            const logStream = parsed?.logStream;

            let awsConsoleUrl = undefined;
            let emailMessage = `${messageString}\n\nView dashboard: ${getCodesetsDashboardUrl()}`;

            if (logGroup && logStream) {
                awsConsoleUrl = getLogEventsUrl(logGroup, logStream);
                emailMessage = `${emailMessage}\n\nView in AWS console: ${awsConsoleUrl}}`;
            }

            // for chatbot / slack integration, custom format needed
            // https://docs.aws.amazon.com/chatbot/latest/adminguide/custom-notifs.html
            const chatbotCustomFormat = {
                version: '1.0',
                source: 'custom',
                content: {
                    title: ':boom: Codesets Error! :boom:',
                    description: messageString,
                    nextSteps: [
                        // https://api.slack.com/reference/surfaces/formatting#links-in-retrieved-messages
                        ...(awsConsoleUrl ? [`<${awsConsoleUrl}|View in AWS console>`] : []),
                        `<${getCodesetsDashboardUrl()}|View dashboard>`,
                    ],
                },
            };

            // publish to sns topics
            await Promise.all([
                publishSnsMessage(snsTopicEmailArn, emailMessage),
                publishSnsMessage(snsTopicChatbotArn, JSON.stringify(chatbotCustomFormat)),
            ]);

            // clear flag after timeout
            setTimeout(() => (isHandlingEvent = false), isHandlingTimeout);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Codesets error passed to SNS topics' }),
            };
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
