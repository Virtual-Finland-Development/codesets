import bucketInfo from '../build/bucket-info.json';

export function getStorageBucketInfo(): { name: string } {
    return bucketInfo;
}

// Lambda@edge does not have access to environment variables, so we mock them here to separate local and live environments
export const RuntimeFlags = {
    isLocal: false,
    isSystemTask: false,
};
