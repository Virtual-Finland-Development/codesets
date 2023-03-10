import typia from 'typia';

export function Input() {
    return typia.assertParse;
}

export function Output() {
    return typia.assertStringify;
}
