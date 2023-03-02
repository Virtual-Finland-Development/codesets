import * as fs from "fs";
import { InternalResources } from "../resources/index";

const internalResources = InternalResources.listResources(true);

const internalsDistPath = `${process.cwd()}/dist/resources/internal`;
if (!fs.existsSync(internalsDistPath)){
    fs.mkdirSync(internalsDistPath, { recursive: true });
}
for (const resource of internalResources) {
    const filepath = `${internalsDistPath}/${resource}`;
    fs.closeSync(fs.openSync(filepath, 'w'));
}