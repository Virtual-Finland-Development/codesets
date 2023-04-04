export async function saveDataToJSONFile(filePath: string, data: any) {
  const fs = require("fs");
  const util = require("util");
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export function logProgress(progress: { pageNumber: number; max: number; chunk: number; retrievedTotal: number }) {
  console.log("Progress", progress);
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
