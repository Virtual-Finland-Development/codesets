import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getResourceName, getTags, organizationName, regions, stage } from '../setup';

interface LogSubFilterConfig {
    logGroupName: string;
    lambdaPermissionName: string;
    logSubFilterName: string;
    region: {
        name: string;
        provider: aws.Provider;
    };
}

function createLogSubscriptionFilter(
    errorSubLambdaArn: pulumi.Output<any>,
    lambdaLogGroupName: pulumi.Output<string>,
    logSubFilterConfig: LogSubFilterConfig
) {
    const { logGroupName, lambdaPermissionName, logSubFilterName, region } = logSubFilterConfig;

    const logGroup = new aws.cloudwatch.LogGroup(
        getResourceName(logGroupName),
        {
            name: lambdaLogGroupName,
            retentionInDays: 30,
            tags: getTags(),
        },
        {
            provider: region.provider,
        }
    );

    const lambdaPermission = new aws.lambda.Permission(
        getResourceName(lambdaPermissionName),
        {
            action: 'lambda:InvokeFunction',
            function: errorSubLambdaArn,
            principal: 'logs.amazonaws.com',
            sourceArn: pulumi.interpolate`${logGroup.arn}:*`,
        },
        {
            provider: regions.resourcesRegion.provider, // error sub lambda located in eu-north-1, for edge lambda specific target needed
        }
    );

    new aws.cloudwatch.LogSubscriptionFilter(
        getResourceName(logSubFilterName),
        {
            logGroup: lambdaLogGroupName,
            filterPattern: 'ERROR',
            destinationArn: errorSubLambdaArn,
        },
        {
            dependsOn: [logGroup, lambdaPermission],
            provider: region.provider,
        }
    );
}

export async function createCloudWatchLogSubFilter(
    lambda: aws.lambda.Function,
    lambdaType: 'codesets' | 'cache-updater'
) {
    const errorSubLambdaArn = new pulumi.StackReference(
        `${organizationName}/cloudwatch-logs-alerts/${stage}`
    ).getOutput('errorSubLambdaFunctionArn');

    // for codesets lambda, we need to create the log subscription filter in all edge regions with region specific provider settings
    if (lambdaType === 'codesets') {
        const lambdaLogGroupName = pulumi.interpolate`/aws/lambda/us-east-1.${lambda.name}`;
        const allRegions = await regions.getAllRegions();

        for (const region of allRegions) {
            createLogSubscriptionFilter(errorSubLambdaArn, lambdaLogGroupName, {
                logGroupName: `EdgeRegion-${region.name}-logGroup`,
                lambdaPermissionName: `ErrorSubLambdaFunctionPermission-${region.name}`,
                logSubFilterName: `EdgeRegion-CloudWatchLogSubFilter-${region.name}`,
                region,
            });
        }
    } else {
        createLogSubscriptionFilter(errorSubLambdaArn, pulumi.interpolate`/aws/lambda/${lambda.name}`, {
            logGroupName: 'CacheUpdaterLogGroup',
            lambdaPermissionName: 'CacheUpdater-ErrorSubLambdaFunctionPermission',
            logSubFilterName: 'CacheUpdater-CloudWatchLogSubFilter',
            region: {
                name: regions.resourcesRegion.name,
                provider: regions.resourcesRegion.provider,
            },
        });
    }
}
