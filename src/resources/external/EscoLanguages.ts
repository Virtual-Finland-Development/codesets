import { Output, array, equal, length, object, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import ISO639Languages from '../library/ISO639Languages';

const EscoLanguagesInputSchema = object({
    title: string([equal('languages')]),
    links: object({
        narrowerSkill: array(object({
            href: string(),
            uri: string(),
            title: string(),
            skillType: string(),
        })),
    }),
});

type EscoLanguagesInput = Output<typeof EscoLanguagesInputSchema>;

const EscoLanguageOutputSchema = array(object({
    id: string(),
    name: string(),
    twoLetterISOLanguageName: string([length(2)]),
    threeLetterISOLanguageName: string([length(3)]),
    escoUri: string(),
}));

export default new ExternalResource({
    name: 'EscoLanguages',
    uri: 'https://esco.ec.europa.eu/sites/default/files/languages.json',
    parsers: {
        input: EscoLanguagesInputSchema,
        async transform(escoResponse: EscoLanguagesInput) {
            const escoCodeMap = escoResponse.links.narrowerSkill.reduce((acc: any, language: any) => {
                const code = language.title.toLocaleLowerCase();
                acc[code] = language.uri;
                return acc;
            }, {});

            return ISO639Languages.map((language) => {
                const mapCode = language.englishName.toLocaleLowerCase();
                return {
                    id: language.id,
                    name: language.englishName,
                    twoLetterISOLanguageName: language.twoLetterISOLanguageName,
                    threeLetterISOLanguageName: language.threeLetterISOLanguageName,
                    escoUri: escoCodeMap[mapCode] || 'http://data.europa.eu/esco/skill/L1',
                };
            });
        },
        output: EscoLanguageOutputSchema,
    },
});
