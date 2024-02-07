import { ValiError } from 'valibot';
import RequestLogger from './app/RequestLogger';
import { getResources } from './utils/data/repositories/ResourceRepository';
import { ResourceRetrievalError } from './utils/exceptions';
import { RuntimeFlags } from './utils/runtime';
import ExternalResourceCache from './utils/services/ExternalResourceCache';
import S3BucketStorage from './utils/services/S3BucketStorage';
import { healthCheckEventMiddleware } from './utils/middlewares';

export const handler = healthCheckEventMiddleware(async () => {
    RuntimeFlags.isSystemTask = true; // Flag the resources system to skip existing cache usage

    const externalResources = getResources('external');
    const appStorage = new S3BucketStorage();
    const externalResourceCache = new ExternalResourceCache(appStorage);

    for (const resourceName in externalResources) {
        const resource = externalResources[resourceName];
        console.log('Updating resource..', resourceName);

        try {
            // Fetch data response string
            const dataPackage = await resource.retrieveDataPackage();

            // Validate input/output by parsing
            await resource.parseRawData(dataPackage.data, dataPackage.mime);

            // Store data in cache
            await externalResourceCache.store(resource.name, dataPackage);
        } catch (error) {
            if (!(error instanceof ResourceRetrievalError || error instanceof ValiError)) {
                throw error; // Fail the task
            }
            console.error(resourceName, RequestLogger.formatError(error));
        }
    }
});
