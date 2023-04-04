import axios from 'axios';

export default {
    host: 'http://localhost:8080',
    async getSkills(pageNumber = 0, pageSize = 500) {
        const response = await axios.get(
            `${this.host}/resource/skill?isInScheme=http://data.europa.eu/esco/concept-scheme/member-skills&language=en&offset=${pageNumber}&limit=${pageSize}`
        );
        return response.data;
    },
};
