
import aws from 'aws-sdk';

export async function storeToS3(bucketName: string, key: string, data: string, mime: string) {
    try {
        const s3 = new aws.S3();
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: data,
            ContentType: mime,
        };
        await s3.putObject(params).promise();
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        throw new Error("An error occurred while storing to S3");
    }
}   