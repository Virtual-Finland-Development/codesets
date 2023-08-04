import { any, array, number, object, optional, record, string } from 'valibot';
import Resource from '../../utils/data/models/Resource';
import { SuomiKoodistotInput, SuomiKoodistotInputSchema } from '../../utils/data/models/SuomiFiKoodistotResource';
import dotNotatedSet from '../internal/nace-dot-notated.json';

const NaceSchema = object({
    codeValue: string(),
    dotNotationCodeValue: optional(string()),
    topLevelGroupCode: optional(string()),
    order: number(),
    uri: string(),
    hierarchyLevel: number(),
    prefLabel: record(string(), string()),
    broaderCode: optional(object({
        codeValue: string(),
        order: number(),
        hierarchyLevel: number(),
    })),
    children: optional(array(any())), // NaceSchema[]
});

export default new Resource({
    name: 'SuomiFiKoodistotNace',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/toimiala_1_20080101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(naceResponse: SuomiKoodistotInput) {
            return naceResponse['codes'].map((nace) => {
                const dotNotation = dotNotatedSet.find(
                    (dotNotated: any) => dotNotated.replace('.', '') === nace.codeValue
                );
                return {
                    ...nace,
                    dotNotationCodeValue: dotNotation,
                }
            });
        },
    },
    schemas: {
        input: SuomiKoodistotInputSchema,
        output: array(NaceSchema),
    }
});
