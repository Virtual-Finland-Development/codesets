import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

interface LogSubFilterConfig {
    logGroupName: string;
    lambdaPermissionName: string;
    logSubFilterName: string;
    region: {
        name: string;
        provider: aws.Provider;
    };
}

function create(setup: ISetup, lambdaLogGroupName: pulumi.Output<string>, logSubFilterConfig: LogSubFilterConfig) {
    const { logGroupName, lambdaPermissionName, logSubFilterName, region } = logSubFilterConfig;

    const logGroupConfig = setup.getResourceConfig(logGroupName);

    const logGroup = new aws.cloudwatch.LogGroup(
        logGroupConfig.name,
        {
            name: lambdaLogGroupName,
            retentionInDays: 30,
            tags: logGroupConfig.tags,
        },
        {
            provider: region.provider,
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
            provider: setup.regions.resourcesRegion.provider, // error sub lambda located in eu-north-1, for edge lambda specific target needed
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
            provider: region.provider,
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
            region: {
                name: setup.regions.edgeRegion.name,
                provider: setup.regions.edgeRegion.provider,
            },
        });
    }
}
