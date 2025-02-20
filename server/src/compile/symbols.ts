import {
    AccessModifier,
    NodeClass,
    NodeEnum,
    NodeFunc,
    NodeFuncDef,
    NodeIf,
    NodeInterface,
    NodeIntfMethod,
    NodeLambda,
    NodeName,
    NodeVirtualProp
} from "./nodes";
import {ParsedToken} from "./parsedToken";
import {ComplementHints} from "./symbolComplement";
import {TemplateTranslation} from "./symbolUtils";

export enum SymbolKind {
    Type = 'Type',
    Function = 'Function',
    Variable = 'Variable',
}

export enum PrimitiveType {
    Template = 'Template',
    String = 'String',
    Bool = 'Bool',
    Number = 'Number',
    Void = 'Void',
    Any = 'Any',
    Auto = 'Auto',
}

/**
 * The node that serves as the origin of a symbol's declaration.
 * Types without a declaration node, such as built-in types, are represented using PrimitiveType.
 */
export type DefinitionSource = NodeEnum | NodeClass | NodeInterface | PrimitiveType;

/**
 * Checks whether the given `DefinitionSource` is a `PrimitiveType`.
 * In other words, returns `true` if the given `DefinitionSource` does not have a declaration node.
 */
export function isSourcePrimitiveType(type: DefinitionSource | undefined): type is PrimitiveType {
    return typeof type === 'string';
}

export function isSourceNodeClassOrInterface(type: DefinitionSource): type is NodeClass {
    if (isSourcePrimitiveType(type)) return false;
    return type.nodeName === NodeName.Class || type.nodeName === NodeName.Interface;
}

export function getSourceNodeName(type: DefinitionSource | undefined): NodeName | undefined {
    if (type === undefined || isSourcePrimitiveType(type)) return undefined;
    return type.nodeName;
}

/**
 * The base interface for all symbols.
 */
export interface SymbolBase {
    readonly symbolKind: SymbolKind;
    readonly declaredPlace: ParsedToken;
    readonly declaredScope: SymbolScope;
}

export interface SymbolType extends SymbolBase {
    readonly symbolKind: SymbolKind.Type;
    readonly definitionSource: DefinitionSource;
    readonly templateTypes?: ParsedToken[]; // e.g. <T, U>
    readonly baseList?: (ResolvedType | undefined)[];
    readonly isHandler?: boolean,
    readonly membersScope: SymbolScope | undefined;
}

export interface SymbolFunction extends SymbolBase {
    readonly symbolKind: SymbolKind.Function;
    readonly sourceNode: NodeFunc | NodeFuncDef | NodeIntfMethod;
    readonly returnType: ResolvedType | undefined;
    readonly parameterTypes: (ResolvedType | undefined)[];
    nextOverload: SymbolFunction | undefined;
    readonly isInstanceMember: boolean;
    readonly accessRestriction: AccessModifier | undefined;
}

export interface SymbolVariable extends SymbolBase {
    readonly symbolKind: SymbolKind.Variable;
    readonly type: ResolvedType | undefined;
    readonly isInstanceMember: boolean;
    readonly accessRestriction: AccessModifier | undefined;
}

export function isSymbolInstanceMember(symbol: SymbolObject): symbol is SymbolFunction | SymbolVariable {
    const canBeMember = symbol.symbolKind === SymbolKind.Function || symbol.symbolKind === SymbolKind.Variable;
    if (canBeMember === false) return false;
    return canBeMember && symbol.isInstanceMember;
}

export type SymbolObject = SymbolType | SymbolFunction | SymbolVariable;

// (IF | FOR | WHILE | RETURN | STATBLOCK | BREAK | CONTINUE | DOWHILE | SWITCH | EXPRSTAT | TRY)

/**
 * Nodes that can have a scope containing symbols.
 */
export type SymbolOwnerNode =
    NodeEnum
    | NodeClass
    | NodeVirtualProp
    | NodeInterface
    | NodeFunc
    | NodeIf
    | NodeLambda;

/**
 * Information about a symbol that references a symbol declared elsewhere.
 */
export interface ReferencedSymbolInfo {
    readonly declaredSymbol: SymbolObject;
    readonly referencedToken: ParsedToken;
}

export type ScopeMap = Map<string, SymbolScope>;

export type SymbolMap = Map<string, SymbolObject>;

/**
 * Information about the birth of a scope.
 */
export interface ScopeBirthInfo {
    ownerNode: SymbolOwnerNode | undefined;
    readonly parentScope: SymbolScope | undefined;
    readonly key: string;
}

/**
 * Information about the child scopes and symbols contained in a scope.
 */
export interface ScopeContainInfo {
    readonly childScopes: ScopeMap;
    readonly symbolMap: SymbolMap;
}

/**
 * Information about the services provided by a scope.
 */
export interface ScopeServiceInfo {
    readonly referencedList: ReferencedSymbolInfo[];
    readonly completionHints: ComplementHints[];
}

/**
 * Interface representing a symbol scope.
 */
export interface SymbolScope extends ScopeBirthInfo, ScopeContainInfo, ScopeServiceInfo {
}

export interface SymbolAndScope {
    readonly symbol: SymbolObject;
    readonly scope: SymbolScope;
}

/**
 * The type of symbol that has been resolved by deduction.
 */
export interface ResolvedType {
    readonly symbolType: SymbolType | SymbolFunction;
    readonly sourceScope: SymbolScope | undefined; // FIXME: Obsolete? Use symbolType.declaredScope instead.
    readonly isHandler?: boolean;
    readonly templateTranslate?: TemplateTranslation;
}
