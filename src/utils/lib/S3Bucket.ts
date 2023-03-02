
import aws from 'aws-sdk';
import { leftTrimSlash } from '../strings';

export async function storeToS3(bucketName: string, key: string, data: string, mime: string) {
    try {
        const s3 = new aws.S3();
        const params = {
            Bucket: bucketName,
            Key: leftTrimSlash(key),
            Body: data,
            ContentType: mime,
        };
        await s3.putObject(params).promise();
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        throw new Error("An error occurred while storing to S3");
    }
}   