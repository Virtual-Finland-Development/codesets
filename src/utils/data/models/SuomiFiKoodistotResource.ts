import { getOutput } from '../parsers';
import BaseResource from './internal/BaseResource';

interface SuomiFiKoodistoOutput {
    codeValue: string;
    order: number;
    uri: string;
    hierarchyLevel: number;
    prefLabel: {
        fi: string;
        en?: string;
        se?: string;
    };
}

export default class SuomiFiKoodistotResource extends BaseResource {
    protected async _parseRawData_transform(rawData: any): Promise<any> {
        return rawData['codes'].map((permit: any) => {
            return {
                codeValue: permit['codeValue'],
                order: permit['order'],
                uri: permit['uri'],
                hierarchyLevel: permit['hierarchyLevel'],
                prefLabel: permit['prefLabel'],
            };
        });
    }

    protected _parseRawData_output(rawData: any): string {
        return getOutput()<SuomiFiKoodistoOutput[]>(rawData);
    }
}
