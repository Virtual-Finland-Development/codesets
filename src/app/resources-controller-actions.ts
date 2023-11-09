import { CloudFrontResultResponse } from 'aws-lambda';
import mime from 'mime';
import { InternalResources } from '../resources';
import { getResource, listResources } from '../utils/data/repositories/ResourceRepository';
import { NotFoundError } from '../utils/exceptions';
import { generateSimpleHash } from '../utils/helpers';
import RequestApp from './RequestApp';

export async function engageResourcesAction(
    app: RequestApp,
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
                body: JSON.stringify(listResources()),
            },
        };
    }

    const resource = getResource(resourceName);
    if (resource) {
        const resourceResponse = await resource.retrieve(app, params);

        // If resource size is larger than 1MB, store it in S3 and redirect to it instead
        // This is a workaround to avoid CloudFront cache limit
        // @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-restrictions.html#lambda-at-edge-function-restrictions
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

    throw new NotFoundError('Resource not found');
}
