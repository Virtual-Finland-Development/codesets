import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ISetup } from '../utils/Setup';

export function createOriginAccessIdentity(setup: ISetup) {
  const originAccessIdentityConfig = setup.getResourceConfig('OriginAccessIdentity');
  return new aws.cloudfront.OriginAccessIdentity(
    originAccessIdentityConfig.name,
    {
      comment: "Access Identity",
    }
  );
}

export function createCloudFrontDistribution(setup: ISetup, bucket: aws.s3.Bucket, originAccessIdentity: aws.cloudfront.OriginAccessIdentity, lambdaAtEdgeFunction: aws.lambda.Function, ) {
  const cloudFrontDistributionConfig = setup.getResourceConfig('CloudFrontDistribution');
  
  const cloudFrontDistribution = new aws.cloudfront.Distribution(
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
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
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
        compress: true,
        lambdaFunctionAssociations: [
            {
              eventType: 'origin-request',
              lambdaArn: pulumi.interpolate `${lambdaAtEdgeFunction.arn}:${lambdaAtEdgeFunction.version}`,
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
    }
  );

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