import { array, object, optional, record, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import { SuomiKoodistoInputItem, SuomiKoodistotInput, SuomiKoodistotInputSchema } from '../../utils/data/models/SuomiFiKoodistotResource';

const RegionsOutputSchema = array(object({
    code: string(), // "FI-01",
    statisticsFinlandCode: optional(string()), // "21",
    label: record(string(), string()),
}));

export default new ExternalResource({
    name: 'Regions',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/maakunta_1_20230101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        input: SuomiKoodistotInputSchema,
        async transform(koodistoResponse: SuomiKoodistotInput) {
            const { iso31662 } = await import('iso-3166');
            const fiIsos = iso31662.filter((iso: any) => iso.parent === 'FI');
            function mapIsoCode(region: SuomiKoodistoInputItem): string {
                const isoEntity = fiIsos.find((iso: any) => {
                    return iso.name === region['prefLabel']['fi'];
                });
                if (isoEntity) {
                    return isoEntity.code;
                }
                return region.codeValue;
            }

            return koodistoResponse['codes'].map((region) => {
                return {
                    code: mapIsoCode(region),
                    statisticsFinlandCode: region['codeValue'],
                    label: region['prefLabel'],
                };
            });
        },
        output: RegionsOutputSchema,
    }
});
