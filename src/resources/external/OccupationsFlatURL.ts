import ZipResource from '../../utils/data/models/ZipResource';
import { Output } from '../../utils/data/parsers';

type ISCO = {
    uri: string;
    status: string;
    notation: string;
    prefLabel: {
        fi: string;
        sv: string;
        en: string;
    };
    altLabel: {
        fi: string[];
        sv: string[];
        en: string[];
    };
};

export default new ZipResource({
    name: 'OccupationsFlatURL',
    uri: 'https://tyomarkkinatori.fi/dam/jcr:42efb1fc-93f3-4146-a46f-71c2f9f5eb9b/occupations.json.zip',
    mime: 'application/json; charset=utf-8',
    parsers: {
        output(data: any) {
            return Output()<ISCO[]>(data);
        },
        async transform(occupationsRaw: any) {
            return occupationsRaw.filter((occupation: any) => Boolean(occupation.notation));
        },
    },
});
