import { BaseSchema, Output, array, length, merge, number, object, optional, parse, record, recursive, string } from 'valibot';
import ExternalResource from './ExternalResource';

// Build a recursive object type with children of self-likes
// @see: https://github.com/fabian-hiller/valibot/issues/72
const BaseSuomiKoodistoInputItemSchema = object({
    codeValue: string(),
    order: number(),
    uri: string(),
    hierarchyLevel: number(),
    prefLabel: record(string([length(2)]), string()), // {"en" => "Cook", "fi" => "Kokki", ...}
    dotNotationCodeValue: optional(string()),
    topLevelGroupCode: optional(string()),
    broaderCode: optional(object({
        codeValue: string(),
        order: number(),
        hierarchyLevel: number(),
    })),
});
export type SuomiKoodistoInputItem = Output<typeof BaseSuomiKoodistoInputItemSchema> &  {
    children?: SuomiKoodistoInputItem[],
};
export const SuomiKoodistoInputItemSchema: BaseSchema<SuomiKoodistoInputItem> = merge([
    BaseSuomiKoodistoInputItemSchema, object({
        children: optional(recursive(() => array(SuomiKoodistoInputItemSchema)))
    })
]);

export const SuomiKoodistotInputSchema = object({
    codes: array(SuomiKoodistoInputItemSchema),
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

export default class SuomiFiKoodistotResource extends ExternalResource {
    
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
