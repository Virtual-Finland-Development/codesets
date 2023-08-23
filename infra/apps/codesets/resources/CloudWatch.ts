import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { ISetup } from '../../../utils/Setup';

export function createCloudWatchAlarm(setup: ISetup, lambdaFunc: aws.lambda.Function) {
    // Define the custom metric
    const customMetric = new awsx.classic.cloudwatch.Metric({
        name: 'Custom metric',
        namespace: 'Custom namespace',
    });

    // Create the alarm for the custom metric
    const metricAlarm = new aws.cloudwatch.MetricAlarm(setup.getResourceName('CloudWatchCustomAlarm'), {
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        metricName: customMetric.name,
        namespace: customMetric.namespace,
        statistic: 'SampleCount',
        period: 300, // 5 minutes,
        evaluationPeriods: 1,
        threshold: 1,
    });

    // Create the subscription for the Lambda function
    const lambdaSubscription = new aws.cloudwatch.LogSubscriptionFilter(
        setup.getResourceName('CloudWatcCustomAlarmSubscription'),
        {
            logGroup: '/aws/lambda/CloudWatchAlarmLambdaFunction',
            filterPattern: 'SOME CUSTOM PATTERN HERE',
            destinationArn: lambdaFunc.arn,
            // roleArn: ''
        }
    );

    return {
        metricAlarm,
        lambdaSubscription,
    };
}
