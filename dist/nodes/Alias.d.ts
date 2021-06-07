import type { Document } from '../doc/Document';
import type { StringifyContext } from '../stringify/stringify.js';
import { NodeBase, Range } from './Node.js';
import type { Scalar } from './Scalar';
import type { ToJSContext } from './toJS.js';
import type { YAMLMap } from './YAMLMap';
import type { YAMLSeq } from './YAMLSeq';
export declare namespace Alias {
    interface Parsed extends Alias {
        range: Range;
    }
}
export declare class Alias extends NodeBase {
    source: string;
    anchor?: never;
    constructor(source: string);
    /**
     * Resolve the value of this alias within `doc`, finding the last
     * instance of the `source` anchor before this node.
     */
    resolve(doc: Document): Scalar | YAMLMap | YAMLSeq | undefined;
    toJSON(_arg?: unknown, ctx?: ToJSContext): unknown;
    toString(ctx?: StringifyContext, _onComment?: () => void, _onChompKeep?: () => void): string;
}