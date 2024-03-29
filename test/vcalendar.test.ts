import { expect, test } from 'vitest'
import { transform, parse } from 'parse-ical'
import { loadFixture } from './helper'

test('fails if multiple VTIMEZONEs are present', async () => {
  const parsed = parse(await loadFixture('multiple_vtimezones.ics'))

  expect(() => transform(parsed)).toThrowError()
})

test('fails if both VTIMEZONE and X-WR-TIMEZONE are present but differ', async () => {
  const parsed = parse(await loadFixture('different_vtimezone_and_x_wr_timezone.ics'))

  expect(() => transform(parsed)).toThrowError()
})

test('fails if neither VTIMEZONE nor X-WR-TIMEZONE are present', async () => {
  const parsed = parse(await loadFixture('no_timezone.ics'))

  expect(() => transform(parsed)).toThrowError()
})

test("doesn't fail if both VTIMEZONE and X-WR-TIMEZONE are present and are the same", async () => {
  const calendar = transform(parse(await loadFixture('basic_timezone.ics')))

  expect(calendar).toMatchObject({
    events: [],
    metadata: {
      timezone: 'Europe/Berlin'
    }
  })
})

test("doesn't fail if only X-WR-TIMEZONE is present", async () => {
  const calendar = transform(parse(await loadFixture('basic_x_wr_timezone.ics')))

  expect(calendar).toMatchObject({
    events: [],
    metadata: {
      timezone: 'Europe/Berlin'
    }
  })
})

test("doesn't fail if only VTIMEZONE is present", async () => {
  const calendar = transform(parse(await loadFixture('basic_vtimezone.ics')))

  expect(calendar).toMatchObject({
    events: [],
    metadata: {
      timezone: 'Europe/Berlin'
    }
  })
})
