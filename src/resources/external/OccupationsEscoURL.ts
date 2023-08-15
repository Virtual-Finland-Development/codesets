import ExternalResource from '../../utils/data/models/ExternalResource';
import { getOutput } from '../../utils/data/parsers';

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
    broader?: string[];
    narrower?: ISCO[];
};

export default new ExternalResource({
    name: 'OccupationsEscoURL',
    uri: 'https://tyomarkkinatori.fi/api/codes/v1/isco',
    parsers: {
        output(data: any) {
            return getOutput()<ISCO[]>(data);
        },
    },
});
