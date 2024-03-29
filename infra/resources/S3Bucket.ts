/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import { getResourceName, getTags } from '../setup';

export default function createS3Bucket() {
    const name = getResourceName('storage-bucket');
    const tags = getTags();
    const s3bucket = new aws.s3.Bucket(name, {
        bucket: name, // Need a static bucket name for lambda@edge does not support the passing of environment variables
        website: {
            indexDocument: 'index.html',
            errorDocument: 'index.html',
        },
        tags,
        corsRules: [
            {
                allowedHeaders: ['*'],
                allowedMethods: ['GET', 'POST'],
                allowedOrigins: ['*'],
            },
        ],
    });

    return {
        bucket: s3bucket,
        name: name, // Pass the bucket name to the lambda@edge function, without the pulumi future promise mayhem
    };
}

export function createS3BucketPermissions(
    s3bucket: aws.s3.Bucket,
    originAccessIdentity: aws.cloudfront.OriginAccessIdentity,
    edgeLambdaExecRole: aws.iam.Role
) {
    new aws.s3.BucketPolicy(getResourceName('S3BucketPolicy'), {
        bucket: s3bucket.bucket,
        policy: pulumi
            .all([s3bucket.bucket, originAccessIdentity.iamArn, edgeLambdaExecRole.arn])
            .apply(([bucketName, originAccessArn, lambdaExecArn]) =>
                publicReadPolicyForBucket(bucketName, originAccessArn, lambdaExecArn)
            ),
    });
}

function publicReadPolicyForBucket(bucketName: string, originAccessArn: string, lambdaExecArn: string): string {
    return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: {
                    AWS: [`${originAccessArn}`, `${lambdaExecArn}`],
                },
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucketName}/*`,
            },
            {
                Sid: 'WriteAccess',
                Effect: 'Allow',
                Principal: {
                    AWS: [`${lambdaExecArn}`],
                },
                Action: 's3:PutObject',
                Resource: `arn:aws:s3:::${bucketName}/*`,
            },
        ],
    });
}
export function uploadAssetsToBucket(bucketResource: aws.s3.Bucket) {
    process.chdir('../'); // navigate to project root folder
    uploadDirToS3(`${process.cwd()}/src/resources/internal`, bucketResource, '', 'resources', ['ts', 'js']);
    uploadDirToS3(`${process.cwd()}/src/build/webroot`, bucketResource);
}

function uploadDirToS3(
    buildDir: string,
    bucket: aws.s3.Bucket,
    subDir = '',
    bucketSubDir = '', // if provided, all subdir(s) files concatenated to this
    denyFileExtensions?: string[]
) {
    for (const item of fs.readdirSync(`${buildDir}${subDir}`)) {
        const filePath = path.join(buildDir, subDir, item);

        if (fs.statSync(filePath).isDirectory()) {
            // eg. /resources/internal
            uploadDirToS3(buildDir, bucket, `${subDir}/${item}`, bucketSubDir, denyFileExtensions);
        } else {
            // eg. /resources/internal/file.txt -> /file.txt
            // eg. /resources/internal/bazz/file.txt -> /bazz/file.txt
            const file = subDir.length > 0 ? `${subDir.slice(1)}/${item}` : item;
            // eg. /resources/internal/file.txt -> /alt/file.txt
            // eg. /resources/internal/bazz/file.txt -> /alt/bazz/file.txt
            const bucketFile = bucketSubDir.length > 0 ? `${bucketSubDir}/${item}` : file;

            if (denyFileExtensions && denyFileExtensions.includes(path.extname(file))) {
                continue;
            }

            new aws.s3.BucketObject(getResourceName(bucketFile), {
                key: bucketFile,
                bucket: bucket,
                source: new pulumi.asset.FileAsset(filePath),
                contentType: mime.getType(filePath) || undefined,
                // @see: https://create-react-app.dev/docs/production-build/#static-file-caching
                cacheControl:
                    subDir.length > 0
                        ? 'max-age=31536000'
                        : `no-store, no-cache${file === 'index.html' ? ', max-age=0' : ''}`,
            });
        }
    }
}
