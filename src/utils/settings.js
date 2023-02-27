"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternalResourceURI = void 0;
const ExternalResources_1 = __importDefault(require("../ExternalResources"));
function getExternalResourceURI(resourceName) {
    if (typeof process.env[`ExternalResources:${resourceName}`] !== "undefined") {
        return process.env[`ExternalResources:${resourceName}`];
    }
    return ExternalResources_1.default[resourceName];
}
exports.getExternalResourceURI = getExternalResourceURI;
