import * as aws from '@pulumi/aws';
import * as fs from 'fs';

import { GetValue } from '../pulumi-helpers';
import { escoApiEndpoint, regions } from '../setup';

export async function injectBuildArtifactEnvironmentFile(s3bucketSetup: { name: string; bucket: aws.s3.Bucket }) {
    // pass the bucket name and other environment variables to the lambda function dist folder
    // ..as lambda@edge does not support environment variables
    fs.writeFileSync(
        './dist/build/environment.json',
        JSON.stringify({
            escoApi: {
                endpoint: await GetValue(escoApiEndpoint),
            },
            s3bucket: {
                name: s3bucketSetup.name,
                region: regions.resourcesRegion.name,
            },
        })
    );
}
