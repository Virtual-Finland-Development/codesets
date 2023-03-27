import Resource from '../../utils/data/models/Resource';
import { getInput, getOutput } from '../../utils/data/parsers';

interface RegionInputResource {
    id: string;
    codeValue: string;
    uri: string;
    url: string;
    codesUrl: string;
    extensionsUrl: string;
    codes: RegionInput[];
}

interface RegionInput {
    id: string;
    codeValue: string;
    uri: string;
    url: string;
    status: string;
    order: number;
    hierarchyLevel: number;
    startDate: string;
    created: string;
    modified: string;
    prefLabel: {
        en: string;
        fi: string;
        sv: string;
    };
    membersUrl: string;
}

interface RegionOutput {
    code: string; // "FI-01",
    statisticsFinlandCode?: string; // "21",
    label: {
        fi: string;
        sv: string;
        en: string;
    };
}

export default new Resource({
    name: 'SuomiFiKoodistotRegions',
    uri: 'https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/maakunta_1_20230101/?format=json&embedCodes=true&embedExtensions=true&embedMembers=true&expand=extension,member,codeScheme,code,memberValue,codeRegistry,organization,valueType,externalReference,propertyType&downloadFile=false&pretty',
    parsers: {
        input(data: string) {
            return getInput()<RegionInputResource>(data);
        },
        async transform(koodistoResponse: any) {
            const { iso31662 } = await import('iso-3166');
            const fiIsos = iso31662.filter((iso: any) => iso.parent === 'FI');
            function mapIsoCode(region: RegionInput): string {
                const isoEntity = fiIsos.find((iso: any) => {
                    return iso.name === region['prefLabel']['fi'];
                });
                if (isoEntity) {
                    return isoEntity.code;
                }
                return region.codeValue;
            }

            return koodistoResponse['codes'].map((region: RegionInput) => {
                return {
                    code: mapIsoCode(region),
                    statisticsFinlandCode: region['codeValue'],
                    label: region['prefLabel'],
                };
            });
        },
        output(data: any) {
            return getOutput()<RegionOutput[]>(data);
        },
    },
});
