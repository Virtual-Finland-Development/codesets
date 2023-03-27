import Resource from '../../utils/data/models/Resource';
import { getOutput } from '../../utils/data/parsers';

interface WorkPermit {
    codeValue: string;
    order: number;
    uri: string;
    hierarchyLevel: number;
    prefLabel: {
        fi: string;
        en: string;
        se?: string;
    };
}

export default new Resource({
    name: 'SuomiFiKoodistotWorkPermit',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/dataecon/codeschemes/permit/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(koodistoResponse: any) {
            return koodistoResponse['codes'].map((permit: any) => {
                return {
                    codeValue: permit['codeValue'],
                    order: permit['order'],
                    uri: permit['uri'],
                    hierarchyLevel: permit['hierarchyLevel'],
                    prefLabel: permit['prefLabel'],
                };
            });
        },
        output(data: any) {
            return getOutput()<WorkPermit[]>(data);
        },
    },
});
