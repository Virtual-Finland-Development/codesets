import * as pulumi from '@pulumi/pulumi';
import { createCloudFrontDistribution, createOriginAccessIdentity } from './resources/CloudFront';
import createLambdaAtEdgeFunction from "./resources/LambdaAtEdge";
import createS3Bucket from "./resources/S3Bucket";
import { getSetup } from './tools/Setup';

const setup = getSetup();
const originAccessIdentity = createOriginAccessIdentity(setup);
const s3bucket = createS3Bucket(setup, originAccessIdentity);
const edgeLambda = createLambdaAtEdgeFunction(setup);
const cloudFrontDistribution = createCloudFrontDistribution(setup, s3bucket, originAccessIdentity, edgeLambda);

export const url = pulumi.interpolate`http://${cloudFrontDistribution.domainName}`;
