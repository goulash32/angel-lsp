import {ReservedWordProperty} from "./tokens";
import {Trie, TriePair} from "../utils/trie";
import assert = require("assert");
import {Mutable} from "../utils/utilities";

// https://www.angelcode.com/angelscript/sdk/docs/manual/doc_reserved_keywords.html

// Symbols that are non-alphanumeric reserved words are referred to as "Marks" in this context.
// A list of all Marks
const reservedMarkArray = [
    '*', '**', '/', '%', '+', '-', '<=', '<', '>=', '>', '(', ')', '==', '!=', '?', ':', '=', '+=', '-=', '*=', '/=', '%=', '**=', '++', '--', '&', ',', '{', '}', ';', '|', '^', '~', '<<', '>>', '>>>', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '.', '&&', '||', '!', '[', ']', '^^', '@', '!is', '::',
    '#', // Strictly speaking, '#' is not a Mark, but is included here for use in preprocessing.
];

// A list of Marks with context-dependent reserved words removed. We call it Weak Marks.
// For example, in "array<array<int>>", '>>' should be recognized as ['>', '>'].
const reservedWeakMarkArray = [
    '*', '**', '/', '%', '+', '-', '<=', '<', '>', '(', ')', '==', '!=', '?', ':', '=', '+=', '-=', '*=', '/=', '%=', '**=', '++', '--', '&', ',', '{', '}', ';', '|', '^', '~', '<<', '&=', '|=', '^=', '<<=', '.', '&&', '||', '!', '[', ']', '^^', '@', '::',
    // '>=', '>>', '>>>', '>>=', '>>>=', '!is' // These are context-dependent.
    '#', // For preprocessor
];

// Alphanumeric reserved words are referred to as "Keywords" in this context.
// A list of reserved keywords composed of alphanumeric characters.
const reservedKeywordArray = [
    'and', 'auto', 'bool', 'break', 'case', 'cast', 'catch', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'false', 'float', 'for', 'funcdef', 'if', 'import', 'in', 'inout', 'int', 'interface', 'int8', 'int16', 'int32', 'int64', 'is', 'mixin', 'namespace', 'not', 'null', 'or', 'out', 'override', 'private', 'property', 'protected', 'return', 'switch', 'true', 'try', 'typedef', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'void', 'while', 'xor',
    // Not really a reserved keyword, but is recognized by the compiler as a built-in keyword.
    // 'abstract', 'explicit', 'external', 'function', 'final', 'from', 'get', 'set', 'shared', 'super', 'this',
];

const exprPreOpSet = new Set(['-', '+', '!', '++', '--', '~', '@']);

const bitOpSet = new Set(['&', '|', '^', '<<', '>>', '>>>']);

const mathOpSet = new Set(['+', '-', '*', '/', '%', '**']);

const compOpSet = new Set(['==', '!=', '<', '<=', '>', '>=', 'is', '!is']);

const logicOpSet = new Set(['&&', '||', '^^', 'and', 'or', 'xor']);

const assignOpSet = new Set(['=', '+=', '-=', '*=', '/=', '|=', '&=', '^=', '%=', '**=', '<<=', '>>=', '>>>=']);

export const numberTypeSet = new Set<string>(['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double']);

const primeTypeSet = new Set<string>(['void', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double', 'bool']);

function makeEmptyProperty(): ReservedWordProperty {
    return {
        isMark: false,
        isExprPreOp: false,
        isExprOp: false,
        isBitOp: false,
        isMathOp: false,
        isCompOp: false,
        isLogicOp: false,
        isAssignOp: false,
        isNumber: false,
        isPrimeType: false,
    };
}

const reservedWordProperties = createProperties();

function createProperties() {
    const properties = new Map<string, Mutable<ReservedWordProperty>>();
    for (const symbol of [...reservedMarkArray, ...reservedKeywordArray]) {
        properties.set(symbol, makeEmptyProperty());
    }

    for (const symbol of reservedMarkArray) {
        properties.get(symbol)!.isMark = true;
    }

    for (const symbol of exprPreOpSet) {
        properties.get(symbol)!.isExprPreOp = true;
    }

    for (const symbol of bitOpSet) {
        properties.get(symbol)!.isExprOp = true;
        properties.get(symbol)!.isBitOp = true;
    }

    for (const symbol of mathOpSet) {
        properties.get(symbol)!.isExprOp = true;
        properties.get(symbol)!.isMathOp = true;
    }

    for (const symbol of compOpSet) {
        properties.get(symbol)!.isExprOp = true;
        properties.get(symbol)!.isCompOp = true;
    }

    for (const symbol of logicOpSet) {
        properties.get(symbol)!.isExprOp = true;
        properties.get(symbol)!.isLogicOp = true;
    }

    for (const symbol of assignOpSet) {
        properties.get(symbol)!.isAssignOp = true;
    }

    for (const symbol of numberTypeSet) {
        properties.get(symbol)!.isNumber = true;
    }

    for (const symbol of primeTypeSet) {
        properties.get(symbol)!.isPrimeType = true;
    }

    return properties;
}

const reservedWeakMarkProperties = createWeakMarkPropertyTrie();

function createWeakMarkPropertyTrie() {
    const markMap = new Trie<ReservedWordProperty>();
    for (const mark of reservedWeakMarkArray) {
        markMap.insert(mark, reservedWordProperties.get(mark)!);
    }
    return markMap;
}

/**
 * Searches for a reserved word property in the trie for Marks with context-dependent reserved words removed.
 * @param str - The string to search within.
 * @param start - The starting position in the string to begin the search.
 * @returns A `TriePair<ReservedWordProperty>` if a match is found, or `undefined` if not.
 */
export function findReservedWeakMarkProperty(str: string, start: number): TriePair<ReservedWordProperty> | undefined {
    return reservedWeakMarkProperties.find(str, start);
}

const reservedKeywordProperties = createKeywordPropertyMap();

function createKeywordPropertyMap() {
    const keywordMap = new Map<string, ReservedWordProperty>();
    for (const keyword of reservedKeywordArray) {
        keywordMap.set(keyword, reservedWordProperties.get(keyword)!);
    }
    return keywordMap;
}

/**
 * Searches for a reserved word property in the map for alphanumeric reserved words.
 * @param str
 */
export function findReservedKeywordProperty(str: string) {
    return reservedKeywordProperties.get(str);
}

/**
 * Searches for a reserved word property in the map for all reserved words.
 * @param str
 */
export function findAllReservedWordProperty(str: string) {
    const result = reservedWordProperties.get(str);
    if (result !== undefined) return result;
    assert(false);
}