import Resource from '../../utils/data/models/Resource';
import { getInput, getOutput } from '../../utils/data/parsers';
import ISO639Languages from '../library/ISO639Languages';

interface EscoLanguagesInput {
    title: 'languages';
    links: {
        narrowerSkill: Array<{
            href: string;
            uri: string;
            title: string;
            skillType: string;
        }>;
    };
}

interface EscoLanguageOutput {
    id: string;
    name: string;
    twoLetterISOLanguageName: string;
    threeLetterISOLanguageName: string;
    escoUri: string;
}

export default new Resource({
    name: 'EscoLanguages',
    uri: 'https://esco.ec.europa.eu/sites/default/files/languages.json',
    parsers: {
        input(data: any) {
            return getInput()<EscoLanguagesInput>(data);
        },
        async transform(escoResponse: any) {
            const escoCodeMap = escoResponse.links.narrowerSkill.reduce((acc: any, language: any) => {
                const code = language.title.toLocaleLowerCase();
                acc[code] = language.uri;
                return acc;
            }, {});

            return ISO639Languages.map((language: any) => {
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
        output(data: any) {
            return getOutput()<EscoLanguageOutput[]>(data);
        },
    },
});
