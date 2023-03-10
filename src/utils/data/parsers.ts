import typia from 'typia';

export function getInput() {
    return typia.assertParse;
}

export function getOutput() {
    return typia.assertStringify;
}
