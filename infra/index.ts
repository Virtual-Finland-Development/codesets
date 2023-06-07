import * as pulumi from '@pulumi/pulumi';
import {
    createCacheInvalidation,
    createCloudFrontDistribution,
    createOriginAccessIdentity,
} from './resources/CloudFront';
import createLambdaAtEdgeFunction from './resources/LambdaAtEdge';
import createS3Bucket, {createS3BucketPermissions, uploadAssetsToBucket} from './resources/S3Bucket';
import {getSetup} from './utils/Setup';
import {createStandardLogsBucket} from "./resources/standardLogsBucket";
import { createEscoApiLambdaFunctionUrl } from './resources/LambdaFunctionUrl';

const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);
const s3bucketSetup = createS3Bucket(setup);
const edgeLambdaPackage = createLambdaAtEdgeFunction(setup, s3bucketSetup);
createS3BucketPermissions(setup, s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);
const standardLogsBucket = createStandardLogsBucket(setup);
const cloudFrontDistribution = createCloudFrontDistribution(
    setup,
    s3bucketSetup.bucket,
    originAccessIdentity,
    edgeLambdaPackage.lambdaAtEdgeFunction,
    standardLogsBucket
);
uploadAssetsToBucket(s3bucketSetup.bucket);
createCacheInvalidation(setup, cloudFrontDistribution);

// Codesets
export const url = pulumi.interpolate`https://${cloudFrontDistribution.domainName}`;
export const bucketName = s3bucketSetup.bucket.bucket;
export const lambdaId = pulumi.interpolate`${edgeLambdaPackage.lambdaAtEdgeFunction.name}:${edgeLambdaPackage.lambdaAtEdgeFunction.version}`;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
export const standardLogsBucketDetails = {
    arn: standardLogsBucket.arn,
    id: standardLogsBucket.id
}

// Esco API
const escoApi = createEscoApiLambdaFunctionUrl(setup, url);
export const escoApiUrl = escoApi.lambdaFunctionUrl.functionUrl;
export const escoApiLambdaId = escoApi.lambdaFunction.id;