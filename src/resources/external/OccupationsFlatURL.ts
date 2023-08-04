import { Output, array, object, optional, record, string } from 'valibot';
import ZipResource from '../../utils/data/models/ZipResource';

const IscoInputSchema = array(object({
    uri: string(),
    notation: optional(string()),
    prefLabel: record(string(), string()),
}));
type IscoInput = Output<typeof IscoInputSchema>;

const IscoOutputSchema = array(object({
    uri: string(),
    notation: string(),
    prefLabel: record(string(), string()),
}));

export default new ZipResource({
    name: 'OccupationsFlatURL',
    uri: 'https://tyomarkkinatori.fi/dam/jcr:42efb1fc-93f3-4146-a46f-71c2f9f5eb9b/occupations.json.zip',
    mime: 'application/json; charset=utf-8',
    parsers: {
        input: IscoInputSchema,
        async transform(occupationsRaw: IscoInput) {
            return occupationsRaw
                .filter((occupation) => Boolean(occupation.notation))
                .map((occupation) => {
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
        output: IscoOutputSchema,
    }
});
