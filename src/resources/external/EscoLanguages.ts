import { Output, array, equal, maxLength, minLength, object, string } from 'valibot';
import Resource from '../../utils/data/models/Resource';
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
    twoLetterISOLanguageName: string([minLength(2), maxLength(2)]),
    threeLetterISOLanguageName: string([minLength(3), maxLength(3)]),
    escoUri: string(),
}));

export default new Resource({
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
