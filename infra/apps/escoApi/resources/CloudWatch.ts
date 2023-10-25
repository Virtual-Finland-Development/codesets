import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export async function createCloudWatchLogSubFilter(setup: ISetup, escoApiLambda: aws.lambda.Function) {
    const escoApiLogGroupName = pulumi.interpolate`/aws/lambda/${escoApiLambda.name}`;

    escoApiLogGroupName.apply(async (logGroupName) => {
        const logGroupConfig = setup.getResourceConfig('EscoApiLogGroup');
        const logGroup = new aws.cloudwatch.LogGroup(logGroupConfig.name, {
            name: logGroupName,
            retentionInDays: 30,
            tags: logGroupConfig.tags,
        });
        const lambdaPermission = new aws.lambda.Permission(
            setup.getResourceName('EscoApiErrorSubLambdaFunctionPermission'),
            {
                action: 'lambda:InvokeFunction',
                function: setup.errorSubLambdaArn,
                principal: 'logs.amazonaws.com',
                sourceArn: pulumi.interpolate`${logGroup.arn}:*`,
            }
        );
        new aws.cloudwatch.LogSubscriptionFilter(
            setup.getResourceName('EscoApiCloudWatchLogSubFilter'),
            {
                logGroup: escoApiLogGroupName,
                filterPattern: 'ERROR',
                destinationArn: setup.errorSubLambdaArn,
            },
            {
                dependsOn: [logGroup, lambdaPermission],
            }
        );
    });
}
