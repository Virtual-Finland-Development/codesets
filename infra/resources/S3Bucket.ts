/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import { ISetup } from '../tools/Setup';

export default function createS3Bucket(setup: ISetup, originAccessIdentity: aws.cloudfront.OriginAccessIdentity) {
  const bucketConfig = setup.getResourceConfig("S3Bucket");
  const s3bucket = new aws.s3.Bucket(bucketConfig.name, {
    website: {
      indexDocument: 'index.html',
      errorDocument: 'index.html',
    },
    tags: bucketConfig.tags,
  });

  const bucketPolicyConfig = setup.getResourceConfig("S3BucketPolicy");
  new aws.s3.BucketPolicy(bucketPolicyConfig.name, {
    bucket: s3bucket.bucket,
    policy: pulumi
      .all([s3bucket.bucket, originAccessIdentity.iamArn])
      .apply(([bucketName, originAccessArn]) =>
        publicReadPolicyForBucket(bucketName, originAccessArn)
      ),
  });

  return s3bucket
}

function publicReadPolicyForBucket(
  bucketName: string,
  originAccessArn: string
): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: {
          AWS: [`${originAccessArn}`],
        },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`,
      },
    ],
  });
}

export function uploadAssetsToBucket(bucketResource: aws.s3.Bucket) {
  process.chdir('../'); // navigate to project root folder
  const resourcesDir = `${process.cwd()}/src/resources/internal`;
  uploadToS3(resourcesDir, bucketResource);
}

function uploadToS3(
  buildDir: string,
  bucket: aws.s3.Bucket,
  subDir: string = ''
) {
  for (let item of fs.readdirSync(`${buildDir}${subDir}`)) {
    const filePath = path.join(buildDir, subDir, item);

    if (fs.statSync(filePath).isDirectory()) {
      uploadToS3(buildDir, bucket, `${subDir}/${item}`);
    } else {
      const file = subDir.length > 0 ? `${subDir.slice(1)}/${item}` : item;
      new aws.s3.BucketObject(file, {
        bucket: bucket,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: mime.getType(filePath) || undefined,
        // https://create-react-app.dev/docs/production-build/#static-file-caching
        cacheControl:
          subDir.length > 0
            ? 'max-age=31536000'
            : `no-store, no-cache${file === 'index.html' ? ', max-age=0' : ''}`,
      });
    }
  }
}