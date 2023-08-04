import { Output, array, number, object, parse, record, string } from 'valibot';
import BaseResource from './internal/BaseResource';

export const SuomiKoodistoInputObjectSchema = object({
    codeValue: string(),
    order: number(),
    uri: string(),
    hierarchyLevel: number(),
    prefLabel: record(string(), string()),
});
export type SuomiKoodistoInputObject = Output<typeof SuomiKoodistoInputObjectSchema>;

export const SuomiKoodistotInputSchema = object({
    codes: array(SuomiKoodistoInputObjectSchema),
});
export type SuomiKoodistotInput = Output<typeof SuomiKoodistotInputSchema>;

export const SuomiKoodistotOutputSchema = array(object({
    codeValue: string(),
    order: number(),
    uri: string(),
    hierarchyLevel: number(),
    prefLabel: record(string(), string()),
}));
export type SuomiKoodistotOutput = Output<typeof SuomiKoodistotOutputSchema>;

export default class SuomiFiKoodistotResource extends BaseResource {
    
    protected _parseRawData_parseInputSchema(rawData: unknown) {
        return parse(SuomiKoodistotInputSchema, rawData);
    }

    protected async _parseRawData_transform(data: SuomiKoodistotInput) {
        return data['codes'].map((member) => {
            return {
                codeValue: member['codeValue'],
                order: member['order'],
                uri: member['uri'],
                hierarchyLevel: member['hierarchyLevel'],
                prefLabel: member['prefLabel'],
            };
        });
    }

    protected _parseRawData_parseOutputSchema(data: SuomiKoodistotOutput) {
        return parse(SuomiKoodistotOutputSchema, data);
    }
}
