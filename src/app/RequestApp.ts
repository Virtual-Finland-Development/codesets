import { APIGatewayProxyEventV2, CloudFrontRequestEvent } from "aws-lambda";
import { IStorage } from "../utils/lib/IStorage";
import LocalMemoryStorage from "../utils/lib/LocalMemoryStorage";
import { RuntimeFlags } from "../utils/runtime";
import RequestLogger, { RequestLoggerSettings } from "./RequestLogger";

export default class RequestApp {
    logger: RequestLogger; // Access to request logger
    storage: IStorage; // Access to primary storage
    runtimeFlags: typeof RuntimeFlags; // Access to static runtime flags object

    constructor(request: APIGatewayProxyEventV2 | CloudFrontRequestEvent, setup?: { storage?: IStorage, loggerSettings?: RequestLoggerSettings, runtimeFlags?: typeof RuntimeFlags }) {
        this.logger = new RequestLogger(request, setup?.loggerSettings);
        this.storage = setup?.storage || new LocalMemoryStorage();
        if (setup?.runtimeFlags) {
            // Merge runtime flags
            Object.assign(RuntimeFlags, setup.runtimeFlags);
        }
        this.runtimeFlags = RuntimeFlags; // Pass a reference
    }
}