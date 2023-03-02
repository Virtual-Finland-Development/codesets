import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from "aws-lambda";
import mime from "mime";
import bucketInfo from "./build/bucket-info.json"; // this file is generated by the infra/pulumi script
import { InternalResources } from "./resources/index";
import { getResource, listResources } from "./utils/data/ResourceRepository";
import { storeToS3 } from "./utils/lib/S3Bucket";
import { cutTooLongString } from "./utils/strings";

async function engageResourcesRouter(resourceURI: string): Promise<{ response: CloudFrontResultResponse | undefined, cacheable?: { filepath: string, data: string, mime: string }}> {

    const uriParts = resourceURI.split("?");
    const resourceName = uriParts[0].replace("/resources", "").replace("/", ""); // First occurence of "/" is removed
    if (!resourceName) {
        // On a requets path /resources, return a list of resources
        return {
            response: {
                status: "200",
                statusDescription: "OK: list of resources",
                body: JSON.stringify([...listResources(), ...InternalResources.listResources()]),
            }
        };
    }
    
    const resource = getResource(resourceName);
    if (resource) {
        console.log("Resource: ", resource.name);
        const resourceResponse = await resource.retrieve();

        // If resource size is larger than 1MB, store it in S3 and redirect to it instead
        // This is a workaround to avoid CloudFront cache limit
        // @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-restrictions.html#lambda-at-edge-function-restrictions
        console.log("Size: ", resourceResponse.size, "bytes");
        if (resourceResponse.size > 1024 * 1024) {
            const extension = mime.getExtension(resourceResponse.mime);
            const cachedName = `/resources/${resource.name}.${extension}`;

            return {
                response: undefined,
                cacheable: {
                    filepath: cachedName,
                    data: resourceResponse.data,
                    mime: resourceResponse.mime,
                }
            };
        }

        return {
            response: {
                status: "200",
                statusDescription: "OK: resource found",
                body: resourceResponse.data,
                bodyEncoding: "text",
                headers: {
                    "content-type": [ { key: "Content-Type", value: resourceResponse.mime } ],
                }
            }
        };
    }

    return {
        response: {
            status: "404",
            statusDescription: "Not Found: resource not found",
            body: JSON.stringify({ message: "Resource not found" }),
        },
    };
}

/**
 * Live environment handler
 * 
 * @param event 
 * @returns 
 */
export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
    try {
        const request = event.Records[0].cf.request;
        let uri = request.uri;
        console.log("URI: ", uri);
        
        if (uri.startsWith("/resources")) {
            const routerResponse = await engageResourcesRouter(uri);
            if (routerResponse.response) {
                console.log("Response: ", {
                    ...routerResponse.response,
                    body: cutTooLongString(routerResponse.response.body, 250),
                });
                return routerResponse.response;
            }

            if (routerResponse.cacheable) {
                console.log("Cacheable: ", {
                    filepath: routerResponse.cacheable.filepath,
                    data: cutTooLongString(routerResponse.cacheable.data, 250),
                    mime: routerResponse.cacheable.mime,
                });
                const bucketName = bucketInfo.bucketName;
                await storeToS3(bucketName, routerResponse.cacheable.filepath, routerResponse.cacheable.data, routerResponse.cacheable.mime);
                uri = routerResponse.cacheable.filepath; // pass through to s3 origin
            }
        }
        
        request.uri = uri; // Pass through to origin
        return request; 
    } catch (error: any) {
        console.log(error?.message, error?.stack);
        return {
            status: "500",
            statusDescription: "Internal Server Error",
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

/**
 * Local environment handler
 * 
 * @param event 
 * @returns 
 */
export async function offlineHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    try {
        let uri = event.rawPath;
        console.log("URI: ", uri);

        if (uri.startsWith("/resources")) {            
            const routerResponse: any = await engageResourcesRouter(uri);
            if (routerResponse.response) {
                return {
                    statusCode: parseInt(routerResponse.response.status),
                    body: routerResponse.response.body,
                }
            }

            if (routerResponse.cacheable) {
                console.log("Cacheable: ", routerResponse.cacheable.filepath);
                return {
                    statusCode: 200,
                    body: routerResponse.cacheable.data,
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
                    "Content-Type": resource.mime || "application/json",
                }
            }
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Not found" }),
        }
    } catch (error: any) {
        console.log(error?.message, error?.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error?.message }),
        }
    }
}

