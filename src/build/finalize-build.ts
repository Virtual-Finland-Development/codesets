import * as fs from "fs";
import { InternalResources } from "../resources/index";

const internalResources = InternalResources.listResources();
const buildInternalResourcesPath = `${process.cwd()}/dist/build/internal-resources.json`;
fs.writeFileSync(buildInternalResourcesPath, JSON.stringify(internalResources));