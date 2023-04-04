import api from './api';
import { logProgress, omitObjectKeysNotIn, saveDataToJSONFile } from './utils';

async function main() {
    // Fetch all the skills
    let pageNumber = 0;
    const pageSize = 500;
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
        const responseData = await api.getSkills(pageNumber, pageSize);
        if (responseData.total === 0) {
            console.log('No results');
            break;
        }
        if (max === -1) {
            max = parseInt(responseData.total);
            console.log('> Setting max to the total', max);
        }
        pageNumber++;

        // Get the items from the response
        const items = Object.values(responseData._embedded);
        for (const item of items) {
            results.push(item);
        }

        logProgress({
            pageNumber,
            max,
            chunk: items.length,
            retrievedTotal: results.length,
        });

        if (pageNumber * pageSize > max) {
            console.log('Reached max');
            break;
        }
    } while (results.length < max);

    // Handle the results
    if (results.length > 0) {
        console.log('Retrieved', results.length, 'items');
        const packagedResults = results
            .filter((item: any) => item.status === 'released')
            .map((item: any) => {
                return {
                    uri: item.uri,
                    prefLabel: omitObjectKeysNotIn(item.preferredLabel, ['en', 'fi', 'sv']),
                };
            });
        console.log('Filtered and packaged', packagedResults.length, 'items');

        const filePath = '../../src/resources/internal/skills.json';
        console.log('Saving to', filePath);
        await saveDataToJSONFile(filePath, packagedResults);
    } else {
        console.log('No results');
    }
}

main();
