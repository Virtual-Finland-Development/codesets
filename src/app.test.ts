import { test } from '@jest/globals';
import { CloudFrontRequestEvent, CloudFrontResultResponse } from 'aws-lambda';
import { handler } from './app';

jest.mock('node:fetch');


test('Basic router test', async () => {
    const event = {
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

    const result = await handler(event) as CloudFrontResultResponse;

    expect(result.status).toBe("404");
    expect(result.body).toBeDefined();
  })