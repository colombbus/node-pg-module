import {toCamelCase} from './textUtils'

export function mapKeys (object, transform) {
  return Object.entries(object).reduce((result, [key, value]) => {
    result[transform(key)] = value
    return result
  }, {})
}

export function keysToCamelCase (object) {
  return mapKeys(object, toCamelCase)
}

export function removeDuplicates (array) {
  return array.reduce((result, element) => {
    if (!result.includes(element)) {
      result.push(element)
    }
    return result
  }, [])
}
