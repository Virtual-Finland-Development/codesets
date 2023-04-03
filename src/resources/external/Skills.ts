import Resource from '../../utils/data/models/Resource';
import { getInternalResourceUri } from '../../utils/runtime';

export default new Resource({
    name: 'Skills',
    uri: getInternalResourceUri('skills.json'),
    parsers: {
        async transform(skills: any) {
            return skills;
        },
    },
});
