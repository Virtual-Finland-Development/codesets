import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontHeaders, CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from "aws-lambda";

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
};

export type RequestLoggerSettings = {
    disable?: {
        sourceIp?: boolean;
    }
};

export default class RequestLogger {
    private readonly request: APIGatewayProxyEventV2 | CloudFrontRequestEvent;
    private readonly configuration: RequestLoggerSettings;

    constructor(request: APIGatewayProxyEventV2 | CloudFrontRequestEvent, configuration?: RequestLoggerSettings) {
        this.request = request;
        this.configuration = configuration || {};
    }

    public log(response: APIGatewayProxyStructuredResultV2 | CloudFrontRequestResult): void {
        const log = this.parseLogPackage(this.request, response);

        if (this.configuration.disable?.sourceIp) {
            log.trace.sourceIp = undefined;
        }

        if (typeof log.response.statusCode !== "number" || log.response.statusCode >= 400) {
            console.error(JSON.stringify(log));
        } else {
            console.log(JSON.stringify(log));
        }
    }

    private parseLogPackage(request: APIGatewayProxyEventV2 | CloudFrontRequestEvent, response: APIGatewayProxyStructuredResultV2 | CloudFrontRequestResult): LogPackage {
        // identify if event is APIGatewayProxyEventV2 or CloudFrontRequestEvent
        if (typeof (request as any).requestContext !== "undefined") {
            return this.parseApiGatewayEvent(request as APIGatewayProxyEventV2, response as APIGatewayProxyStructuredResultV2);
        }
        return this.parseCloudFrontEvent(request as CloudFrontRequestEvent, response as CloudFrontRequestResult);
    }

    private parseApiGatewayEvent(request: APIGatewayProxyEventV2, response: APIGatewayProxyStructuredResultV2): LogPackage {
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
        };
    }

    private parseCloudFrontEventHeaders(headers: CloudFrontHeaders): { [key: string]: string } {
        const parsedHeaders: { [key: string]: string } = {};
        for (const key in headers) {
            parsedHeaders[key] = headers[key][0].value;
        }
        return parsedHeaders;
    }

    private parseCloudFrontRequestResult(response: CloudFrontRequestResult): { statusCode: number; contentLength: number } {
        const parsedResponse = {
            statusCode: 500,
            contentLength: 0,
        };

        if (typeof response === "object" && response !== null) {
            if (typeof (response as CloudFrontResultResponse).status === "string") {
                parsedResponse.statusCode = parseInt((response as CloudFrontResultResponse).status);
                parsedResponse.contentLength = (response as CloudFrontResultResponse).body?.length || 0;
            } else if (typeof response.body === "object" && response.body !== null && typeof response.body.data === "string") {
                parsedResponse.statusCode = 200; // Pass-through response code
                parsedResponse.contentLength = response.body.data.length;
            }
        }
        
        return parsedResponse;
    }
}