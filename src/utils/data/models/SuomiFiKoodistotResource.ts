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

export default class SuomiFiKoodistotResource<I = unknown, O = unknown> extends BaseResource<I, O> {
    
    protected _parseRawData_parseInputSchema(rawData: any) {
        return parse(SuomiKoodistotInputSchema, rawData);
    }

    protected async _parseRawData_transform(rawData: SuomiKoodistotInput) {
        return rawData['codes'].map((member) => {
            return {
                codeValue: member['codeValue'],
                order: member['order'],
                uri: member['uri'],
                hierarchyLevel: member['hierarchyLevel'],
                prefLabel: member['prefLabel'],
            };
        });
    }

    protected _parseRawData_parseOutputSchema(rawData: SuomiKoodistotOutput) {
        return parse(SuomiKoodistotOutputSchema, rawData);
    }
}
