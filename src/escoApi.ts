import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import RequestApp from './app/RequestApp';
import { UriRedirects, resolveErrorResponse } from './utils/api';
import { transformOccupations } from './utils/data/transformers';
import { NotFoundError, ValidationError } from './utils/exceptions';
import { pingEventMiddleware } from './utils/runtime';

const CODESETS_API_ENDPOINT = process.env.CODESETS_API_ENDPOINT;

// Store for the duration of the lambda instance
const internalMemory: any = {
    occupations: null,
};

// AWS Lambda function handler for the ESCO API
export const handler = pingEventMiddleware(
    async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
        const app = new RequestApp(event);
        const response = await handleEvent(app, event);
        app.logger.log(response);
        return response;
    }
);

async function handleEvent(app: RequestApp, event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    try {
        const request = parseRequest(event);
        const uri = `${CODESETS_API_ENDPOINT}${request.path}`;

        if (internalMemory.occupations === null) {
            const response = await fetch(uri);
            const responseData = await response.json();
            if (!(responseData.occupations instanceof Array)) {
                throw new Error('Invalid response from codesets API');
            }
            internalMemory.occupations = responseData.occupations;
        }

        const transformedData = await transformOccupations(internalMemory.occupations, request.params);
        const responseBody = JSON.stringify(transformedData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: responseBody,
        };
    } catch (error: any) {
        app.logger.catchError(error);
        const errorPackage = resolveErrorResponse(error);
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

    if (!rawPath.includes('EscoOccupations') || !Object.keys(UriRedirects).includes(rawPath)) {
        throw new NotFoundError('Unknown request path');
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
