import bucketInfo from '../build/bucket-info.json';

export function getInternalResourceInfo(): { name: string } {
    return bucketInfo;
}

// Static mutable runtime flags reference
export const RuntimeFlags = {
    isLocal: false,
};
