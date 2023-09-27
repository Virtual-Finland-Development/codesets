import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { CloudWatchLogsEvent } from 'aws-lambda';
import { gunzipSync } from 'node:zlib';

const stage = process.env.STAGE;
const primaryRegion = process.env.PRIMARY_AWS_REGION;
const snsTopicEmailArn = process.env.SNS_TOPIC_EMAIL_ARN;
const snsTopicChatbotArn = process.env.SNS_TOPIC_CHATBOT_ARN;

// https://stackoverflow.com/questions/60796991/is-there-a-way-to-generate-the-aws-console-urls-for-cloudwatch-log-group-filters
function getLogEventsUrl(logGroupRegion: string, logGroup: string, logStream: string) {
    return `https://console.aws.amazon.com/cloudwatch/home?region=${logGroupRegion}#logEventViewer:group=${logGroup};stream=${logStream}`;
}

// from lambda@edge cloudwatch log subscription filter events, there's no way to get the region from the event itself,
// so we parse it from the subscription filter name as the format is in *our* control and does include the region in the name
function resolveEventRegion(subscriptionFilters: string[] | undefined): string {
    let region = primaryRegion; // default to primary region
    if (subscriptionFilters?.length) {
        // Match the region from the subscription filter name, which is defined in the pulumi cloudwatch related definitions
        // Eg. codesets-CloudWatchLogSubFilter-eu-central-1-dev-c1c1724 -> eu-central-1
        const regexp = new RegExp(`codesets-CloudWatchLogSubFilter-(.*)-${stage}-(.*)`);
        const subscriptionFilter = subscriptionFilters[0];
        const match = subscriptionFilter.match(regexp);
        if (match?.length) {
            region = match[1];
        }
    }

    if (!region) throw new Error('Could not resolve event region.');
    return region;
}

function getCodesetsDashboardUrl() {
    return `https://${primaryRegion}.console.aws.amazon.com/cloudwatch/home?region=${primaryRegion}#dashboards/dashboard/codesets-dashboard-${stage}`;
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

function transformTextToMarkdown(text: string) {
    // Newlines of the form \\n are escaped to \n
    text = text.replace(/\\\n/g, '\n');
    // Newlines of the form \\n are escaped to \n
    text = text.replace(/\\n/g, '\n');
    // Tabs of the form \\t are escaped to \t
    text = text.replace(/\\t/g, '\t');
    // Quotes of the form \\" are escaped to \"
    text = text.replace(/\\"/g, '"');
    // The first and last quote are removed
    text = text.replace(/^"/, '').replace(/"$/, '');
    return text;
}

const snsClient = new SNSClient({ region: primaryRegion });
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
            if (!stage || !primaryRegion || !snsTopicEmailArn || !snsTopicChatbotArn) {
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

            const codesetsDashboardUrl = getCodesetsDashboardUrl();
            let logEventsUrl = undefined;
            let emailMessage = `${messageString}\n\nView dashboard: ${codesetsDashboardUrl}`;

            if (logGroup && logStream) {
                const logGroupRegion = resolveEventRegion(parsed?.subscriptionFilters);
                logEventsUrl = getLogEventsUrl(logGroupRegion, logGroup, logStream);
                emailMessage = `${emailMessage}\n\nView in AWS console: ${logEventsUrl}}`;
            }

            // for chatbot / slack integration, custom format needed
            // https://docs.aws.amazon.com/chatbot/latest/adminguide/custom-notifs.html
            const chatbotCustomFormat = {
                version: '1.0',
                source: 'custom',
                content: {
                    title: ':boom: Codesets Error! :boom:',
                    description: transformTextToMarkdown(messageString),
                    nextSteps: [
                        // https://api.slack.com/reference/surfaces/formatting#links-in-retrieved-messages
                        ...(logEventsUrl ? [`<${logEventsUrl}|View in AWS console>`] : []),
                        `<${codesetsDashboardUrl}|View dashboard>`,
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
