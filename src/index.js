import fs from 'fs'
import path from 'path'

import { requestDatabase } from './database'
import { keysToCamelCase, minimizeSpaces, removeDuplicates } from './utils'

export default function loadPgModule (dirs) {
  const filepath = path.join(...dirs)
  return parseBlocks(fs.readFileSync(filepath, 'utf8'))
    .reduce((module, block) => {
      module[block.name] = makeRequestWrapper(block)
      return module
    }, {})
}

function parseBlocks (raw) {
  return raw.split('\n').reduce((blocks, line) => {
    if (/^\s*--\s*@/.test(line)) {
      const tag = parseTagLine(line)
      switch (tag.name) {
        case 'function':
          blocks.unshift({
            name: tag.value,
            params: [],
            returns: 'void',
            raw: '',
          })
          break
        case 'params':
          blocks[0].params = tag.value.split(/, */)
          break
        default:
          blocks[0][tag.name] = tag.value
      }
    } else {
      blocks[0].raw += `${line}\n`
    }
    return blocks
  }, []).reverse().map(({ raw, ...config }) => {
    return { ...config, ...extractRefs(raw) }
  })
}

function parseTagLine (line) {
  const terms = minimizeSpaces(line.slice(line.split('@', 1)[0].length + 1))
  const [name] = terms.split(' ', 1)
  const value = terms.slice(name.length + 1)
  return { name, value }
}

function extractRefs (text) {
  const refExprs = text.match(/\$[a-z]+(\.[a-z]+)*/gi) || []
  const refs = removeDuplicates(refExprs.map(expr => expr.slice(1)))
  const request = Object.entries(refs).reduce((result, [i, name]) => {
    return result.split(`$${name}`).join(`$${parseInt(i) + 1}`)
  }, text).trim()
  return { refs, request }
}

function makeRequestWrapper (block) {
  return async function (...args) {
    const input = mapParams(args, block.params)
    const refValues = block.refs.map(ref => resolveRef(ref, input))
    const result = await requestDatabase(block.request, refValues)
    return castRequestReturn(result, block.returns)
  }
}

function mapParams (args, params) {
  return Object.entries(args).reduce((result, [i, arg]) => {
    result[params[i]] = arg
    return result
  }, {})
}

function resolveRef (ref, data) {
  if (ref === '') {
    return data
  }
  data = data || {}
  const [head, ...tail] = ref.split('.')
  const result = head in data ? data[head] : null
  return resolveRef(tail.join('.'), result)
}

function castRequestReturn (rows, type) {
  switch (type) {
    case 'multiple': return rows.map(keysToCamelCase)
    case 'row': return keysToCamelCase(rows[0])
    case 'field': return Object.values(rows[0])[0]
    case 'void':
    default:
      return undefined
  }
}
