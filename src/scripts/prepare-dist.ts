import * as fs from "fs";
import { InternalResources } from "../resources/index";

const internalResources = InternalResources.listResources(true);
const buildInternalResourcesPath = `${process.cwd()}/dist/resources/_build/internal-resources.json`;
fs.writeFileSync(buildInternalResourcesPath, JSON.stringify(internalResources));