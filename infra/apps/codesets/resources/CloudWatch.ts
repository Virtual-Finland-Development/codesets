import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ISetup } from '../../../utils/Setup';

export async function createCloudWatchLogSubFilter(
    setup: ISetup,
    codesetsLambda: aws.lambda.Function,
    errorSubLambda: aws.lambda.Function,
    lambdaPermission: aws.lambda.Permission
) {
    const edgeLambdaLogGroupName = pulumi.interpolate`/aws/lambda/${codesetsLambda.name}`; // us-east-1.

    const logSubFilter = new aws.cloudwatch.LogSubscriptionFilter(
        setup.getResourceName('CloudWatchLogSubFilter'),
        {
            logGroup: edgeLambdaLogGroupName,
            filterPattern: 'ERROR',
            destinationArn: errorSubLambda.arn,
        },
        {
            dependsOn: [lambdaPermission],
        }
    );

    return {
        logSubFilter,
    };
}
