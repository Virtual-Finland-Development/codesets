import InternalResource from '../../utils/data/models/InternalResource';
import { getOutput } from '../../utils/data/parsers';
import { filterCommonEscoDataSet } from '../../utils/esco';

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
            return filterCommonEscoDataSet<Skill>(skills, params);
        },
        output(data: any) {
            return getOutput()<Skill[]>(data);
        },
    },
});
