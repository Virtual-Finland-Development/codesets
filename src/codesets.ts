import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    CloudFrontRequestEvent,
    CloudFrontRequestResult
} from 'aws-lambda';
import RequestLogger from './app/RequestLogger';
import { engageResourcesAction } from './app/resources-controller';
import { InternalResources } from './resources/index';
import { resolveErrorPackage, resolveUri } from './utils/api';
import { decodeBase64, parseRequestInputParams } from './utils/helpers';
import { storeToS3 } from './utils/lib/S3Bucket';
import { Environment, getInternalResourceInfo } from './utils/runtime';

const loggerConfiguration = {
    disable: {
        sourceIp: true,
    },
};

/**
 * Live environment handler
 *
 * @param event
 * @returns
 */
export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    const requestLogger = new RequestLogger(event, loggerConfiguration);
    const response = await handleLiveRequest(event);
    requestLogger.log(response);
    return response;
}

async function handleLiveRequest(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const request = event.Records[0].cf.request;
        let uri = resolveUri(request.uri);
        const params = Object.fromEntries(new URLSearchParams(request.querystring || ''));
        if (request.method === 'POST' && typeof request.body?.data === 'string') {
            try {
                const body = JSON.parse(decodeBase64(request.body.data));
                if (typeof body === 'object') {
                    Object.assign(params, parseRequestInputParams(body));
                }
            } catch (error) {
                //
            }
        }


        if (uri.startsWith('/resources')) {
            const routerResponse = await engageResourcesAction(uri, params);
            if (routerResponse.response) {
                return routerResponse.response;
            }

            if (routerResponse.cacheable) {
                const bucketName = getInternalResourceInfo().name;
                await storeToS3(
                    bucketName,
                    routerResponse.cacheable.filepath,
                    routerResponse.cacheable.data,
                    routerResponse.cacheable.mime
                );
                uri = routerResponse.cacheable.filepath; // pass through to s3 origin
            }
        }

        if (request.method === 'POST') {
            // If the request is POST, we need to use a redirect for the cache to work
            return {
                status: '302',
                statusDescription: 'Found',
                headers: {
                    location: [
                        {
                            key: 'Location',
                            value: uri,
                        },
                    ],
                },
            };
        }

        request.uri = uri; // Pass through to origin
        return request;
    } catch (error: any) {
        const errorPackage = resolveErrorPackage(error);
        return {
            status: errorPackage.statusCode.toString(),
            statusDescription: errorPackage.description,
            body: errorPackage.body,
        };
    }
}

/**
 * Local environment handler
 *
 * @param event
 * @returns
 */
export async function offlineHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    Environment.isLocal = true;
    const requestLogger = new RequestLogger(event, loggerConfiguration);
    const response = await handleLocalEvent(event);
    requestLogger.log(response);
    return response;
}

/**
 * Local environment handler
 *
 * @param event
 * @returns
 */
async function handleLocalEvent(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    try {
        const handle = async (event: APIGatewayProxyEventV2) => {
            let uri = resolveUri(event.rawPath);
            const params = Object.fromEntries(new URLSearchParams(event.rawQueryString || ''));
            if (event.requestContext.http.method === 'POST') {
                try {
                    const body = JSON.parse(event.body || '{}');
                    if (typeof body === 'object') {
                        Object.assign(params, parseRequestInputParams(body));
                    }
                } catch (error) {
                    //
                }
            }

            if (uri.startsWith('/resources')) {
                const routerResponse: any = await engageResourcesAction(uri, params);
                if (routerResponse.response) {
                    return {
                        statusCode: parseInt(routerResponse.response.status),
                        body: routerResponse.response.body,
                    };
                }

                if (routerResponse.cacheable) {
                    return {
                        statusCode: 200,
                        body: routerResponse.cacheable.data,
                    };
                }
            }

            // Simulate CloudFront pass through
            if (uri === '/') {
                uri = '/index.html';
            }

            const resource = await InternalResources.getResourcePassThrough(uri);
            if (resource) {
                return {
                    statusCode: 200,
                    body: resource.body,
                    headers: {
                        'Content-Type': resource.mime || 'application/json',
                    },
                };
            }
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Not found' }),
            };
        };

        const internalTimeoutEnforcer = async () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Timeout'));
                }, 29000); // 29 seconds, 1 second less than CloudFront timeout
            });
        };

        return await Promise.race([handle(event), internalTimeoutEnforcer() as any]); // Return the first to resolve
    } catch (error: any) {
        return resolveErrorPackage(error);
    }
}
