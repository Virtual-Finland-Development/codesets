import * as pulumi from '@pulumi/pulumi';
import { createCloudFrontDistribution, createOriginAccessIdentity } from './resources/CloudFront';
import createLambdaAtEdgeFunction from "./resources/LambdaAtEdge";
import createS3Bucket from "./resources/S3Bucket";
import { getSetup } from './tools/Setup';

const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);
const bucketInfo = createS3Bucket(setup, originAccessIdentity);
const cloudFrontDistribution = createCloudFrontDistribution(setup, bucketInfo.bucket, originAccessIdentity);
createLambdaAtEdgeFunction(setup, cloudFrontDistribution);

export const url = pulumi.interpolate`http://${cloudFrontDistribution.domainName}`;
