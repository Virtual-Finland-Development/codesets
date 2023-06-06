import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { UriRedirects, resolveError } from './utils/api';
import { ValidationError } from './utils/exceptions';

const CODESETS_API_ENDPOINT = process.env.CODESETS_API_ENDPOINT;

// AWS Lambda function hanlder for the ESCO API
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    // Lambda warmup request handling
    if ((event as any)?.source === 'warmup') {
        return {
            statusCode: 200,
            body: 'Warmup successful',
        };
    }

    // Normal request handling
    try {
        const request = parseRequest(event);

        const paramsAsQuery = new URLSearchParams(request.params).toString();
        const uri = `${CODESETS_API_ENDPOINT}${request.path}`;
        const uriAsQuery = uri + (paramsAsQuery ? '?' + paramsAsQuery : '');
        const response = await fetch(uriAsQuery);
        const responseBody = await response.text();

        const responseHeaders = Object.entries(response.headers).reduce((headers, [key, value]) => {
            headers[key] = value;
            return headers;
        }, {} as Record<string, string>);

        return {
            statusCode: response.status,
            headers: responseHeaders,
            body: responseBody,
        };
    } catch (error: any) {
        const errorPackage = resolveError(error);
        return {
            statusCode: errorPackage.statusCode,
            body: errorPackage.body,
        };
    }
}

function parseRequest(event: APIGatewayProxyEventV2): { method: string; path: string; params: Record<string, any> } {
    const {
        rawPath,
        body,
        requestContext: {
            http: { method },
        },
    } = event;

    if (method !== 'POST') {
        throw new ValidationError('Bad request method');
    }
    if (typeof body !== 'string' || body.length < 1) {
        throw new ValidationError('Missing request body');
    }

    const knownPaths = Object.keys(UriRedirects);
    if (!knownPaths.includes(rawPath)) {
        throw new ValidationError('Unknown request path');
    }

    let requestData: Record<string, any>;
    try {
        requestData = JSON.parse(body);
    } catch (error) {
        throw new ValidationError('Invalid request body');
    }

    return {
        method,
        path: rawPath,
        params: requestData,
    };
}
