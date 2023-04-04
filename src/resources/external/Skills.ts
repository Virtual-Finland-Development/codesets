import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { getLocalesFilter, getSearchPhrases } from '../../utils/filters';

interface Skill {
    uri: string;
    prefLabel: {
        [key: string]: string;
    };
}

export default new InternalResource({
    name: 'Skills',
    uri: 'skills.json',
    parsers: {
        async transform(skills: any, params: Record<string, string>) {
            const localesFilter = getLocalesFilter(params);
            if (localesFilter.length > 0) {
                skills = skills.map((skill: Skill) => {
                    const filteredPrefLabel = Object.entries(skill.prefLabel).reduce((acc, [key, value]) => {
                        if (localesFilter.includes(key)) {
                            acc[key] = value;
                        }
                        return acc;
                    }, {} as Skill['prefLabel']);
                    return {
                        ...skill,
                        prefLabel: filteredPrefLabel,
                    };
                });
            }

            const searchPhrases = getSearchPhrases(params);
            if (searchPhrases.length > 0) {
                return skills.filter((skill: Skill) => {
                    const descriptions = Object.values(skill.prefLabel).map((text) => {
                        return text.toLocaleLowerCase();
                    });
                    return searchPhrases.some((phrase: string) => {
                        return descriptions.some((description: string) => {
                            return description.includes(phrase);
                        });
                    });
                });
            }
            return skills;
        },
        output(data: any) {
            return getOutput()<Skill[]>(data);
        },
    },
});
