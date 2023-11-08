import * as pulumi from '@pulumi/pulumi';
import {
    createCacheUpdaterLambdaFunction,
    invokeTheCacheUpdatingFunction,
} from './resources/CacheUpdaterLambdaFunction';
import {
    createCloudFrontDistribution,
    createEdgeCacheInvalidation,
    createOriginAccessIdentity,
} from './resources/CloudFront';
import { createCloudWatchLogSubFilter } from './resources/CloudWatch';
import createLambdaAtEdgeFunction from './resources/LambdaAtEdge';
import createS3Bucket, { createS3BucketPermissions, uploadAssetsToBucket } from './resources/S3Bucket';
import { createStandardLogsBucket } from './resources/standardLogsBucket';

const originAccessIdentity = createOriginAccessIdentity();

const s3bucketSetup = createS3Bucket();
const edgeLambdaPackage = createLambdaAtEdgeFunction(s3bucketSetup);
createS3BucketPermissions(s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);
const cacheUpdaterPackage = createCacheUpdaterLambdaFunction(s3bucketSetup.name);

const standardLogsBucket = createStandardLogsBucket();

const cloudFrontDistribution = createCloudFrontDistribution(
    s3bucketSetup.bucket,
    originAccessIdentity,
    edgeLambdaPackage.lambdaAtEdgeFunction,
    standardLogsBucket
);
uploadAssetsToBucket(s3bucketSetup.bucket);

invokeTheCacheUpdatingFunction(cacheUpdaterPackage.lambdaFunction); // Regenerate external resources cache
createEdgeCacheInvalidation(cloudFrontDistribution); // Invalidate the edge-cache of cloudfront

createCloudWatchLogSubFilter(edgeLambdaPackage.lambdaAtEdgeFunction, 'codesets'); // Create CloudWatch log subscription filter for errorSubLambdaFunction (codesets edge lambda)
createCloudWatchLogSubFilter(cacheUpdaterPackage.lambdaFunction, 'cache-updater'); // Create CloudWatch log subscription filter for errorSubLambdaFunction (cache updater "standard" lambda)

// Outputs
export const url = pulumi.interpolate`https://${cloudFrontDistribution.domainName}`;
export const bucketName = s3bucketSetup.bucket.bucket;
export const lambdaId = pulumi.interpolate`${edgeLambdaPackage.lambdaAtEdgeFunction.name}:${edgeLambdaPackage.lambdaAtEdgeFunction.version}`;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
export const standardLogsBucketDetails = {
    arn: standardLogsBucket.arn,
    id: standardLogsBucket.id,
};
export const cacheUpdaterFunctionArn = cacheUpdaterPackage.lambdaFunction.arn;
