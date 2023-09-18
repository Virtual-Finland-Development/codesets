import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { ISetup } from '../../../utils/Setup';

export async function createCloudWatchAlarm(
    setup: ISetup,
    edgeLambda: aws.lambda.Function,
    cloudWatchAlarmLambda: aws.lambda.Function
) {
    // Define the custom metric
    /* const customMetric = new awsx.classic.cloudwatch.Metric({
        name: 'Custom metric',
        namespace: 'Custom namespace',
    }); */

    // Create the alarm for the custom metric
    /* const metricAlarm = new aws.cloudwatch.MetricAlarm(setup.getResourceName('CloudWatchCustomAlarm'), {
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        metricName: customMetric.name,
        namespace: customMetric.namespace,
        statistic: 'SampleCount',
        period: 300, // 5 minutes,
        evaluationPeriods: 1,
        threshold: 1,
    }); */

    const edgeLambdaLogGroupName = pulumi.interpolate`/aws/lambda/us-east-1.${edgeLambda.name}`;

    // Create the subscription for the Lambda function
    const lambdaSubscription = new aws.cloudwatch.LogSubscriptionFilter(
        setup.getResourceName('CloudWatcCustomAlarmSubscription'),
        {
            logGroup: edgeLambdaLogGroupName,
            filterPattern: 'ERROR',
            destinationArn: cloudWatchAlarmLambda.arn,
            // roleArn: ''
        }
    );

    return {
        // metricAlarm,
        lambdaSubscription,
    };
}
