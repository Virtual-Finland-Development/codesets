import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontRequestEvent, CloudFrontRequestResult } from "aws-lambda";
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
        const resourceData = await resource.retrieve();
        return {
            status: "200",
            statusDescription: "OK: resource found",
            body: resourceData,
        };
    }
}

async function engageRouter(uri: string): Promise<CloudFrontRequestResult> {
    
    if (uri.startsWith("/resources")) {
        return await handleResourceUri(uri);
    }
    
    return {
        status: "404",
        statusDescription: "Not found",
        body: JSON.stringify({ message: "Not found" }),
    };
}


export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const uri = event.Records[0].cf.request.uri;
        console.log("URI: ", uri);
        return await engageRouter(uri);
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
        return {
            statusCode: response.status,
            body: response.body,
        }
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

