import Lexer from './lexer'
import type { Component } from './types'
import { parseComponent } from './parse'
import { matchCalendar } from './transform'

export type { Property, Properties, CalendarDate, Component, CalendarEvent, CalendarMetadata } from './types'

export const parse = (input: string) => parseComponent(new Lexer(input), 'VCALENDAR')

export const transform = (syntaxTree: Component) => matchCalendar(syntaxTree)
