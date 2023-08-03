import ExternalResource from '../../utils/data/models/ExternalResource';
import { getOutput } from '../../utils/data/parsers';
import dotNotatedSet from '../internal/nace-dot-notated.json';

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

export default new ExternalResource({
    name: 'SuomiFiKoodistotNace',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/toimiala_1_20080101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        async transform(naceResponse: any) {
            return naceResponse['codes'].map((nace: Nace) => {
                const dotNotation = dotNotatedSet.find(
                    (dotNotated: any) => dotNotated.replace('.', '') === nace.codeValue
                );
                if (dotNotation) {
                    nace.dotNotationCodeValue = dotNotation;
                }
                return nace;
            });
        },
        output(data: any) {
            return getOutput()<Nace[]>(data);
        },
    },
});
