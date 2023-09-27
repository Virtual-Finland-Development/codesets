import * as pulumi from '@pulumi/pulumi';
import { getSetup } from '../../utils/Setup';
import {
    createCacheUpdaterLambdaFunction,
    invokeTheCacheUpdatingFunction,
} from './resources/CacheUpdaterLambdaFunction';
import { createChatbotSlackConfig } from './resources/Chatbot';
import {
    createCloudFrontDistribution,
    createEdgeCacheInvalidation,
    createOriginAccessIdentity,
} from './resources/CloudFront';
import { createCloudWatchLogSubFilter } from './resources/CloudWatch';
import { createErrorSubLambdaFunction } from './resources/ErrorSubLambdaFunction';
import createLambdaAtEdgeFunction from './resources/LambdaAtEdge';
import createS3Bucket, { createS3BucketPermissions, uploadAssetsToBucket } from './resources/S3Bucket';
import { createSnsTopicAndSubscriptions } from './resources/SNS';
import { createStandardLogsBucket } from './resources/standardLogsBucket';

const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);

const s3bucketSetup = createS3Bucket(setup);
const edgeLambdaPackage = createLambdaAtEdgeFunction(setup, s3bucketSetup);
createS3BucketPermissions(setup, s3bucketSetup.bucket, originAccessIdentity, edgeLambdaPackage.lambdaAtEdgeRole);
const cacheUpdaterPackage = createCacheUpdaterLambdaFunction(setup, s3bucketSetup.name);

const standardLogsBucket = createStandardLogsBucket(setup);

const cloudFrontDistribution = createCloudFrontDistribution(
    setup,
    s3bucketSetup.bucket,
    originAccessIdentity,
    edgeLambdaPackage.lambdaAtEdgeFunction,
    standardLogsBucket
);
uploadAssetsToBucket(setup, s3bucketSetup.bucket);

invokeTheCacheUpdatingFunction(setup, cacheUpdaterPackage.lambdaFunction); // Regenerate external resources cache
createEdgeCacheInvalidation(setup, cloudFrontDistribution); // Invalidate the edge-cache of cloudfront

const { snSTopicForEmail, snsTopicForChatbot } = createSnsTopicAndSubscriptions(setup); // Create SNS topic and subscriptions
const errorSubLambdaFunction = createErrorSubLambdaFunction(setup, snSTopicForEmail, snsTopicForChatbot); // Lambda function that will pass codesets errors to SNS
createCloudWatchLogSubFilter(setup, edgeLambdaPackage.lambdaAtEdgeFunction, errorSubLambdaFunction); // Create CloudWatch log subscription filter for errorSubLambdaFunction
createChatbotSlackConfig(setup, snsTopicForChatbot); // Create AWS Chatbot Slack configuration for alerting

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
export const errorSubLambdaFunctionId = pulumi.interpolate`${errorSubLambdaFunction.name}:${errorSubLambdaFunction.version}`;
