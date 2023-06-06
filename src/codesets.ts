import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    CloudFrontRequestEvent,
    CloudFrontRequestResult,
    CloudFrontResultResponse,
} from 'aws-lambda';
import mime from 'mime';
import { InternalResources } from './resources/index';
import { resolveError, resolveUri } from './utils/api';
import { getResource, listResources } from './utils/data/repositories/ResourceRepository';
import { cutTooLongString, decodeBase64, generateSimpleHash, parseRequestInputParams } from './utils/helpers';
import { storeToS3 } from './utils/lib/S3Bucket';
import { Environment, getInternalResourceInfo } from './utils/runtime';

async function engageResourcesRouter(
    resourceURI: string,
    params: Record<string, string>
): Promise<{
    response: CloudFrontResultResponse | undefined;
    cacheable?: { filepath: string; data: string; mime: string };
}> {
    const resourceName = resourceURI.replace('/resources', '').replace('/', ''); // First occurence of "/" is removed
    if (!resourceName) {
        // On a requets path /resources, return a list of resources
        return {
            response: {
                status: '200',
                statusDescription: 'OK: list of resources',
                body: JSON.stringify([...listResources(), ...InternalResources.listResources()]),
            },
        };
    }

    const resource = getResource(resourceName);
    if (resource) {
        console.log('Resource: ', resource.name);
        const resourceResponse = await resource.retrieve(params);

        // If resource size is larger than 1MB, store it in S3 and redirect to it instead
        // This is a workaround to avoid CloudFront cache limit
        // @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-restrictions.html#lambda-at-edge-function-restrictions
        console.log('Size: ', resourceResponse.size, 'bytes');
        if (resourceResponse.size > 1024 * 1024) {
            const extension = mime.getExtension(resourceResponse.mime);
            const cachedName = `/cached/${resource.name}-${generateSimpleHash(params)}.${extension}`;

            return {
                response: undefined,
                cacheable: {
                    filepath: cachedName,
                    data: resourceResponse.data,
                    mime: resourceResponse.mime,
                },
            };
        }

        return {
            response: {
                status: '200',
                statusDescription: 'OK: resource found',
                body: resourceResponse.data,
                bodyEncoding: 'text',
                headers: {
                    'content-type': [{ key: 'Content-Type', value: resourceResponse.mime }],
                    'access-control-allow-origin': [{ key: 'Access-Control-Allow-Origin', value: '*' }],
                },
            },
        };
    }

    if (InternalResources.hasResource(resourceName)) {
        return {
            response: undefined, // pass the request to the cloudfront origin
        };
    }

    return {
        response: {
            status: '404',
            statusDescription: 'Not Found: resource not found',
            body: JSON.stringify({ message: 'Resource not found' }),
            headers: {
                'content-type': [{ key: 'Content-Type', value: 'application/json' }],
            },
        },
    };
}

/**
 * Live environment handler
 *
 * @param event
 * @returns
 */
export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
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

        console.log('Request: ', {
            uri,
            params,
        });

        if (uri.startsWith('/resources')) {
            const routerResponse = await engageResourcesRouter(uri, params);
            if (routerResponse.response) {
                console.log('Response: ', {
                    ...routerResponse.response,
                    body: cutTooLongString(routerResponse.response.body, 250),
                });
                return routerResponse.response;
            }

            if (routerResponse.cacheable) {
                console.log('Cacheable: ', {
                    filepath: routerResponse.cacheable.filepath,
                    data: cutTooLongString(routerResponse.cacheable.data, 250),
                    mime: routerResponse.cacheable.mime,
                });
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
        const errorPackage = resolveError(error);
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
    try {
        Environment.isLocal = true;

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

            console.log('Request: ', {
                uri,
                params,
            });

            if (uri.startsWith('/resources')) {
                const routerResponse: any = await engageResourcesRouter(uri, params);
                if (routerResponse.response) {
                    return {
                        statusCode: parseInt(routerResponse.response.status),
                        body: routerResponse.response.body,
                    };
                }

                if (routerResponse.cacheable) {
                    console.log('Cacheable: ', routerResponse.cacheable.filepath);
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
        return resolveError(error);
    }
}