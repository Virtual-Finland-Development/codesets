import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { resolveError } from './utils/api';
import { decodeBase64, parseRequestInputParams } from './utils/helpers';

const CODESETS_API_ENDPOINT = process.env.CODESETS_API_ENDPOINT;

// AWS Lambda function hanlder for the ESCO API
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { path, queryStringParameters, body } = event;

    try {
        const params = (queryStringParameters as Record<string, string>) || {};
        if (typeof body === 'string') {
            try {
                const bodyData = JSON.parse(decodeBase64(body));
                if (typeof bodyData === 'object') {
                    Object.assign(params, parseRequestInputParams(bodyData));
                }
            } catch (error) {
                //
            }
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
