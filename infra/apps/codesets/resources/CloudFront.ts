import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../../../utils/Setup';

export function createOriginAccessIdentity(setup: ISetup) {
    const originAccessIdentityConfig = setup.getResourceConfig('OriginAccessIdentity');
    return new aws.cloudfront.OriginAccessIdentity(originAccessIdentityConfig.name, {
        comment: 'Access Identity',
    });
}

export function createCloudFrontDistribution(
    setup: ISetup,
    bucket: aws.s3.Bucket,
    originAccessIdentity: aws.cloudfront.OriginAccessIdentity,
    lambdaAtEdgeFunction: aws.lambda.Function,
    standardLogsBucket: aws.s3.Bucket
) {
    const cloudFrontDistributionConfig = setup.getResourceConfig('CloudFrontDistribution');

    const cloudFrontDistribution = new aws.cloudfront.Distribution(cloudFrontDistributionConfig.name, {
        origins: [
            {
                domainName: bucket.bucketRegionalDomainName,
                originId: bucket.arn,
                s3OriginConfig: {
                    originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
                },
            },
        ],
        customErrorResponses: [],
        defaultCacheBehavior: {
            allowedMethods: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
            cachedMethods: ['GET', 'HEAD'],
            targetOriginId: bucket.arn,
            viewerProtocolPolicy: 'redirect-to-https',
            forwardedValues: {
                cookies: {
                    forward: 'none',
                },
                queryString: true,
            },
            minTtl: 0,
            defaultTtl: 2628000, // 1 month
            maxTtl: 31536000,
            compress: true,
            lambdaFunctionAssociations: [
                {
                    eventType: 'origin-request',
                    lambdaArn: pulumi.interpolate`${lambdaAtEdgeFunction.arn}:${lambdaAtEdgeFunction.version}`,
                    includeBody: true,
                },
            ],
        },
        viewerCertificate: {
            cloudfrontDefaultCertificate: true,
        },
        restrictions: {
            geoRestriction: {
                locations: [],
                restrictionType: 'none',
            },
        },
        defaultRootObject: 'index.html',
        httpVersion: 'http2',
        isIpv6Enabled: true,
        priceClass: 'PriceClass_All',
        waitForDeployment: true,
        enabled: true,
        retainOnDelete: false,
        tags: cloudFrontDistributionConfig.tags,
        loggingConfig: {
            bucket: standardLogsBucket.bucketDomainName,
            prefix: 'std-cf-logs',
            includeCookies: false,
        }
    });

    // Extended monitoring
    const cloudFrontDistributionMonitoringConfig = setup.getResourceConfig('CloudFrontDistributionMonitoring');
    new aws.cloudfront.MonitoringSubscription(cloudFrontDistributionMonitoringConfig.name, {
        distributionId: cloudFrontDistribution.id,
        monitoringSubscription: {
            realtimeMetricsSubscriptionConfig: {
                realtimeMetricsSubscriptionStatus: 'Enabled',
            },
        },
    });

    // Permissions for Lambda@Edge
    const LambdaAtEdgePermissionConfig = setup.getResourceConfig('LambdaAtEdgePermission');
    new aws.lambda.Permission(LambdaAtEdgePermissionConfig.name, {
        action: 'lambda:GetFunction',
        function: lambdaAtEdgeFunction.name,
        principal: 'edgelambda.amazonaws.com',
        sourceArn: cloudFrontDistribution.arn,
    });

    return cloudFrontDistribution;
}

export function createCacheInvalidation(setup: ISetup, distribution: aws.cloudfront.Distribution) {
    const cacheInvalidationConfig = setup.getResourceConfig('CacheInvalidation');
    const triggerToken = new Date().getTime().toString();
    new local.Command(
        cacheInvalidationConfig.name,
        {
            create: pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${distribution.id} --paths "/*"`,
            triggers: [triggerToken],
        },
        { deleteBeforeReplace: true }
    );
}
