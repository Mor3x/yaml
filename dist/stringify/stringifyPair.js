'use strict';

var Node = require('../nodes/Node.js');
var Scalar = require('../nodes/Scalar.js');
var stringify = require('./stringify.js');
var stringifyComment = require('./stringifyComment.js');

function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { indentSeq, simpleKeys } } = ctx;
    let keyComment = (Node.isNode(key) && key.comment) || null;
    if (simpleKeys) {
        if (keyComment) {
            throw new Error('With simple keys, key nodes cannot have comments');
        }
        if (Node.isCollection(key)) {
            const msg = 'With simple keys, collection cannot be used as a key value';
            throw new Error(msg);
        }
    }
    let explicitKey = !simpleKeys &&
        (!key ||
            (keyComment && value == null && !ctx.inFlow) ||
            Node.isCollection(key) ||
            (Node.isScalar(key)
                ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL
                : typeof key === 'object'));
    ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => (keyCommentDone = true), () => (chompKeep = true));
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
            throw new Error('With simple keys, single line scalar must not span more than 1024 characters');
        explicitKey = true;
    }
    if (ctx.inFlow) {
        if (allNullValues || value == null) {
            if (keyCommentDone && onComment)
                onComment();
            return explicitKey ? `? ${str}` : str;
        }
    }
    else if ((allNullValues && !simpleKeys) || (value == null && explicitKey)) {
        if (keyCommentDone)
            keyComment = null;
        if (chompKeep && !keyComment && onChompKeep)
            onChompKeep();
        return stringifyComment.addComment(`? ${str}`, ctx.indent, keyComment);
    }
    if (keyCommentDone)
        keyComment = null;
    str = explicitKey
        ? `? ${stringifyComment.addComment(str, ctx.indent, keyComment)}\n${indent}:`
        : stringifyComment.addComment(`${str}:`, ctx.indent, keyComment);
    let vcb = '';
    let valueComment = null;
    if (Node.isNode(value)) {
        if (value.spaceBefore)
            vcb = '\n';
        if (value.commentBefore)
            vcb += `\n${stringifyComment.stringifyComment(value.commentBefore, ctx.indent)}`;
        valueComment = value.comment;
    }
    else if (value && typeof value === 'object') {
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && Node.isScalar(value))
        ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq &&
        indentStep.length >= 2 &&
        !ctx.inFlow &&
        !explicitKey &&
        Node.isSeq(value) &&
        !value.flow &&
        !value.tag &&
        !value.anchor) {
        // If indentSeq === false, consider '- ' as part of indentation where possible
        ctx.indent = ctx.indent.substr(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => (valueCommentDone = true), () => (chompKeep = true));
    let ws = ' ';
    if (vcb || keyComment) {
        ws = `${vcb}\n${ctx.indent}`;
    }
    else if (!explicitKey && Node.isCollection(value)) {
        const flow = valueStr[0] === '[' || valueStr[0] === '{';
        if (!flow || valueStr.includes('\n'))
            ws = `\n${ctx.indent}`;
    }
    else if (valueStr[0] === '\n')
        ws = '';
    if (ctx.inFlow) {
        if (valueCommentDone && onComment)
            onComment();
        return str + ws + valueStr;
    }
    else {
        if (valueCommentDone)
            valueComment = null;
        if (chompKeep && !valueComment && onChompKeep)
            onChompKeep();
        return stringifyComment.addComment(str + ws + valueStr, ctx.indent, valueComment);
    }
}

exports.stringifyPair = stringifyPair;
