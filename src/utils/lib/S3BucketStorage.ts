import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { leftTrimSlash } from '../helpers';
import { IStorage } from './IStorage';

class S3BucketStorage implements IStorage {
    public async store(bucketName: string, key: string, data: string, mime: string) {
        try {
            const s3Client = new S3Client({});
            const params = {
                Bucket: bucketName,
                Key: leftTrimSlash(key),
                Body: data,
                ContentType: mime,
            };

            await s3Client.send(new PutObjectCommand(params));

        } catch (error: any) {
            console.error(error?.message, error?.stack);
            throw new Error('An error occurred while storing to S3');
        }
    }

    public async retrieve(bucketName: string, key: string): Promise<{ data: string; mime: string }> {
        try {
            const s3Client = new S3Client({});
            const params = {
                Bucket: bucketName,
                Key: leftTrimSlash(key),
            };

            const data  = await s3Client.send(new GetObjectCommand(params));

            if (!data.Body) throw new Error('No data found in S3');

            return {
                data: data.Body.toString(),
                mime: data.ContentType || 'application/json',
            };
        } catch (error: any) {
            console.error(error?.message, error?.stack);
            throw new Error('An error occurred while retrieving from S3');
        }
    }
}

export default new S3BucketStorage();