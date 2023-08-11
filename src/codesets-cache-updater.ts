import { getResources } from './utils/data/repositories/ResourceRepository';

export async function handler() {
    const externalResources = getResources('external');
    for (const resourceName in externalResources) {
        const resource = externalResources[resourceName];
        
        try {
            const resourceData = await resource.fetchData();

        } catch (error) {
            console.error(error);
        }
    }
}