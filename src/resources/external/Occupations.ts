import ZipResource from '../../utils/data/models/ZipResource';
import { getOutput } from '../../utils/data/parsers';

type ISCO = {
    uri: string;
    notation: string;
    prefLabel: {
        fi: string;
        sv: string;
        en: string;
    };
};

export default new ZipResource({
    name: 'Occupations',
    uri: 'https://tyomarkkinatori.fi/dam/jcr:42efb1fc-93f3-4146-a46f-71c2f9f5eb9b/occupations.json.zip',
    mime: 'application/json; charset=utf-8',
    parsers: {
        async transform(occupationsRaw: any) {
            return occupationsRaw
                .filter((occupation: any) => Boolean(occupation.notation))
                .map((occupation: any) => {
                    return {
                        uri: occupation.uri,
                        notation: occupation.notation,
                        prefLabel: {
                            fi: occupation.prefLabel.fi,
                            sv: occupation.prefLabel.sv,
                            en: occupation.prefLabel.en,
                        },
                    };
                });
        },
        output(data: any) {
            return getOutput()<ISCO[]>(data);
        },
    },
});
