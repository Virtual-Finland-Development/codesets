import * as aws from '@pulumi/aws';
import { ISetup } from '../tools/Setup';

export function createOriginAccessIdentity(setup: ISetup) {
  const originAccessIdentityConfig = setup.getResourceConfig('OriginAccessIdentity');
  return new aws.cloudfront.OriginAccessIdentity(
    originAccessIdentityConfig.name,
    {
      comment: "Access Identity",
    }
  );
}

export function createCloudFrontDistribution(setup: ISetup, bucket: aws.s3.Bucket, originAccessIdentity: aws.cloudfront.OriginAccessIdentity) {
  const cloudFrontDistributionConfig = setup.getResourceConfig('CloudFrontDistribution');
  
  return new aws.cloudfront.Distribution(
    cloudFrontDistributionConfig.name,
    {
      origins: [
        {
          domainName: bucket.bucketRegionalDomainName,
          originId: bucket.arn,
          s3OriginConfig: {
            originAccessIdentity:
              originAccessIdentity.cloudfrontAccessIdentityPath,
          },
        },
      ],
      customErrorResponses: [
        {
          errorCachingMinTtl: 300,
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCachingMinTtl: 300,
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: bucket.arn,
        viewerProtocolPolicy: 'redirect-to-https',
        forwardedValues: {
          cookies: {
            forward: 'none',
          },
          queryString: false,
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
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
    },
    {
      protect: true,
    }
  );
}
