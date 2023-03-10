import Resource from '../../utils/data/models/Resource';

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

export default new Resource<ISCO[]>({
    name: 'OccupationsEscoURL',
    uri: 'https://tyomarkkinatori.fi/api/codes/v1/isco',
});
