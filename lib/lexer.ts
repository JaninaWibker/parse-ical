import { normalizeAndSplitLines } from './util'

export default class Lexer {
  input: string[]
  line: number = 0
  pos: number = 0

  constructor(input: string) {
    this.input = normalizeAndSplitLines(input)
  }

  expect(literal: string) {
    const maybeMatch = this.input[this.line]!.substring(this.pos, literal.length)
    if (maybeMatch === literal) {
      this.pos += literal.length
    } else {
      throw new Error(
        `Expected ${literal} at line ${this.line + 1} (from ${this.pos} until ${this.pos + literal.length}), got:\n${this.input[this.line]}`
      )
    }
  }

  expectNewline() {
    if (this.input[this.line]!.length === this.pos) {
      this.line++
      this.pos = 0
    } else {
      throw new Error(`Expected newline at ${this.line + 1}:${this.pos}, got:\n${this.input[this.line]}`)
    }
  }

  peak(num: number) {
    return this.input[this.line]!.substring(this.pos, this.pos + num)
  }

  peakLine() {
    return this.input[this.line] as string
  }

  consumeLine() {
    this.line++
    this.pos = 0
  }
}
