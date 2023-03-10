const { Reader } = require("@transcend-io/conflux");

import Resource, { ResourceData } from "./Resource";

export default class ZipResource<T> extends Resource<T> {
    
    protected async _parseResponseRawData(data: ResourceData) {
        if (!(data instanceof Response)) {
            throw new Error("Unable to retrieve data");
        }
        
        const zip = await data.blob();
        const entry = await Reader(zip).next();
        if (entry && entry.value) {
            return await entry.value.text();
        }

        throw new Error("Could not find file in zip");
    }

    protected async _resolveDataResponse(response: Response): Promise<ResourceData> {
        return response;
    }
}