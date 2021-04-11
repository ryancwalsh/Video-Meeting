import { customAlphabet } from 'nanoid'

export function guid(length = 10, alphabet = '1234567890abcdef') {
    // https://github.com/ai/nanoid#custom-alphabet-or-size
    const nanoid = customAlphabet(alphabet, length);
    return nanoid();
}