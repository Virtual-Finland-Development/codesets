import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from "aws-lambda";
import { InternalResources } from "./resources/index";
import { getResource, listResources } from "./utils/ResourceRepository";
import { cutTooLongString } from "./utils/strings";

async function engageResourcesRouter(resourceURI: string): Promise<CloudFrontResultResponse | undefined> {
    const uriParts = resourceURI.split("?");
    const resourceName = uriParts[0].replace("/", ""); // First occurence of "/" is removed
    if (!resourceName) {
        return {
            status: "200",
            statusDescription: "OK: list of resources",
            body: JSON.stringify([...listResources(), ...InternalResources.listResources()]),
        };
    }
    
    const resource = getResource(resourceName);
    if (resource) {
        console.log("Resource: ", resource.name);
        const resourceResponse = await resource.retrieve();

        // If resource size is larger than 1MB, return a redirect to the resource / bybass cf cache
        // This is a workaround to avoid CloudFront cache limit
        // @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-restrictions.html#lambda-at-edge-function-restrictions
        console.log("Size: ", resourceResponse.size, "bytes");
        if (resourceResponse.size > 1024 * 1024) {
            return {
                status: "302",
                statusDescription: "Found: resource found",
                headers: {
                    location: [ { key: "Location", value: resource.uri } ],
                }
            };
        }

        return {
            status: "200",
            statusDescription: "OK: resource found",
            body: resourceResponse.data,
            bodyEncoding: "text",
            headers: {
                "content-type": [ { key: "Content-Type", value: resourceResponse.mime } ],
            }
        };
    }
    return;
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const request = event.Records[0].cf.request;
        let uri = request.uri;
        console.log("URI: ", uri);
        
        if (uri.startsWith("/resources")) {
            uri = uri.replace("/resources", "");
            const response = await engageResourcesRouter(uri);
            if (response) {
                console.log("Response: ", {
                    ...response,
                    body: cutTooLongString(response.body, 250),
                });
                return response;
            }
        }
        
        request.uri = uri; // Pass through to origin
        return request; 
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        return {
            status: "500",
            statusDescription: "Internal Server Error",
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

export async function offlineHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    try {
        let uri = event.rawPath;
        console.log("URI: ", uri);

        if (uri.startsWith("/resources")) {
            uri = uri.replace("/resources", "");

            const response: any = await engageResourcesRouter(uri);
            if (response) {
                return {
                    statusCode: response.status,
                    body: response.body,
                }
            }
        }
        
        // Simulate CloudFront pass through
        if (uri === "/") {
            uri = "/index.html";
        }
        
        const resource = await InternalResources.getResourcePassThrough(uri);
        if (resource) {
            return {
                statusCode: 200,
                body: resource.body,
                headers: {
                    "Content-Type": resource.mime || "application/json; charset=utf-8",
                }
            }
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Not found" }),
        }
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

