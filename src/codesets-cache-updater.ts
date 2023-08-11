import { getResources } from './utils/data/repositories/ResourceRepository';
import { Environment } from './utils/runtime';
import ExternalResourceCache from './utils/services/ExternalResourceCache';

export async function handler() {
    Environment.isSystemTask = true;
    
    const externalResources = getResources('external');
    for (const resourceName in externalResources) {
        const resource = externalResources[resourceName];
        
        try {
            // Fetch data response string
            const dataPackage = await resource.retrieveDataPackage();

            // Validate input/output by parsing
            await resource.parseRawData(dataPackage.data, dataPackage.mime);
            
            // Store data in cache
            await ExternalResourceCache.store(resource.name, dataPackage);
            
        } catch (error) {
            console.error(error);
        }
    }
}