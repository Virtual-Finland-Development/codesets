import * as pulumi from '@pulumi/pulumi';
import {
    createCacheInvalidation,
    createCloudFrontDistribution,
    createOriginAccessIdentity,
} from './resources/CloudFront';
import createLambdaAtEdgeFunction from './resources/LambdaAtEdge';
import createCloudFrontFunction from './resources/CloudFrontFunction';
import createS3Bucket, { createS3BucketPermissions, uploadAssetsToBucket } from './resources/S3Bucket';
import { getSetup } from './utils/Setup';

// Setup
const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);
const s3bucketSetup = createS3Bucket(setup);

const edgeLambdaPackage = createLambdaAtEdgeFunction(setup, s3bucketSetup);
createS3BucketPermissions(setup, s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);

const requestCorrectionFunction = createCloudFrontFunction(setup);

const cloudFrontDistribution = createCloudFrontDistribution(
    setup,
    s3bucketSetup.bucket,
    originAccessIdentity,
    edgeLambdaPackage.lambdaAtEdgeFunction,
    requestCorrectionFunction
);
uploadAssetsToBucket(s3bucketSetup.bucket);
createCacheInvalidation(setup, cloudFrontDistribution);

// Outputs
export const url = pulumi.interpolate`https://${cloudFrontDistribution.domainName}`;
export const bucketName = s3bucketSetup.bucket.bucket;
export const lambdaId = pulumi.interpolate`${edgeLambdaPackage.lambdaAtEdgeFunction.name}:${edgeLambdaPackage.lambdaAtEdgeFunction.version}`;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
