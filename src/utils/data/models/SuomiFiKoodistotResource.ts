import { Output, any, array, length, number, object, optional, parse, record, string } from 'valibot';
import BaseResource from './internal/BaseResource';

export const SuomiKoodistoInputObjectSchema = object({
    codeValue: string(),
    order: number(),
    uri: string(),
    hierarchyLevel: number(),
    prefLabel: record(string([length(2)]), string()), // {"en" => "Cook", ...}
    dotNotationCodeValue: optional(string()),
    topLevelGroupCode: optional(string()),
    broaderCode: optional(object({
        codeValue: string(),
        order: number(),
        hierarchyLevel: number(),
    })),
    children: optional(array(any())), // @TODO: fix any() as SuomiKoodistoInputObjectSchema
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
    prefLabel: record(string([length(2)]), string()),
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
