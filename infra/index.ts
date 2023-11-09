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
import { injectBuildArtifactEnvironmentFile } from './resources/buildArtifact';
import { createStandardLogsBucket } from './resources/standardLogsBucket';

async function deploy() {
    const originAccessIdentity = createOriginAccessIdentity();
    const s3bucketSetup = createS3Bucket();

    // Prepare the build artifact env
    await injectBuildArtifactEnvironmentFile(s3bucketSetup);

    const edgeLambdaPackage = createLambdaAtEdgeFunction();
    createS3BucketPermissions(s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);
    const cacheUpdaterPackage = createCacheUpdaterLambdaFunction(
        s3bucketSetup.name,
        edgeLambdaPackage.lambdaAtEdgeFunction
    );

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
    return {
        url: pulumi.interpolate`https://${cloudFrontDistribution.domainName}`,
        bucketName: s3bucketSetup.bucket.bucket,
        lambdaId: pulumi.interpolate`${edgeLambdaPackage.lambdaAtEdgeFunction.name}:${edgeLambdaPackage.lambdaAtEdgeFunction.version}`,
        cloudFrontDistributionId: cloudFrontDistribution.id,
        standardLogsBucketDetails: {
            arn: standardLogsBucket.arn,
            id: standardLogsBucket.id,
        },
        cacheUpdaterFunctionArn: cacheUpdaterPackage.lambdaFunction.arn,
    };
}

// Deploy
const deployPromise = deploy();

// Outputs
export const url = deployPromise.then((outputs) => outputs.url);
export const bucketName = deployPromise.then((outputs) => outputs.bucketName);
export const lambdaId = deployPromise.then((outputs) => outputs.lambdaId);
export const cloudFrontDistributionId = deployPromise.then((outputs) => outputs.cloudFrontDistributionId);
export const standardLogsBucketDetails = deployPromise.then((outputs) => outputs.standardLogsBucketDetails);
export const cacheUpdaterFunctionArn = deployPromise.then((outputs) => outputs.cacheUpdaterFunctionArn);
