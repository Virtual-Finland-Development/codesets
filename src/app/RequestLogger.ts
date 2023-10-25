import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    CloudFrontHeaders,
    CloudFrontRequestEvent,
    CloudFrontRequestResult,
    CloudFrontResultResponse,
} from 'aws-lambda';
import { ValiError } from 'valibot';
import { cutTooLongString } from '../utils/helpers';

export type LogPackage = {
    trace: {
        id: string;
        amazonTraceId?: string;
        userAgent: string;
        sourceIp?: string;
    };
    request: {
        method: string;
        path: string;
        query: string;
    };
    response: {
        statusCode: number;
        contentLength: number;
    };
    errors?: any[];
};

export type RequestLoggerSettings = {
    disable?: {
        sourceIp?: boolean;
    };
};

export default class RequestLogger {
    private readonly request: APIGatewayProxyEventV2 | CloudFrontRequestEvent;
    private readonly configuration: RequestLoggerSettings;
    private readonly errors: any[] = [];

    constructor(request: APIGatewayProxyEventV2 | CloudFrontRequestEvent, configuration?: RequestLoggerSettings) {
        this.request = request;
        this.configuration = configuration || {};
    }

    public log(response: APIGatewayProxyStructuredResultV2 | CloudFrontRequestResult): void {
        const log = this.parseLogPackage(this.request, response);

        if (this.configuration.disable?.sourceIp) {
            log.trace.sourceIp = undefined;
        }

        if (typeof log.response.statusCode !== 'number' || log.response.statusCode >= 404) {
            console.error(JSON.stringify(log, null, 4));
        } else {
            console.log(JSON.stringify(log));
        }
    }

    public catchError(error: Error | ValiError | any) {
        this.errors.push(RequestLogger.formatError(error));
    }

    static formatError(error: Error | ValiError | any): any {
        if (error instanceof ValiError) {
            // Cleanup the vali error to make it more accessible: only show the first issue and remove the input
            return error.issues.slice(0, 1).map((i) => {
                return {
                    ...i,
                    input: cutTooLongString(JSON.stringify(i.input), 500),
                    path: i.path?.map((p) => {
                        return {
                            ...p,
                            input: cutTooLongString(JSON.stringify(p.input), 500),
                        };
                    }),
                };
            });
        } else if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
            };
        } else {
            try {
                return JSON.stringify(error);
            } catch (e) {
                return error;
            }
        }
    }

    private parseLogPackage(
        request: APIGatewayProxyEventV2 | CloudFrontRequestEvent,
        response: APIGatewayProxyStructuredResultV2 | CloudFrontRequestResult
    ): LogPackage {
        // identify if event is APIGatewayProxyEventV2 or CloudFrontRequestEvent
        if (typeof (request as any).requestContext !== 'undefined') {
            return this.parseApiGatewayEvent(
                request as APIGatewayProxyEventV2,
                response as APIGatewayProxyStructuredResultV2
            );
        }
        return this.parseCloudFrontEvent(request as CloudFrontRequestEvent, response as CloudFrontRequestResult);
    }

    private parseApiGatewayEvent(
        request: APIGatewayProxyEventV2,
        response: APIGatewayProxyStructuredResultV2
    ): LogPackage {
        const { rawPath, rawQueryString, requestContext, headers } = request;
        const { statusCode, body } = response;

        return {
            trace: {
                id: requestContext.requestId,
                amazonTraceId: headers['x-amzn-trace-id'],
                userAgent: requestContext.http.userAgent,
                sourceIp: requestContext.http.sourceIp,
            },
            request: {
                method: requestContext.http.method,
                path: rawPath,
                query: rawQueryString,
            },
            response: {
                statusCode: statusCode || 500,
                contentLength: body ? body.length : 0,
            },
            errors: this.errors.length > 0 ? this.errors : undefined,
        };
    }

    private parseCloudFrontEvent(request: CloudFrontRequestEvent, response: CloudFrontRequestResult): LogPackage {
        const cloudFrontEvent = request.Records[0].cf;
        const eventRequest = cloudFrontEvent.request;
        const eventRequestHeaders = this.parseCloudFrontEventHeaders(eventRequest.headers);
        const eventResponse = this.parseCloudFrontRequestResult(response);

        return {
            trace: {
                id: cloudFrontEvent.config.requestId,
                amazonTraceId: eventRequestHeaders['x-amzn-trace-id'],
                userAgent: eventRequestHeaders['user-agent'],
                sourceIp: eventRequest.clientIp,
            },
            request: {
                method: eventRequest.method,
                path: eventRequest.uri,
                query: eventRequest.querystring,
            },
            response: eventResponse,
            errors: this.errors.length > 0 ? this.errors : undefined,
        };
    }

    private parseCloudFrontEventHeaders(headers: CloudFrontHeaders): { [key: string]: string } {
        const parsedHeaders: { [key: string]: string } = {};
        for (const key in headers) {
            parsedHeaders[key] = headers[key][0].value;
        }
        return parsedHeaders;
    }

    private parseCloudFrontRequestResult(response: CloudFrontRequestResult): LogPackage['response'] {
        const parsedResponse: LogPackage['response'] = {
            statusCode: 500,
            contentLength: 0,
        };

        if (typeof response === 'object' && response !== null) {
            if (typeof (response as CloudFrontResultResponse).status === 'string') {
                parsedResponse.statusCode = parseInt((response as CloudFrontResultResponse).status);
                parsedResponse.contentLength = (response as CloudFrontResultResponse).body?.length || 0;
            } else if (
                typeof response.body === 'object' &&
                response.body !== null &&
                typeof response.body.data === 'string'
            ) {
                parsedResponse.statusCode = 200; // Pass-through response code
                parsedResponse.contentLength = response.body.data.length;
            }
        }

        return parsedResponse;
    }
}
