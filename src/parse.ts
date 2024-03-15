import type { Component, Property } from './types'
import type Lexer from './lexer'

export const parseProperty = (lexer: Lexer) => {
  const line = lexer.peakLine()
  const key = line.substring(0, line.indexOf(':'))
  const value = line
    .substring(line.indexOf(':') + 1)
    .replace(/\\n/g, '\n')
    .replace(/\\/g, '')
  lexer.consumeLine()

  if (key.includes(';')) {
    const [keyWithoutParameters, ...rawParameters] = key.split(';')
    const parameters = Object.fromEntries(rawParameters.map((parameter) => parameter.split('=')))
    return { key: keyWithoutParameters as string, value, parameters }
  }

  return { key, value, parameters: {} }
}

export const parseComponent = (lexer: Lexer, component: string): Component => {
  const properties: Record<string, Property> = {}
  const components: Record<string, Component[]> = {}

  lexer.expect(`BEGIN:${component}`)
  lexer.expectNewline()

  while (true) {
    if (lexer.peak(6) === 'BEGIN:') {
      const line = lexer.peakLine()
      const name = line.substring(6)
      const parsedComponent = parseComponent(lexer, name)

      // https://github.com/microsoft/TypeScript/issues/49613
      // > Type narrowing does not occur for indexed access forms e[k] where k is not a literal.
      //
      // Not sure if this is still present in the latest version of TypeScript but it does seem to be the case.
      const component = components[name]
      if (component !== undefined) {
        component.push(parsedComponent)
      } else {
        components[name] = [parsedComponent]
      }
    } else if (lexer.peak(4) !== 'END:') {
      const { key, value, parameters } = parseProperty(lexer)

      // https://github.com/microsoft/TypeScript/issues/49613
      // > Type narrowing does not occur for indexed access forms e[k] where k is not a literal.
      //
      // Not sure if this is still present in the latest version of TypeScript but it does seem to be the case.
      const property = properties[key]
      if (property) {
        property.push({ value, parameters })
      } else {
        properties[key] = [{ value, parameters }]
      }
    } else {
      // found end of component
      break
    }
  }

  lexer.expect(`END:${component}`)
  lexer.expectNewline()

  return { properties, components }
}
