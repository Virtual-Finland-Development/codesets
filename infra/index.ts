import * as pulumi from '@pulumi/pulumi';
import { createCloudFrontDistribution, createOriginAccessIdentity } from './resources/CloudFront';
import createLambdaAtEdgeFunction from './resources/LambdaAtEdge';
import createS3Bucket, { createS3BucketPermissions, uploadAssetsToBucket } from './resources/S3Bucket';
import { getSetup } from './utils/Setup';

const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);
const s3bucketSetup = createS3Bucket(setup);
const edgeLambdaPackage = createLambdaAtEdgeFunction(setup, s3bucketSetup.name);
createS3BucketPermissions(setup, s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);
const cloudFrontDistribution = createCloudFrontDistribution(
    setup,
    s3bucketSetup.bucket,
    originAccessIdentity,
    edgeLambdaPackage.lambdaAtEdgeFunction
);
uploadAssetsToBucket(s3bucketSetup.bucket);

export const url = pulumi.interpolate`https://${cloudFrontDistribution.domainName}`;
export const bucketName = s3bucketSetup.bucket.bucket;
