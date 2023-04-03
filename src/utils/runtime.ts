import bucketInfo from '../build/bucket-info.json';

export function getInternalResourceInfo(): { name: string; uri: string } {
    return bucketInfo;
}

export function getInternalResourceUri(resourceName: string): string {
    return `${bucketInfo.uri}/${resourceName}`;
}
