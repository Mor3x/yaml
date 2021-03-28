import type { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import type { ErrorCode } from '../errors.js'
import type {
  DocumentOptions,
  ParseOptions,
  SchemaOptions
} from '../options.js'
import type * as Tokens from '../parse/tokens.js'
import {
  ComposeContext,
  composeEmptyNode,
  composeNode
} from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'

export function composeDoc(
  options: ParseOptions & DocumentOptions & SchemaOptions,
  directives: Directives,
  { offset, start, value, end }: Tokens.Document,
  onError: (
    offset: number,
    code: ErrorCode,
    message: string,
    warning?: boolean
  ) => void
) {
  const opts = Object.assign({ directives }, options)
  const doc = new Document(undefined, opts) as Document.Parsed
  const ctx: ComposeContext = {
    directives: doc.directives,
    options: doc.options,
    schema: doc.schema
  }
  const props = resolveProps(ctx, start, true, 'doc-start', offset, onError)
  if (props.found) doc.directives.marker = true
  doc.contents = value
    ? composeNode(ctx, value, props, onError)
    : composeEmptyNode(ctx, props.end, start, null, props, onError)

  const re = resolveEnd(end, doc.contents.range[1], false, onError)
  if (re.comment) doc.comment = re.comment
  doc.range = [offset, re.offset]
  return doc
}
