import { getResources } from './utils/data/repositories/ResourceRepository';

export async function handler() {
    const externalResources = getResources('external');
    for (const resourceName in externalResources) {
        const resource = externalResources[resourceName];
        
        try {
            // Fetch data response string
            const dataPackage = await resource.retrieveDataPackage();

            // Validate input/output by parsing
            await resource.parseRawData(dataPackage.data, dataPackage.mime);
            
            // Store data in cache
            await resource.storeData(dataPackage.data, dataPackage.mime);
        } catch (error) {
            console.error(error);
        }
    }
}