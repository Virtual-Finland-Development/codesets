import * as aws from '@pulumi/aws';
import { local } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { getResourceName, getTags, regions } from '../setup';

export function createOriginAccessIdentity() {
    return new aws.cloudfront.OriginAccessIdentity(getResourceName('OriginAccessIdentity'), {
        comment: 'Access Identity',
    });
}

export function createCloudFrontDistribution(
    bucket: aws.s3.Bucket,
    originAccessIdentity: aws.cloudfront.OriginAccessIdentity,
    lambdaAtEdgeFunction: aws.lambda.Function,
    standardLogsBucket: aws.s3.Bucket
) {
    const cloudFrontDistribution = new aws.cloudfront.Distribution(getResourceName('CloudFrontDistribution'), {
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
        tags: getTags(),
        loggingConfig: {
            bucket: standardLogsBucket.bucketDomainName,
            prefix: 'std-cf-logs',
            includeCookies: false,
        },
    });

    // Extended monitoring
    new aws.cloudfront.MonitoringSubscription(getResourceName('CloudFrontDistributionMonitoring'), {
        distributionId: cloudFrontDistribution.id,
        monitoringSubscription: {
            realtimeMetricsSubscriptionConfig: {
                realtimeMetricsSubscriptionStatus: 'Enabled',
            },
        },
    });

    // Permissions for Lambda@Edge
    new aws.lambda.Permission(
        getResourceName('LambdaAtEdgePermission'),
        {
            action: 'lambda:GetFunction',
            function: lambdaAtEdgeFunction.name,
            principal: 'edgelambda.amazonaws.com',
            sourceArn: cloudFrontDistribution.arn,
        },
        { provider: regions.edgeRegion.provider }
    );

    return cloudFrontDistribution;
}

export function createEdgeCacheInvalidation(distribution: aws.cloudfront.Distribution) {
    const triggerToken = new Date().getTime().toString();
    new local.Command(
        getResourceName('CacheInvalidation'),
        {
            create: pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${distribution.id} --paths "/*"`,
            triggers: [triggerToken],
        },
        { deleteBeforeReplace: true }
    );
}
