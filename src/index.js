import fs from 'fs'
import path from 'path'

import { requestDatabase } from './database'
import { keysToCamelCase, removeDuplicates } from './utils'

export default function loadPgModule (...pathSegments) {
  const filepath = path.join(...pathSegments)
  const content = fs.readFileSync(filepath, 'utf8')
  return parseModule(content)
}

function parseModule (rawData) {
  return parseBlocks(rawData).reduce((module, block) => {
    module[block.name] = makeRequestWrapper(block)
    return module
  }, {})
}

function parseBlocks (rawData) {
  return rawData.split('\n').reduce((blocks, rawLine) => {
    const current = blocks[blocks.length - 1]
    const line = parseLine(rawLine)
    if (line.type === 'content') {
      current.rawRequest += current.rawRequest.length > 0
        ? `\n${line.value}`
        : line.value
    } else if (line.type === 'function') {
      blocks.push(makeBlock(line.value))
    } else {
      current[line.type] = line.value
    }
    return blocks
  }, []).map(extractRefs)
}

function parseLine (rawData) {
  if (!/^\s*--\s*@/.test(rawData)) {
    return { type: 'content', value: rawData }
  }
  const tagContent = rawData.substr(rawData.indexOf('@') + 1).trim()
  const [ type, value ] = tagContent.split(/\s+(.*)/)
  return type === 'params'
    ? { type, value: value.split(/\s*,\s*/g) }
    : { type, value }
}

function makeBlock (name) {
  return {
    name,
    params: [],
    returns: 'void',
    rawRequest: '',
  }
}

function extractRefs (block) {
  const refExprs = block.rawRequest.match(/\$[a-z]+(\.[a-z]+)*/gi) || []
  const refs = removeDuplicates(refExprs.map(expr => expr.slice(1)))
  const request = Object.entries(refs).reduce((result, [i, name]) => {
    return result.split(`$${name}`).join(`$${parseInt(i) + 1}`)
  }, block.rawRequest)
  return { ...block, request, refs }
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
