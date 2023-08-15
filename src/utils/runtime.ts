import bucketInfo from '../build/bucket-info.json';

export function getStorageBucketInfo(): { name: string } {
    return bucketInfo;
}

// Static mutable runtime flags reference
export const RuntimeFlags = {
    isLocal: false,
    isSystemTask: false,
};
