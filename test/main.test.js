import loadPgModule from '../src'

describe('node-pg-module', () => {
  test('has a default export', () => {
    expect(loadPgModule).not.toBeNull()
  })
})

describe('PgModule', () => {
  test('is a function', () => {
    expect(loadPgModule).toBeInstanceOf(Function)
  })
})
