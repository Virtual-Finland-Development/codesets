export async function saveDataToJSONFile(filePath: string, data: any) {
    const fs = require('fs');
    const util = require('util');
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readJSONFile(filePath: string) {
    const fs = require('fs');
    const util = require('util');
    const readFile = util.promisify(fs.readFile);
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
}

export function logProgress(progress: { pageNumber: number; max: number; chunk: number; retrievedTotal: number }) {
    console.log('Progress', {
        ...progress,
        max: progress.max > 0 ? progress.max : 'unknown',
    });
}

export function omitObjectKeysNotIn(object: any, allowedKeys: string[]) {
    const build: any = {};
    const keys = Object.keys(object);
    for (const key of keys) {
        if (allowedKeys.includes(key)) {
            build[key] = object[key];
        }
    }
    return build;
}

/**
 *
 * @param str
 * @returns
 */
export function leftTrimSlash(str: string): string {
    if (str.startsWith('/')) {
        return str.slice(1);
    }
    return str;
}
