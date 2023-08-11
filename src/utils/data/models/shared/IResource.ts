import IDataPackage from "./IDataPackage";

export default interface IResource {
    uri: string;
    name: string;
    type: string;
    /**
     * Retrieve the data from the resource
     */
    retrieve(params: Record<string, string>): Promise<{ data: string; mime: string; size: number }>;
    retrieveDataPackage(params?: Record<string, string>): Promise<IDataPackage>;
    parseRawData(rawData: string, mime: string, params?: Record<string, string>): Promise<string>;
}