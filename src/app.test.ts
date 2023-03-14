import { test } from '@jest/globals';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { offlineHandler } from './app';

jest.mock('node:fetch');

test('Basic router test', async () => {
    /* const event = {
        Records: [
            {
                cf: {
                    request: {
                        uri: "/resources/bazz",
                    },
                },
            },
        ],
    } as CloudFrontRequestEvent;
    */
    const event = {
        rawPath: '/resources/bazz',
    } as unknown as APIGatewayProxyEventV2;

    const result = (await offlineHandler(event)) as unknown as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBeDefined();
});
