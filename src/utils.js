// text utils

export function toCamelCase (text) {
  const [head, ...tail] = text.split('_')
  return head + tail.map(capitalize)
}

function capitalize (text) {
  return text[0].toUpperCase() + text.slice(1)
}

// object utils

export function keysToCamelCase (object) {
  return mapKeys(object, toCamelCase)
}

export function mapKeys (object, transform) {
  return Object.entries(object).reduce((result, [key, value]) => {
    result[transform(key)] = value
    return result
  }, {})
}

export function removeDuplicates (array) {
  return array.reduce((result, element) => {
    if (!result.includes(element)) {
      result.push(element)
    }
    return result
  }, [])
}
