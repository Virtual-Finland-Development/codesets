import { CloudFrontRequestEvent, CloudFrontRequestResult } from "aws-lambda";
import { getExternalResourceURI } from "./utils/settings";

async function handleResourceEvent(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    const request = event.Records[0].cf.request;
    
    if (request.uri.startsWith("/resource/")) {
        const resourceName = request.uri.replace("/resource/", "").split("?")[0];
        const resourceURI = getExternalResourceURI(resourceName);

        if (resourceURI) {
            console.log("Resource URI: ", resourceURI);
            const resourceData = await fetch(resourceURI).then((response) => response.text());
            return {
                status: "200",
                statusDescription: "Resource found",
                body: resourceData,
            };
        }
    }
    
    return {
        status: "400",
        statusDescription: "Bad Request",
        body: JSON.stringify({ message: "Bad Request" }),
    };
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        console.log("Event: ", JSON.stringify(event, null, 2));
        return await handleResourceEvent(event);
    } catch (error: any) {
        console.log("Error: ", error?.message, error?.stack);
        return {
            status: "500",
            statusDescription: "Internal Server Error",
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

