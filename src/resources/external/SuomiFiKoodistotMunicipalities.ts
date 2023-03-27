import Resource from '../../utils/data/models/Resource';
import { getOutput } from '../../utils/data/parsers';

interface MunicipalityOutput {
    Koodi: string;
    Selitteet: Array<{
        Kielikoodi: string;
        Teksti: string;
    }>;
}

export default new Resource({
    name: 'SuomiFiKoodistotMunicipalities',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/kunta_1_20230101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(koodistoResponse: any) {
            return koodistoResponse['extensions'].reduce((municipalities: any, extension: any) => {
                const members = extension['members'].map((member: any) => {
                    return {
                        Koodi: member['code']['codeValue'],
                        Selitteet: Object.entries(member['code']['prefLabel']).map(([locale, name]) => {
                            return {
                                Kielikoodi: locale,
                                Teksti: name,
                            };
                        }),
                    };
                });

                municipalities.push(...members);
                return municipalities;
            }, []);
        },
        output(data: any) {
            return getOutput()<MunicipalityOutput[]>(data);
        },
    },
});
