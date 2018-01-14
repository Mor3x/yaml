import Node from './Node'
import Range from './Range'
import Scalar from './Scalar'

export default class SeqItem extends Node {
  constructor (doc, props) {
    super(doc, props)
    this.indicator = null
    this.item = null
  }

  parse (start, indent) {
    trace: ({ start, indent })
    const { src } = this.doc
    this.indicator = src[start] // -
    let offset = Node.endOfWhiteSpace(src, start + 1)
    let lineStart = start - indent
    let itemIndent = offset - lineStart
    let ch = src[offset]
    while (ch === '\n' || ch === '#') {
      const next = offset + 1
      if (ch === '#') {
        offset = Node.endOfLine(src, next)
        if (this.commentRange) {
          this.commentRange.end = offset
        } else {
          this.commentRange = new Range(next, offset)
        }
      } else {
        lineStart = offset
        offset = Node.endOfWhiteSpace(src, next) // against spec, to match \t allowed after -
        itemIndent = offset - lineStart
      }
      ch = src[offset]
    }
    if (ch && itemIndent > indent) {
      this.item = this.doc.parseNode(offset, itemIndent, false)
      offset = this.item.range.end
    } else if (lineStart > start + 1) {
      offset = lineStart - 1
    }
    const end = this.item ? this.item.valueRange.end : offset
    this.valueRange = new Range(start, end)
    return Node.endOfWhiteSpace(src, offset)
  }
}
