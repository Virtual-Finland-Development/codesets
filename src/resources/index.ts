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

export default {
    ...externalResources,
};