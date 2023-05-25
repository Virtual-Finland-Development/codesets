import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import { ISetup } from '../utils/Setup';

export default function createCloudFrontFunction(setup: ISetup) {
    const cloudfrontFunctionConfig = setup.getResourceConfig('CacheCorrectionsFunction');
    const cacheCorrectionsFunction = new aws.cloudfront.Function(cloudfrontFunctionConfig.name, {
        runtime: 'cloudfront-js-1.0',
        comment: 'Cache corrections function for CloudFront',
        publish: true,
        code: fs.readFileSync('./dist/corrections/index.js', 'utf8'),
    });

    return cacheCorrectionsFunction;
}
