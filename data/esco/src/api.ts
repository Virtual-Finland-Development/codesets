import axios from 'axios';
import { logProgress } from './utils';

async function getAPIResults(
    getDataPage: (pageNumber: number, pageSize: number) => Promise<{ total: number; items: any[] }>
) {
    // Fetch all the skills
    let pageNumber = 0;
    const pageSize = 100;
    let max = -1;
    const results: any[] = [];

    do {
        if (pageNumber === 0) {
            logProgress({
                pageNumber,
                max,
                chunk: 0,
                retrievedTotal: 0,
            });
        }

        // Fetch the next page of data
        const responseData = await getDataPage(pageNumber, pageSize);
        if (responseData.total === 0) {
            console.log('No results');
            break;
        }
        if (max === -1) {
            max = responseData.total;
            console.log('> Setting max to the total', max);
        }
        pageNumber++;

        for (const item of responseData.items) {
            results.push(item);
        }

        logProgress({
            pageNumber,
            max,
            chunk: responseData.items.length,
            retrievedTotal: results.length,
        });

        if (pageNumber * pageSize > max) {
            console.log('Reached max');
            break;
        }
    } while (results.length < max);

    return results;
}

export default {
    host: 'http://localhost:8080',

    async getSkills() {
        return await getAPIResults(this.getSkillsPage.bind(this));
    },
    async getSkillsPage(pageNumber = 0, pageSize = 500): Promise<{ total: number; items: any[] }> {
        const results: any[] = [];

        const response = await axios.get(
            `${this.host}/resource/skill?isInScheme=http://data.europa.eu/esco/concept-scheme/member-skills&language=en&offset=${pageNumber}&limit=${pageSize}`
        );
        const responseData = await response.data;

        // Get the items from the response
        const items = Object.values(responseData._embedded);
        for (const item of items) {
            results.push(item);
        }

        return {
            total: parseInt(responseData.total),
            items: results,
        };
    },

    async getOccupations() {
        return await getAPIResults(this.getOccupationsPage.bind(this));
    },
    async getOccupationsPage(pageNumber = 0, pageSize = 500): Promise<{ total: number; items: any[] }> {
        const results: any[] = [];

        const response = await axios.get(
            `${this.host}/resource/occupation?isInScheme=http://data.europa.eu/esco/concept-scheme/occupations&language=en&offset=${pageNumber}&limit=${pageSize}`
        );
        const responseData = await response.data;

        // Get the items from the response
        const items = Object.values(responseData._embedded);
        for (const item of items) {
            results.push(item);
        }

        return {
            total: parseInt(responseData.total),
            items: results,
        };
    },
};
