import typia from 'typia';

/**
 * @returns function for: parse to specific type of object
 */
export function getInput() {
    return typia.assertParse;
}

/**
 * @returns function for: parse and stringify
 */
export function getOutput() {
    return typia.assertStringify;
}
