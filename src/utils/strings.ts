
/**
 * 
 * @param str 
 * @param maxLength 
 * @returns 
 */
export function cutTooLongString(str: string | undefined, maxLength: number): string {
    if (typeof str !== "string") {
        return "";
    }
    
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + "...";
    }
    return str;
}