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

export const InternalResources = {
    resourcesPath: './src/resources/internal',
    resourcesList: fs.readdirSync('./src/resources/internal'),
    listResources() {
        return this.resourcesList.filter((resourceFilename) => resourceFilename !== 'index.html');
    },
    async getResourcePassThrough(resourceFilename: string): Promise<string | undefined> {
        try {
            return await fs.promises.readFile(`${this.resourcesPath}/${resourceFilename}`, 'utf8');
        } catch (error) {}
        return;
    }
}

export default {
    ...externalResources,
};