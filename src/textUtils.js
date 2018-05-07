export function minimizeSpaces (text) {
  return text.replace(/\s+/g, ' ').trim()
}

export function toCamelCase (text) {
  const [head, ...tail] = text.split('_')
  return head + tail.map(capitalize)
}

function capitalize (text) {
  return text[0].toUpperCase() + text.slice(1)
}
