import * as fs from 'fs';
import * as mime from 'mime';
import BuiltInternalResourcesList from '../build/internal-resources.json'; // This file is generated by the finalize-build script
import LibraryResource from '../utils/data/models/LibraryResource';

function isFunctionalInternalResourceFile(resource: string): boolean {
    return resource.endsWith('.js') || resource.endsWith('.ts');
}

function cleanupResourceName(resourceName: string): string {
    return resourceName.replace('/', '').replace(/\.js$/, '').replace(/\.ts$/, '');
}


const importDir = require('directory-import');
const externalResourcesImport = importDir({ directoryPath: './external' });
const internalResourcesImport = importDir({
    directoryPath: './internal',
});
const libraryResourcesImport = importDir({ directoryPath: './library' });

const externalResources = Object.keys(externalResourcesImport).reduce((acc, key) => {
    const resourceKey = cleanupResourceName(key);
    const resource = externalResourcesImport[key].default;

    return {
        ...acc,
        [resourceKey]: resource,
    };
}, {});

const functionalInternalResources = Object.keys(internalResourcesImport).reduce((acc, key) => {
    if (!isFunctionalInternalResourceFile(key)) {
        return acc;
    }

    const resourceKey = cleanupResourceName(key);
    const resource = internalResourcesImport[key].default;

    return {
        ...acc,
        [resourceKey]: resource,
    };
}, {});

const libraryResources = Object.keys(libraryResourcesImport).reduce((acc, key) => {
    const resourceKey = cleanupResourceName(key);
    const resource = libraryResourcesImport[key].default;

    if (resource instanceof LibraryResource) {
        return {
            ...acc,
            [resourceKey]: resource,
        };
    }

    return {
        ...acc,
        [resourceKey]: new LibraryResource({
            name: resourceKey,
            async dataGetter() {
                return {
                    data: JSON.stringify(resource),
                    mime: 'application/json; charset=utf-8',
                };
            },
        }),
    };
}, {});

export const InternalResources = {
    localResourcesPath: './src/resources/internal',
    localWebPath: './src/build/webroot',
    listResources(): string[] {
        return BuiltInternalResourcesList.length > 0
            ? BuiltInternalResourcesList
            : fs.readdirSync(this.localResourcesPath).filter((key) => !isFunctionalInternalResourceFile(key));
    },
    hasResource(resourceName: string): boolean {
        return this.listResources().includes(resourceName);
    },
    async getResourcePassThrough(resourceURI: string): Promise<{ body: string; mime: string | null } | undefined> {
        try {
            const resourceFilename = resourceURI.replace('/resources/', '').replace('/', '');
            const resourcePath = resourceFilename.endsWith('.html') ? this.localWebPath : this.localResourcesPath;
            const filePath = `${resourcePath}/${resourceFilename}`;

            return {
                body: await fs.promises.readFile(filePath, 'utf8'),
                mime: mime.getType(filePath),
            };
        } catch (error) {
            /* empty */
        }
        return;
    },
};

export default {
    ...externalResources,
    ...functionalInternalResources,
    ...libraryResources,
};
