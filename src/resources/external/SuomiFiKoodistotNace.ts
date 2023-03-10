import Resource from '../../utils/data/models/Resource';
import { getOutput } from '../../utils/data/parsers';

interface Nace {
    codeValue: string;
    dotNotationCodeValue?: string;
    topLevelGroupCode?: string;
    order: number;
    uri: string;
    hierarchyLevel: number;
    prefLabel: {
        en: string;
    };
    broaderCode?: {
        codeValue: string;
        order: number;
        hierarchyLevel: number;
    };
    children?: Nace[];
}

export default new Resource({
    name: 'SuomiFiKoodistotNace',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/toimiala_1_20080101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(naceResponse: any) {
            return naceResponse['codes'];
        },
        output(data: any) {
            return getOutput()<Nace[]>(data);
        },
    },
});
