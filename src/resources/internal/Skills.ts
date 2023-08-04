import { Output, array, length, object, record, string } from 'valibot';
import InternalResource from '../../utils/data/models/InternalResource';
import { filterCommonEscoDataSet } from '../../utils/esco';

const SkillSchema = object({
    uri: string(),
    prefLabel: record(string([length(2)]), string()),
})
type Skill = Output<typeof SkillSchema>;

const SkillsResponseSchema = array(SkillSchema);
type SkillsResponse = Output<typeof SkillsResponseSchema>;

export default new InternalResource({
    name: 'Skills',
    uri: 'skills.json',
    parsers: {
        input: SkillsResponseSchema,
        async transform(skills: SkillsResponse, params: Record<string, string>) {
            return filterCommonEscoDataSet<Skill>(skills, params);
        },
        output: SkillsResponseSchema,
    }
});
