import { test } from '@jest/globals';
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
        rawPath: "/resources/bazz",
    } as any;

    const result = await offlineHandler(event) as any;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBeDefined();
  })