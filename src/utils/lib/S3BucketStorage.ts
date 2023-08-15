import { GetObjectCommand, PutObjectCommand, S3Client, } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { leftTrimSlash } from '../helpers';
import { IStorage } from './IStorage';

export default class S3BucketStorage implements IStorage {
    private readonly s3Client: S3Client;
    public constructor({ region }: { region?: string } = {}) {
        this.s3Client = new S3Client(
            { region: region || process.env.AWS_REGION }
        );
    }

    public async store(bucketName: string, key: string, data: string, mime: string) {
        try {
            
            const params = {
                Bucket: bucketName,
                Key: leftTrimSlash(key),
                Body: data,
                ContentType: mime,
            };

            await this.s3Client.send(new PutObjectCommand(params));

        } catch (error: any) {
            console.error(error?.message, error?.stack);
            throw new Error('An error occurred while storing to S3');
        }
    }

    public async retrieve(bucketName: string, key: string): Promise<{ data: string; mime: string }> {
        try {
           
            const params = {
                Bucket: bucketName,
                Key: leftTrimSlash(key),
            };

            const data  = await this.s3Client.send(new GetObjectCommand(params));

            if (!data.Body) throw new Error('No data found in S3');

            return {
                data: await this.retrieveBodyStreamAsString(data.Body as Readable),
                mime: data.ContentType || 'application/json',
            };
        } catch (error: any) {
            console.error(error?.message, error?.stack);
            throw new Error('An error occurred while retrieving from S3');
        }
    }

    private retrieveBodyStreamAsString(body: Readable) {
        return new Promise<string>((resolve, reject) => {
            const chunks: any[] = [];
            body.on('data', (chunk: any) => {
                chunks.push(chunk);
            });
            body.on('error', (err: any) => {
                reject(err);
            });
            body.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf8'));
            });
        });
    }
}