import {Position, Range, URI} from "vscode-languageserver";
import {HighlightModifierKind, HighlightTokenKind} from "../code/highlight";

export type TokenKind = 'reserved' | 'identifier' | 'number' | 'string' | 'comment'

export type LocationInfo = { path: string } & Range;

export function isPositionInRange(position: Position, range: Range): boolean {
    if (range.start.line === position.line
        && position.line < range.end.line
        && range.start.character <= position.character) return true;

    if (range.start.line < position.line
        && position.line < range.end.line) return true;

    if (range.start.line < position.line
        && position.line === range.end.line
        && position.character <= range.end.character) return true;

    if (range.start.line === position.line
        && position.line === range.end.line
        && range.start.character <= position.character
        && position.character <= range.end.character) return true;

    return false;
}

export interface HighlightInfo {
    token: HighlightTokenKind;
    modifier: HighlightModifierKind;
}

export interface PlainToken {
    kind: TokenKind;
    text: string;
    location: LocationInfo;
}

export interface TokenizedToken extends PlainToken {
    highlight: HighlightInfo;
}

export const dummyToken: PlainToken = {
    kind: 'reserved',
    text: '',
    location: {
        path: '',
        start: {line: 0, character: 0},
        end: {line: 0, character: 0},
    },
} as const;
