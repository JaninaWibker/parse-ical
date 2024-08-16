import { expect, test, vi } from 'vitest'
import { transform, parse } from 'parse-ical'
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
          date: new Date('2024-02-03T23:00:00.000Z'),
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

test('accepts duration instead of dtend', async () => {
  const calendar = transform(parse(await loadFixture('duration.ics')))

  expect(calendar).toMatchObject({
    events: [
      {
        start: {
          isAllDay: false,
          date: new Date('2023-03-06T14:30:00.000Z'),
          timezone: undefined
        },
        end: {
          isAllDay: false,
          date: new Date('2023-03-06T15:00:00.000Z'),
          timezone: undefined
        },
        modificationDate: {
          isAllDay: false,
          date: new Date('2023-04-25T11:00:00.000Z'),
          timezone: undefined
        },
        creationDate: {
          isAllDay: false,
          date: new Date('2023-01-07T12:30:00.000Z'),
          timezone: undefined
        },
        dtstamp: {
          isAllDay: false,
          date: new Date('2024-03-10T17:00:00.000Z'),
          timezone: undefined
        },

        uid: 'e0de738a-1b58-49a3-9266-e0716471a0fa',
        title: 'Weekly Sync Meeting',
        description: `meeting`,
        location: undefined,
        alarms: [],
        transparency: 'OPAQUE'
      }
    ]
  })
})

test('accepts duration instead of dtend for all day events', async () => {
  const calendar = transform(parse(await loadFixture('duration_all_day.ics')))

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
          date: new Date('2024-02-05T23:00:00.000Z'),
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

test('allows omitting both duration and dtend', async () => {
  const calendar = transform(parse(await loadFixture('default_dtend.ics')))

  expect(calendar).toMatchObject({
    events: [
      {
        start: {
          isAllDay: false,
          date: new Date('2023-03-06T14:30:00.000Z'),
          timezone: undefined
        },
        end: {
          isAllDay: false,
          date: new Date('2023-03-06T14:30:00.000Z'),
          timezone: undefined
        },
        modificationDate: {
          isAllDay: false,
          date: new Date('2023-04-25T11:00:00.000Z'),
          timezone: undefined
        },
        creationDate: {
          isAllDay: false,
          date: new Date('2023-01-07T12:30:00.000Z'),
          timezone: undefined
        },
        dtstamp: {
          isAllDay: false,
          date: new Date('2024-03-10T17:00:00.000Z'),
          timezone: undefined
        },

        uid: 'e0de738a-1b58-49a3-9266-e0716471a0fa',
        title: 'Weekly Sync Meeting',
        description: `meeting`,
        location: undefined,
        alarms: [],
        transparency: 'OPAQUE'
      }
    ]
  })
})

test('allows omitting both duration and dtend for all day events', async () => {
  const calendar = transform(parse(await loadFixture('default_dtend_all_day.ics')))

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
          date: new Date('2024-02-03T23:00:00.000Z'),
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
    ]
  })
})

test('can deal with daylight saving time', async () => {
  // 1) we first set the sxxystem time to a date without daylight saving time
  // 2) then we parse an ical file which has events in the summer time in a timezone with daylight saving time
  // 3) and finally we check that this gets handled correctly

  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-01T12:00:00'))

  const calendar = transform(parse(await loadFixture('daylight_saving_time.ics')))

  expect(calendar).toMatchObject({
    events: [
      {
        start: {
          isAllDay: true,
          date: new Date('2024-04-02T22:00:00.000Z'),
          timezone: undefined
        },
        end: {
          isAllDay: true,
          date: new Date('2024-04-02T22:00:00.000Z'),
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

  vi.useRealTimers()
})
