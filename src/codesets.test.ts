import { test } from '@jest/globals';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { offlineHandler } from './codesets';

jest.mock('node:fetch');

function mockEvent(path: string, method = 'POST'): APIGatewayProxyEventV2 {
    return {
        rawPath: path,
        requestContext: {
            http: {
                method: method,
            },
        },
        headers: {
            'x-amzn-trace-id': 'Root=1-abba-1234',
        },
    } as unknown as APIGatewayProxyEventV2;
}

describe('Basic router tests', () => {
    test('Not found', async () => {
        const notFound = await offlineHandler(mockEvent('/resources/bazz'));
        expect(notFound.statusCode).toBe(404);
        expect(notFound.body).toBeDefined();
    });

    test('List resources', async () => {
        const listResources = await offlineHandler(mockEvent('/resources'));
        expect(listResources.statusCode).toBe(200);
        expect(listResources.body).toBeDefined();
    });
});
