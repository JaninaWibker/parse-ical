import { expect, test } from 'vitest'
import { transform, parse } from '../src/index'
import { loadFixture } from './helper'

test("doesn't fail if optional fields are left empty", async () => {
  const calendar = transform(parse(await loadFixture('empty_optional_field.ics')))

  expect(calendar).toMatchObject({
    events: [
      {
        start: {
          isAllDay: false,
          date: new Date('2024-02-03T15:00:00.000Z'),
          timezone: undefined
        },
        end: {
          isAllDay: false,
          date: new Date('2024-02-03T16:00:00.000Z'),
          timezone: undefined
        },
        creationDate: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },
        modificationDate: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },
        dtstamp: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },

        title: 'Event title',
        description: '',
        location: '',
        uid: 'f50fa2c1-c324-43d0-b534-a2805fdd5190',

        status: 'CONFIRMED',
        transparency: 'OPAQUE'
      }
    ],
    metadata: {
      timezone: 'Europe/Berlin'
    }
  })
})

test('all day event', async () => {
  const calendar = transform(parse(await loadFixture('all_day_event.ics')))

  expect(calendar).toMatchObject({
    events: [
      {
        start: {
          isAllDay: true,
          date: new Date('2024-02-02T23:00:00.000Z'),
          timezone: undefined
        },
        end: {
          isAllDay: true,
          date: new Date('2024-02-02T23:00:00.000Z'),
          timezone: undefined
        },
        creationDate: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },
        modificationDate: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },
        dtstamp: {
          isAllDay: false,
          date: new Date('2024-02-03T14:45:00.000Z'),
          timezone: undefined
        },

        title: 'Event title',
        description: 'Hi',
        location: 'Null Island',
        uid: 'f50fa2c1-c324-43d0-b534-a2805fdd5190',

        status: 'CONFIRMED',
        transparency: 'OPAQUE'
      }
    ],
    metadata: {
      timezone: 'Europe/Berlin'
    }
  })
})
