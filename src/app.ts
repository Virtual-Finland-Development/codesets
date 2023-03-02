import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from "aws-lambda";
import { InternalResources } from "./resources/index";
import { getResource, listResources } from "./utils/ResourceRepository";

async function engageResourcesRouter(uri: string): Promise<CloudFrontResultResponse | undefined> {
    
    const uriParts = uri.split("?");
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
        const resourceData = await resource.retrieve();
        return {
            status: "200",
            statusDescription: "OK: resource found",
            body: resourceData,
            bodyEncoding: "text",
            headers: {
                "Content-Type": [ { key: "Content-Type", value: "application/json; charset=utf-8" } ],
            }
        };
    }
    return;
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const request = event.Records[0].cf.request;
        const uri = request.uri;
        console.log("URI: ", uri);
        
        const response = await engageResourcesRouter(uri);
        if (response) {
            console.log("Response: ", response.status, response.statusDescription);
            return response;
        }

        return request; // Pass through to origin
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
        const response: any = await engageResourcesRouter(uri);
        if (response) {
            return {
                statusCode: response.status,
                body: response.body,
            }
        }
        
        const resource = await InternalResources.getResourcePassThrough(uri);
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

