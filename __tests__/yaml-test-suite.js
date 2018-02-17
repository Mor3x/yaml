import fs from 'fs'
import path from 'path'

import { YAMLWarning } from '../src/errors'
import resolve from '../src/index'

const testDirs = fs.readdirSync(path.resolve(__dirname, 'yaml-test-suite'))
  .filter(dir => ['.git', 'meta', 'name', 'tags'].indexOf(dir) === -1)

const matchJson = (stream, json) => {
  if (!json) return
  const received = stream[0] ? stream[0].toJSON() : null
  const expected = JSON.parse(json)
  if (!received || typeof received !== 'object') {
    expect(received).toBe(expected)
  } else {
    expect(received).toMatchObject(expected)
  }
}

const skipStringify = [
  '6FWR', // Block Scalar Keep
  '6H3V', // Backslashes in singlequotes
  'LP6E', // Whitespace After Scalars in Flow
  'Q5MG'  // Tab at beginning of line followed by a flow mapping
]

testDirs.forEach(dir => {
  const root = path.resolve(__dirname, 'yaml-test-suite', dir)
  const name = fs.readFileSync(path.resolve(root, '==='), 'utf8')
  const yaml = fs.readFileSync(path.resolve(root, 'in.yaml'), 'utf8')
  let json, error
  try { json = fs.readFileSync(path.resolve(root, 'in.json'), 'utf8') } catch (e) {}
  try { fs.readFileSync(path.resolve(root, 'error'), 'utf8'); error = true } catch (e) {}
  if (!error && !json) return
  test(`${dir}: ${name}`, () => {
    const stream = resolve(yaml)
    matchJson(stream, json)
    if (error) {
      //expect(stream[0].errors).not.toHaveLength(0)
    } else {
      const errors = stream
        .map(doc => doc.errors.filter(err => !(err instanceof YAMLWarning)))
        .filter(docErrors => docErrors.length > 0)
      expect(errors).toHaveLength(0)
      if (skipStringify.includes(dir)) return
      const src2 = stream.map(doc => String(doc)).join('\n---\n')
      const stream2 = resolve(src2)
      trace: name,
        '\nIN\n' + yaml,
        '\nJSON\n' + JSON.stringify(stream[0], null, '  '),
        '\n\nOUT\n' + src2,
        '\nOUT-JSON\n' + JSON.stringify(src2),
        '\nRE-JSON\n' + JSON.stringify(stream2[0], null, '  ')
      matchJson(stream2, json)
    }
  })
})