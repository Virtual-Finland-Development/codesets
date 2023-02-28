import { CloudFrontRequestEvent, CloudFrontRequestResult } from "aws-lambda";
import { getExternalResourceURI } from "./utils/settings";

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    const request = event.Records[0].cf.request;

    if (request.uri.startsWith("/resource/")) {
        const resourceInfo = new URL(request.uri.replace("/resource/", ""));
        const resourceName = resourceInfo.pathname.replace("/", "");
        const resourceURI = getExternalResourceURI(resourceName);

        if (resourceURI) {
            return {
                status: "302",
                statusDescription: "Found",
                headers: {
                    location: [{
                        key: "Location",
                        value: resourceURI
                    }]
                }
            };
        }
    }
    
    return {
        status: "400",
        statusDescription: "Bad Request",
        body: "Bad Request",
    };
}

