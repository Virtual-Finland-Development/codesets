import bucketInfo from '../build/bucket-info.json';

export function getStorageBucketInfo(): { name: string } {
    return bucketInfo;
}

// Lambda@edge does not have access to environment variables, so we mock them here to separate local and live environments
export const RuntimeFlags = {
    isLocal: false,
    isSystemTask: false,
};

/**
 *
 * @param event
 * @returns - true if the event is a ping event, false otherwise
 */
export function isPingEvent(event: any): boolean {
    if (event.body) {
        try {
            const body = JSON.parse(event.body);
            if (body.action === 'ping') {
                console.log('pong');
                return true;
            }
        } catch (e) {
            console.error('Invalid event body', event.body);
            return true;
        }
    }
    return false;
}
