import crypto from 'crypto';

/**
 *
 * @param str
 * @param maxLength
 * @returns
 */
export function cutTooLongString(str: string | undefined, maxLength: number): string {
    if (typeof str !== 'string') {
        return '';
    }

    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '...';
    }
    return str;
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

/**
 *
 * @param str
 * @returns
 */
export function rightTrimSlash(str: string): string {
    if (str.endsWith('/')) {
        return str.slice(0, -1);
    }
    return str;
}

/**
 *
 * @param data
 * @returns
 */
export function generateSimpleHash(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}
