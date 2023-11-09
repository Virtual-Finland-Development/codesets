import { Output, array, length, object, record, string } from 'valibot';
import ExternalResource from '../../utils/data/models/ExternalResource';
import { filterCommonEscoDataSet } from '../../utils/esco';
import { getEnvironment } from '../../utils/runtime';

const SkillSchema = object({
    uri: string(),
    prefLabel: record(string([length(2)]), string()),
});
type Skill = Output<typeof SkillSchema>;

const SkillsResponseSchema = array(SkillSchema);
type SkillsResponse = Output<typeof SkillsResponseSchema>;

export default new ExternalResource({
    name: 'Skills',
    uri: `${getEnvironment().escoApi.endpoint}/skills`,
    parsers: {
        input: SkillsResponseSchema,
        async transform(skills: SkillsResponse, params?: Record<string, string>) {
            return filterCommonEscoDataSet<Skill>(skills, params);
        },
        output: SkillsResponseSchema,
    },
});
