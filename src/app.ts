import { CloudFrontRequestEvent, CloudFrontRequestResult } from "aws-lambda";
import { getResource, listResources } from "./utils/ResourceRepository";

async function handleResourceEvent(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    const request = event.Records[0].cf.request;
    
    if (request.uri.startsWith("/resources")) {
        const uriParts = request.uri.replace("/resources", "").split("?");
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
            };
        }
    }
    
    return {
        status: "404",
        statusDescription: "Not found",
        body: JSON.stringify({ message: "Not found" }),
    };
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        console.log("Event: ", JSON.stringify(event, null, 2));
        return await handleResourceEvent(event);
    } catch (error: any) {
        console.error(error?.message, error?.stack);
        return {
            status: "500",
            statusDescription: "Internal Server Error",
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

