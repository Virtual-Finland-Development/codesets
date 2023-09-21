import bucketInfo from '../build/bucket-info.json';

export function getStorageBucketInfo(): { name: string } {
    return bucketInfo;
}

// Lambda@edge does not have access to environment variables, so we mock them here to separate local and live environments
export const RuntimeFlags = {
    isLocal: false,
    isSystemTask: false,
};

export function pingEventMiddleware(next: (event: any, context?: any) => Promise<any>) {
    return async function (event: any, context?: any) {
        if (event.action === 'ping') {
            console.log('pong');
            return;
        }
        return next(event, context);
    };
}
