import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export async function createCloudWatchLogSubFilter(
    setup: ISetup,
    codesetsLambda: aws.lambda.Function,
    errorSubLambda: aws.lambda.Function
) {
    const edgeLambdaLogGroupName = pulumi.interpolate`/aws/lambda/${codesetsLambda.name}`;
    edgeLambdaLogGroupName.apply(async (logGroupName) => {
        const providers = await setup.regions.getProviders();
        for (const provider of providers) {
            const logGroupConfig = setup.getResourceConfig(`edgeRegion-${provider.name}-logGroup`);
            const logGroup = new aws.cloudwatch.LogGroup(logGroupConfig.name, {
                name: logGroupName,
                retentionInDays: 30,
                tags: logGroupConfig.tags,
            });

            const lambdaPermission = new aws.lambda.Permission(
                setup.getResourceName(`ErrorSubLambdaFunctionPermission-${provider.name}`),
                {
                    action: 'lambda:InvokeFunction',
                    function: errorSubLambda.name,
                    principal: 'logs.amazonaws.com',
                    sourceArn: pulumi.interpolate`${logGroup.arn}:*`,
                },
                {
                    provider: provider.provider,
                }
            );

            new aws.cloudwatch.LogSubscriptionFilter(
                setup.getResourceName(`CloudWatchLogSubFilter-${provider.name}`),
                {
                    logGroup: edgeLambdaLogGroupName,
                    filterPattern: 'ERROR',
                    destinationArn: errorSubLambda.arn,
                },
                {
                    dependsOn: [logGroup, lambdaPermission],
                    provider: provider.provider,
                }
            );
        }
    });
}
