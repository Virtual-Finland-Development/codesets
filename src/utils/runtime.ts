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

export function healthCheckEventMiddleware(next: (event: any, context?: any) => Promise<any>) {
    return async function (event: any, context?: any) {
        if (event.action === 'ping' || event.Records?.[0]?.cf?.request?.uri === '/health-check') {
            console.log('pong');
            return {
                status: 200,
                statusDescription: 'OK',
                body: 'OK',
                headers: {
                    'cache-control': [
                        {
                            key: 'Cache-Control',
                            value: 'max-age=0',
                        },
                    ],
                },
            };
        }
        return next(event, context);
    };
}
