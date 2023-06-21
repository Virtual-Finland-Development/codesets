import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { resolveError } from './utils/api';
import { transformOccupations } from './utils/data/transformers';
import { ValidationError } from './utils/exceptions';

const CODESETS_API_ENDPOINT = process.env.CODESETS_API_ENDPOINT;

// Store for the duration of the lambda instance
const internalMemory = {
    responseData: null,
};

// AWS Lambda function handler for the ESCO API
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
        const uri = `${CODESETS_API_ENDPOINT}${request.path}`;

        if (internalMemory.responseData === null) {
            const response = await fetch(uri);
            internalMemory.responseData = await response.json();
        }

        const transformedData = transformOccupations(internalMemory.responseData, request.params);
        const responseBody = JSON.stringify(transformedData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
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

    const knownPaths = ['/productizer/draft/Employment/EscoOccupations'];
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
