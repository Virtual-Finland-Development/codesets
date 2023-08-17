import RequestLogger from './app/RequestLogger';
import { getResources } from './utils/data/repositories/ResourceRepository';
import { RuntimeFlags } from './utils/runtime';
import ExternalResourceCache from './utils/services/ExternalResourceCache';
import S3BucketStorage from './utils/services/S3BucketStorage';

export async function handler() {
    RuntimeFlags.isSystemTask = true; // Flag the resources system to skip existing cache usage
    
    const externalResources = getResources('external');
    const appStorage = new S3BucketStorage({
        region: 'us-east-1', // Codesets bucket must be stored in us-east-1 for CloudFront to access it
    });
    const externalResourceCache = new ExternalResourceCache(appStorage);

    for (const resourceName in externalResources) {
        const resource = externalResources[resourceName];
        console.log("Updating resource..", resourceName);

        try {
            // Fetch data response string
            const dataPackage = await resource.retrieveDataPackage();

            // Validate input/output by parsing
            await resource.parseRawData(dataPackage.data, dataPackage.mime);
            
            // Store data in cache
            await externalResourceCache.store(resource.name, dataPackage);
            
        } catch (error) {
            console.error(resourceName, RequestLogger.formatError(error));
            // @TODO: alerts to admin
        }
    }
}