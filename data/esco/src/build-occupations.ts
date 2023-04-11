import api from './api';
import { omitObjectKeysNotIn, saveDataToJSONFile } from './utils';

async function main() {
    const results = await api.getOccupations();
    // Handle the results
    if (results.length > 0) {
        console.log('Retrieved', results.length, 'items');
        const packagedResults = results
            .filter((item: any) => item.status === 'released')
            .map((item: any) => {
                const broader = item._links?.broaderOccupation?.map((parent: any) => parent.uri) ?? [];

                if (item._links?.broaderIscoGroup) {
                    broader.push(...item._links.broaderIscoGroup.map((parent: any) => parent.uri));
                }

                return {
                    uri: item.uri,
                    notation: item.code,
                    prefLabel: omitObjectKeysNotIn(item.preferredLabel, ['en', 'fi', 'sv']),
                    broader,
                };
            });
        console.log('Filtered and packaged', packagedResults.length, 'items');

        const filePath = '../../src/resources/internal/occupations.json';
        console.log('Saving to', filePath);
        await saveDataToJSONFile(filePath, packagedResults);
    } else {
        console.log('No results');
    }
}

main();
