import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontRequestEvent, CloudFrontRequestResult } from "aws-lambda";
import { getLocalModeResourcePassThrough } from "./resources/index";
import { getResource, listResources } from "./utils/ResourceRepository";

async function handleResourceUri(uri: string): Promise<CloudFrontRequestResult> {
    
    const uriParts = uri.replace("/resources", "").split("?");
    const resourceName = uriParts[0].replace("/", ""); // First occurence of "/" is removed
    if (!resourceName) {
        return {
            status: "200",
            statusDescription: "OK: list of resources",
            body: JSON.stringify(listResources()),
        };
    }
    
    const resource = getResource(resourceName);
    if (resource) {
        console.log("Resource: ", resource.name);
        const resourceData = await resource.retrieve();
        return {
            status: "200",
            statusDescription: "OK: resource found",
            body: resourceData,
            headers: {
                "Content-Type": [ { key: "Content-Type", value: "application/json; charset=utf-8" } ],
            }
        };
    }
    return;
}

async function engageRouter(uri: string): Promise<CloudFrontRequestResult> {
    if (uri.startsWith("/resources")) {
        return handleResourceUri(uri);
    }
    return;
}


export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const uri = event.Records[0].cf.request.uri;
        console.log("URI: ", uri);
        
        const response = await engageRouter(uri);
        if (response) {
            return response;
        }

        return event.Records[0].cf.request; // Pass through to origin
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
        const uri = event.rawPath;
        console.log("URI: ", uri);
        const response: any = await engageRouter(uri);
        if (response) {
            return {
                statusCode: response.status,
                body: response.body,
            }
        }
        
        const resource = await getLocalModeResourcePassThrough(uri);
        if (resource) {
            return {
                statusCode: 200,
                body: resource,
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

