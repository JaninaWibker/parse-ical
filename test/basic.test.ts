import { expect, test } from 'vitest'
import { transform, parse } from 'parse-ical'
import { loadFixture } from './helper'

test('Basic usage', async () => {
  const calendar = transform(parse(await loadFixture('basic.ics')))

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
        description: `-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
Join with Google Meet: https://meet.google.com/xxx-xxxx-xxx
Or dial: (DE) +00 00 0000000000 PIN: 123456789#
More phone numbers: https://tel.meet/xxx-xxxx-xxx?pin=0000000000000&hs=0

Learn more about Meet at: https://support.google.com/a/users/answer/9282720

Please do not edit this section.
-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-`,
        location: undefined,
        alarms: [],
        organizers: [
          {
            value: 'mailto:alice@example.com',
            parameters: {
              CN: 'Alice'
            }
          }
        ],
        attendees: [
          {
            value: 'mailto:bob@example.com',
            parameters: {
              CUTYPE: 'INDIVIDUAL',
              ROLE: 'REQ-PARTICIPANT',
              PARTSTAT: 'ACCEPTED',
              CN: 'bob@example.com',
              'X-NUM-GUESTS': '0'
            }
          },
          {
            value: 'mailto:alice@example.com',
            parameters: {
              CUTYPE: 'INDIVIDUAL',
              ROLE: 'REQ-PARTICIPANT',
              PARTSTAT: 'ACCEPTED',
              CN: 'Alice',
              'X-NUM-GUESTS': '0'
            }
          }
        ],
        recurrence: {
          recurrenceId: {
            date: new Date('2023-03-06T14:30:00.000Z'),
            isAllDay: false,
            timezone: undefined
          },
          rrule: undefined,
          exdate: undefined,
          sequence: 1
        },

        status: 'CONFIRMED',
        transparency: 'OPAQUE',

        rest: {
          'X-GOOGLE-CONFERENCE': [
            {
              value: 'https://meet.google.com/xxx-xxxx-xxx',
              parameters: {}
            }
          ]
        }
      }
    ],
    metadata: {
      timezone: 'Europe/Berlin',
      version: '2.0',
      calscale: 'GREGORIAN',
      prodid: '-//Google Inc//Google Calendar 70.9054//EN'
    }
  })
})

test('Can parse X-Params and X-Components in VEVENT', async () => {
  const calendar = transform(parse(await loadFixture('x-param-x-component.ics')))

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
        title: 'Visit the Statue of Liberty',
        location: 'New York, NY 10004, United States',
        alarms: [],
        organizers: [],
        attendees: [
          {
            value: 'mailto:alice@example.com',
            parameters: {
              CN: 'Alice',
              CUTYPE: 'INDIVIDUAL',
              EMAIL: 'alice@example.com',
              PARTSTAT: 'NEEDS-ACTION',
              ROLE: 'REQ-PARTICIPANT',
              RSVP: 'TRUE',
              'X-NUM-GUESTS': '0' // X-Param
            }
          }
        ],
        recurrence: {
          recurrenceId: undefined,
          rrule: undefined,
          exdate: undefined,
          sequence: undefined
        },

        status: undefined,
        transparency: 'OPAQUE',

        rest: {
          // X-Component
          'X-APPLE-CREATOR-IDENTITY': [
            {
              value: 'com.apple.mobilecal',
              parameters: {}
            }
          ]
        }
      }
    ],
    metadata: {
      timezone: 'America/New_York',
      version: '2.0',
      calscale: 'GREGORIAN'
    }
  })
})
