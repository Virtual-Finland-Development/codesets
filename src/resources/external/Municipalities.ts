import { array, object, string } from 'valibot';
import Resource from '../../utils/data/models/Resource';
import { SuomiKoodistotInput, SuomiKoodistotInputSchema } from '../../utils/data/models/SuomiFiKoodistotResource';

const MunicipalitiesOutputSchema = array(object({
    Koodi: string(),
    Selitteet: array(object({
        Kielikoodi: string(),
        Teksti: string(),
    })),
}));

export default new Resource({
    name: 'Municipalities',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/kunta_1_20230101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(koodistoResponse: SuomiKoodistotInput) {
            return koodistoResponse['codes'].map((member) => {
                return {
                    Koodi: member['codeValue'],
                    Selitteet: Object.entries(member['prefLabel']).map(([locale, name]) => {
                        return {
                            Kielikoodi: locale,
                            Teksti: name,
                        };
                    }),
                };
            });
        },
    },
    schemas: {
        input: SuomiKoodistotInputSchema,
        output: MunicipalitiesOutputSchema,
    }
});
