import axios from 'axios';
import { leftTrimSlash, logProgress } from './utils';

class EscoAPI {
    host: string;
    resourceUri: string;
    pageSize: number;
    maxResults: number;

    constructor(resourceUri: string, host = 'http://localhost:8080', pageSize = 100, maxResults = -1) {
        this.resourceUri = leftTrimSlash(resourceUri);
        this.host = host;
        this.pageSize = pageSize;
        this.maxResults = maxResults;
    }

    async getAPIResults() {
        // Fetch all the skills
        let pageNumber = 0;
        const results: any[] = [];

        do {
            if (pageNumber === 0) {
                logProgress({
                    pageNumber,
                    max: this.maxResults,
                    chunk: 0,
                    retrievedTotal: 0,
                });
            }

            // Fetch the next page of data
            const responseData = await this.getDataPage(pageNumber, this.pageSize);
            if (responseData.total === 0) {
                console.log('No results');
                break;
            }
            if (this.maxResults === -1) {
                this.maxResults = responseData.total;
                console.log('> Setting max to the total', this.maxResults);
            }
            pageNumber++;

            for (const item of responseData.items) {
                results.push(item);
            }

            logProgress({
                pageNumber,
                max: this.maxResults,
                chunk: responseData.items.length,
                retrievedTotal: results.length,
            });

            if (pageNumber * this.pageSize > this.maxResults) {
                console.log('Reached max');
                break;
            }
        } while (results.length < this.maxResults);

        return results;
    }

    async getDataPage(pageNumber: number, pageSize: number): Promise<{ total: number; items: any[] }> {
        const results: any[] = [];

        const response = await axios.get(
            `${this.host}/${this.resourceUri}&language=en&offset=${pageNumber}&limit=${pageSize}`
        );
        const responseData = await response.data;

        // Get the items from the response
        try {
            const items = Object.values(responseData._embedded);
            for (const item of items) {
                results.push(item);
            }

            return {
                total: parseInt(responseData.total),
                items: results,
            };
        } catch (error) {
            console.log(responseData);
            console.log(error);
            throw new Error("Couldn't get items from response");
        }
    }
}

export default {
    async getSkills() {
        const api = new EscoAPI('/resource/skill?isInScheme=http://data.europa.eu/esco/concept-scheme/member-skills');
        return await api.getAPIResults();
    },

    async getOccupationIscoGroups() {
        const api = new EscoAPI('/resource/occupation?isInScheme=http://data.europa.eu/esco/concept-scheme/isco');
        return await api.getAPIResults();
    },

    async getOccupations() {
        const api = new EscoAPI(
            '/resource/occupation?isInScheme=http://data.europa.eu/esco/concept-scheme/occupations'
        );
        return await api.getAPIResults();
    },
};
