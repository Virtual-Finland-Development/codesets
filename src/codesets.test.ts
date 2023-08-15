import { test } from '@jest/globals';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { offlineHandler } from './codesets';

jest.mock('node:fetch');

test('Basic router test', async () => {
    // Mock event
    const event = {
        rawPath: '/resources/bazz',
        requestContext: {
            http: {
                method: 'GET',
            },
        },
        headers: {
            'x-amzn-trace-id': "Root=1-abba-1234",
        },
    } as unknown as APIGatewayProxyEventV2;

    const result = (await offlineHandler(event)) as unknown as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBeDefined();
});
