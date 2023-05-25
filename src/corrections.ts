import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';
import { resolveError, resolveUri } from './utils/api';
import { decodeBase64, parseRequestInputParams } from './utils/helpers';

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const request = event.Records[0].cf.request;
        const uri = resolveUri(request.uri);
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
            method: request.method,
            uri,
            params,
        });

        if (request.method === 'POST') {
            const paramsAsQuery = new URLSearchParams(params).toString();
            const uriAsQuery = uri + (paramsAsQuery ? '?' + paramsAsQuery : '');
            const response = await fetch(uriAsQuery);
            return {
                status: response.status.toString(),
                statusDescription: response.statusText,
                headers: Object.entries(response.headers).reduce((headers, [key, value]) => {
                    headers[key] = [{ key, value }];
                    return headers;
                }, {} as Record<string, { key: string; value: string }[]>),
                body: response.body as any,
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
