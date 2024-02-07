/**
 * Middleware to handle health-check requests
 */
export function healthCheckEventMiddleware(next: (event: any, context?: any) => Promise<any>) {
    return async function (event: any, context?: any) {
        if (event.Records?.[0]?.cf?.request?.uri === '/health-check') {
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
