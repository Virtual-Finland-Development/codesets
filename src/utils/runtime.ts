import Environment from '../build/environment.json';

export function getEnvironment() {
    return Environment;
}

export function getStorageBucketInfo() {
    return getEnvironment().s3bucket;
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
