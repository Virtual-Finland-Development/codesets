import * as fs from 'fs';
import * as mime from 'mime';

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
    async getResourcePassThrough(resourceFilename: string): Promise<{ body: string, mime: string | null } | undefined> {
        try {
            const filePath = `${this.resourcesPath}/${resourceFilename}`;
            return {
                body: await fs.promises.readFile(filePath, 'utf8'),
                mime: mime.getType(filePath),
            };
        } catch (error) {}
        return;
    }
}

export default {
    ...externalResources,
};