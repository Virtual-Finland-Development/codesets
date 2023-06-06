import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { resolveError } from './utils/api';
import { parseRequestInputParams } from './utils/helpers';

const CODESETS_API_ENDPOINT = process.env.CODESETS_API_ENDPOINT;

// AWS Lambda function hanlder for the ESCO API
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { path, queryStringParameters, body } = event;

    if (typeof body !== 'string' || body.length < 1) {
        return {
            statusCode: 400,
            body: 'Invalid request body',
        };
    } else if (body === 'warmup') {
        return {
            statusCode: 200,
            body: 'Warmup successful',
        };
    }

    try {
        const params = (queryStringParameters as Record<string, string>) || {};
        try {
            const bodyData = JSON.parse(body);
            if (typeof bodyData === 'object') {
                Object.assign(params, parseRequestInputParams(bodyData));
            }
        } catch (error) {
            // Pass
        }

        console.log('Request: ', {
            path,
            params,
        });

        const paramsAsQuery = new URLSearchParams(params).toString();
        const uri = `${CODESETS_API_ENDPOINT}/${path}`;
        const uriAsQuery = uri + (paramsAsQuery ? '?' + paramsAsQuery : '');
        const response = await fetch(uriAsQuery);
        return {
            statusCode: response.status,
            headers: Object.entries(response.headers).reduce((headers, [key, value]) => {
                headers[key] = value;
                return headers;
            }, {} as Record<string, string>),
            body: response.body as any,
        };
    } catch (error: any) {
        const errorPackage = resolveError(error);
        return {
            statusCode: errorPackage.statusCode,
            body: errorPackage.body,
        };
    }
}
