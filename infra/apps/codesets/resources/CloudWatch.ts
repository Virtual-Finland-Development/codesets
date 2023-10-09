import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

interface LogSubFilterConfig {
    isEdge?: boolean;
    logGroupName: string;
    lambdaPermissionName: string;
    logSubFilterName: string;
    region?: {
        name: string;
        provider: aws.Provider;
    };
}

function create(setup: ISetup, lambdaLogGroupName: pulumi.Output<string>, logSubFilterConfig: LogSubFilterConfig) {
    const { isEdge, logGroupName, lambdaPermissionName, logSubFilterName, region } = logSubFilterConfig;

    const logGroupConfig = setup.getResourceConfig(logGroupName);

    const logGroup = new aws.cloudwatch.LogGroup(
        logGroupConfig.name,
        {
            name: lambdaLogGroupName,
            retentionInDays: 30,
            tags: logGroupConfig.tags,
        },
        {
            ...(isEdge && region && { provider: region.provider }), // for edge, log group needs to be created in edge region
        }
    );

    const lambdaPermission = new aws.lambda.Permission(
        setup.getResourceName(lambdaPermissionName),
        {
            action: 'lambda:InvokeFunction',
            function: setup.errorSubLambdaArn,
            principal: 'logs.amazonaws.com',
            sourceArn: pulumi.interpolate`${logGroup.arn}:*`,
        },
        {
            ...(isEdge && { provider: setup.regions.resourcesRegion.provider }), // error sub lambda located in eu-north-1, for edge lambda specific target needed
        }
    );

    new aws.cloudwatch.LogSubscriptionFilter(
        setup.getResourceName(logSubFilterName),
        {
            logGroup: lambdaLogGroupName,
            filterPattern: 'ERROR',
            destinationArn: setup.errorSubLambdaArn,
        },
        {
            dependsOn: [logGroup, lambdaPermission],
            ...(isEdge && region && { provider: region.provider }), // for edge, log subscription filter needs to be created in edge region
        }
    );
}

export async function createCloudWatchLogSubFilter(
    setup: ISetup,
    lambda: aws.lambda.Function,
    lambdaType: 'codesets' | 'cache-updater'
) {
    // for codesets lambda, we need to create the log subscription filter in all edge regions with region specific provider settings
    if (lambdaType === 'codesets') {
        const lambdaLogGroupName = pulumi.interpolate`/aws/lambda/us-east-1.${lambda.name}`;
        const regions = await setup.regions.getAllRegions();

        for (const region of regions) {
            create(setup, lambdaLogGroupName, {
                isEdge: true,
                logGroupName: `edgeRegion-${region.name}-logGroup`,
                lambdaPermissionName: `ErrorSubLambdaFunctionPermission-${region.name}`,
                logSubFilterName: `CloudWatchLogSubFilter-${region.name}`,
                region,
            });
        }
    } else {
        create(setup, pulumi.interpolate`/aws/lambda/${lambda.name}`, {
            logGroupName: 'CacheUpdaterLogGroup',
            lambdaPermissionName: 'ErrorSubLambdaFunctionPermission-CacheUpdater',
            logSubFilterName: 'CloudWatchLogSubFilter-CacheUpdater',
        });
    }
}
