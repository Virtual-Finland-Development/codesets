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
        const regions = await setup.regions.getAllRegions();
        for (const region of regions) {
            const logGroupConfig = setup.getResourceConfig(`edgeRegion-${region.name}-logGroup`);
            const logGroup = new aws.cloudwatch.LogGroup(logGroupConfig.name, {
                name: logGroupName,
                retentionInDays: 30,
                tags: logGroupConfig.tags,
            });

            const lambdaPermission = new aws.lambda.Permission(
                setup.getResourceName(`ErrorSubLambdaFunctionPermission-${region.name}`),
                {
                    action: 'lambda:InvokeFunction',
                    function: errorSubLambda.name,
                    principal: 'logs.amazonaws.com',
                    sourceArn: pulumi.interpolate`${logGroup.arn}:*`,
                },
                {
                    provider: region.provider,
                }
            );

            new aws.cloudwatch.LogSubscriptionFilter(
                setup.getResourceName(`CloudWatchLogSubFilter-${region.name}`),
                {
                    logGroup: edgeLambdaLogGroupName,
                    filterPattern: 'ERROR',
                    destinationArn: errorSubLambda.arn,
                },
                {
                    dependsOn: [logGroup, lambdaPermission],
                    provider: region.provider,
                }
            );
        }
    });
}
