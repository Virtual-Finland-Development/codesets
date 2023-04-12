import api from './api';
import { omitObjectKeysNotIn, saveDataToJSONFile } from './utils';

async function getOccupationGroups() {
    const results = await api.getOccupationIscoGroups();
    const packagedResults = results
        .filter((item: any) => item.status === 'released')
        .map((item: any) => {
            const narrower = item._links?.narrowerOccupation?.map((parent: any) => parent.uri) ?? [];

            if (item._links?.narrowerConcept) {
                narrower.push(...item._links.narrowerConcept.map((parent: any) => parent.uri));
            }

            return {
                uri: item.uri,
                notation: item.code,
                prefLabel: omitObjectKeysNotIn(item.preferredLabel, ['en', 'fi', 'sv']),
                narrower,
            };
        });
    return packagedResults;
}

async function getOccupations() {
    const results = await api.getOccupations();
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
    return packagedResults;
}

async function main() {
    const results: any[] = [];
    console.log('> Fetching occupation groups..');
    const occupationGroups = await getOccupationGroups();
    console.log('> Fetching occupations..');
    const occupations = await getOccupations();
    console.log('> Merging retrieved data..');
    for (const item of [...occupations, ...occupationGroups]) {
        const existingItem = results.find((result) => result.uri === item.uri);
        if (existingItem) {
            Object.assign(existingItem, item);
        } else {
            results.push(item);
        }
    }

    // Handle the results
    if (results.length > 0) {
        console.log('Retrieved total of ', results.length, 'items');

        // Map narrowers to broader URIs
        for (const item of results) {
            if (item.narrower) {
                for (const narrower of item.narrower) {
                    const broader = results.find((result) => result.uri === narrower);
                    if (broader) {
                        broader.broader = broader.broader || [];
                        broader.broader.push(item.uri);
                    }
                }
            }
        }

        const packagedResults = results.map((item: any) => {
            return {
                uri: item.uri,
                notation: item.notation,
                prefLabel: item.prefLabel,
                broader: item.broader,
            };
        });

        // Sort by notation, ascending
        packagedResults.sort((a, b) => {
            const partsA = a.notation.split('.');
            const partsB = b.notation.split('.');

            if (partsA.length !== partsB.length) {
                return partsA.length - partsB.length;
            }

            let weight = 0;
            for (let index = 0; index < partsA.length; index++) {
                const partA = parseInt(partsA[index]);
                const partB = parseInt(partsB[index]);
                if (partA < partB) {
                    weight--;
                }
                if (partA > partB) {
                    weight++;
                }
            }
            return weight;
        });

        const filePath = '../../src/resources/internal/occupations.json';
        console.log('Saving to', filePath);
        await saveDataToJSONFile(filePath, packagedResults);
    } else {
        console.log('No results');
    }
}

main();
