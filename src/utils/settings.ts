import ExternalResources from "../ExternalResources";

export function getExternalResourceURI(resourceName: string) {
    if (typeof process.env[`ExternalResources:${resourceName}`] !== "undefined") {
        return process.env[`ExternalResources:${resourceName}`];
    }
    return ExternalResources[resourceName];
}