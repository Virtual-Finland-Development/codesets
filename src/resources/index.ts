import * as fs from 'fs';
const importDir = require('directory-import');
const externalResourcesImport = importDir({ directoryPath: './external' });

const externalResources = Object.keys(externalResourcesImport).reduce((acc, key) => { 
    const resourceKey = key.replace('/', '').replace(/\.js$/, '');
    const resource = externalResourcesImport[key].default;
    
    return {
        ...acc,
        [resourceKey]: resource,
    };
}, {});

export async function getLocalModeResourcePassThrough(uri: string): Promise<string | undefined> {
    const resourceKey = uri.replace('/resources/', '');
    try {
        return await fs.promises.readFile(`./src/resources/internal/${resourceKey}`, 'utf8');
    } catch (error) {
        
    }
    return;
}

export default {
    ...externalResources,
};