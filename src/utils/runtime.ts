import Environment from '../build/environment.json';

export function getEscoAPIEndpoint() {
    return Environment.escoApi.endpoint;
}

export function getStorageBucketInfo() {
    return Environment.s3bucket;
}

// Lambda@edge does not have access to environment variables, so we mock them here to separate local and live environments
export const RuntimeFlags = {
    isLocal: false,
    isSystemTask: false,
};
