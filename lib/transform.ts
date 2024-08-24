import { rrulestr } from './rrule-wrapper'
import type { CalendarDate, CalendarEvent, CalendarMetadata, Component, Property } from './types'
import { parseDate, parseDateAndTime, parseDuration } from './util'

const mustOnlyOccurOnce = (
  property: Property | undefined,
  name: string,
  received: Component | Property | undefined,
  overrideScope = 'VEVENT'
) => {
  if (!property) {
    throw new Error(`${overrideScope} must have ${name}, received: ${JSON.stringify(received, null, 2)}`)
  }
  if (property.length !== 1) {
    throw new Error(`${overrideScope} ${name} must only occur once, received: ${JSON.stringify(received, null, 2)}`)
  }
}

const optionalButIfSetMustOccurOnlyOnce = (
  property: Property | undefined,
  name: string,
  received: Component | Property | undefined,
  overrideScope = 'VEVENT'
) => {
  if (property) {
    mustOnlyOccurOnce(property, name, received, overrideScope)
  }
}

const mustNotHaveParameters = (
  property: Property | undefined,
  name: string,
  received: Component | Property | undefined,
  overrideScope = 'VEVENT'
) => {
  if (!property) {
    throw new Error(`${overrideScope} must have ${name}, received: ${JSON.stringify(received, null, 2)}`)
  }

  const maybeIndex = property.findIndex(({ parameters }) => Object.keys(parameters).length > 0)
  if (maybeIndex !== -1) {
    throw new Error(
      `${overrideScope} ${name} must not have parameters ([${maybeIndex}]: ${property[maybeIndex]!.parameters}), received: ${JSON.stringify(received, null, 2)}`
    )
  }
}

const optionalButIfSetMustNotHaveParameters = (
  property: Property | undefined,
  name: string,
  received: Component | Property | undefined,
  overrideScope = 'VEVENT'
) => {
  if (property) {
    mustNotHaveParameters(property, name, received, overrideScope)
  }
}

const optionalButMutuallyExclusiveIfSet = (
  properties: [Property | undefined, string][],
  errorMessage: string,
  received: Component | Property | undefined,
  overrideScope = 'VEVENT'
) => {
  const setProperties = properties.filter(([property]) => property)
  if (setProperties.length > 1) {
    throw new Error(`${overrideScope} ${errorMessage}, received: ${JSON.stringify(received, null, 2)}`)
  }
}

export const matchDateParameters = (date: Property, defaultTimezone: string) => {
  mustOnlyOccurOnce(date, 'DATE', date)

  const actualDate = date[0]!.value
  const actualParams = date[0]!.parameters

  const isAllDay = actualParams.VALUE === 'DATE'
  const tzid = actualParams.TZID

  const parsedDate = isAllDay
    ? parseDate(actualDate, tzid ?? defaultTimezone)
    : parseDateAndTime(tzid ? actualDate + 'Z' : actualDate)

  // if tzid is set, then the date format forgoes the 'Z' suffix
  // omitting (or changing) the timezone does not change the date, it is correctly encoded as UTC
  // what it does change (or can change) is the interpretation of the date as
  // it may be shown in the specified timezone rather than the default timezone
  // for breviety the timezone field is omitted if it is the default timezone specified in the metadata
  return {
    isAllDay,
    date: parsedDate,
    timezone: tzid === defaultTimezone ? undefined : tzid
  }
}

// TODO: improve?
export const matchAlarm = (component: Component) => {
  return component.properties
}

export const matchTimezone = (component: Component) => {
  mustOnlyOccurOnce(component.properties.TZID, 'TZID', component, 'VTIMEZONE')
  mustNotHaveParameters(component.properties.TZID, 'TZID', component, 'VTIMEZONE')

  return component.properties.TZID ? component.properties.TZID[0]!.value : undefined
}

export const matchRecurrenceRules = (
  {
    rrule,
    sequence,
    exdate,
    recurrenceId
  }: Record<'rrule' | 'sequence' | 'exdate' | 'recurrenceId', Property | undefined>,
  defaultTimezone: string
) => {
  optionalButIfSetMustOccurOnlyOnce(sequence, 'SEQUENCE', sequence)
  optionalButIfSetMustNotHaveParameters(sequence, 'SEQUENCE', sequence)

  optionalButIfSetMustOccurOnlyOnce(rrule, 'RRULE', rrule)
  optionalButIfSetMustNotHaveParameters(rrule, 'RRULE', rrule)

  optionalButIfSetMustOccurOnlyOnce(recurrenceId, 'RECURRENCE-ID', recurrenceId)

  if (sequence && isNaN(parseInt(sequence[0]!.value))) {
    throw new Error('VEVENT SEQUENCE must be a number')
  }

  const parsedExcludedDates = exdate
    ? exdate.flatMap((entry) => {
        if (entry.value.includes(',')) {
          return entry.value
            .split(',')
            .map((date) => matchDateParameters([{ value: date, parameters: {} }], defaultTimezone))
        } else {
          return matchDateParameters([entry], defaultTimezone)
        }
      })
    : undefined

  const parsedSequence = sequence ? parseInt(sequence[0]!.value) : undefined
  const parsedRRule = rrule ? rrulestr(rrule[0]!.value) : undefined

  return {
    rrule: parsedRRule,
    exdate: parsedExcludedDates,
    sequence: parsedSequence,
    recurrenceId: recurrenceId ? matchDateParameters(recurrenceId, defaultTimezone) : undefined
  }
}

export const matchEvent = (component: Component, options: { timezone: string }): CalendarEvent => {
  if (
    Object.entries(component.components).length !== 0 &&
    Object.keys(component.components).some((key) => key !== 'VALARM')
  ) {
    throw new Error('VEVENT must not contain components other than VALARM')
  }

  // required properties
  mustOnlyOccurOnce(component.properties.DTSTART, 'DTSTART (start date, potentially without time)', component)
  mustOnlyOccurOnce(component.properties.DTSTAMP, 'DTSTAMP', component)
  mustOnlyOccurOnce(component.properties.UID, 'UID (unique identifier)', component)
  optionalButIfSetMustOccurOnlyOnce(
    component.properties['LAST-MODIFIED'],
    'LAST-MODIFIED (modification date)',
    component
  )
  optionalButIfSetMustOccurOnlyOnce(component.properties.CREATED, 'CREATED (creation date)', component)
  mustOnlyOccurOnce(component.properties.SUMMARY, 'SUMMARY (title)', component)
  mustNotHaveParameters(component.properties.UID, 'UID (unique identifier)', component)
  mustNotHaveParameters(component.properties.SUMMARY, 'SUMMARY (title)', component)

  // optional properties
  optionalButIfSetMustOccurOnlyOnce(component.properties.LOCATION, 'LOCATION', component)
  optionalButIfSetMustOccurOnlyOnce(component.properties.DESCRIPTION, 'DESCRIPTION', component)
  optionalButIfSetMustOccurOnlyOnce(component.properties.STATUS, 'STATUS', component)
  optionalButIfSetMustOccurOnlyOnce(component.properties.TRANSP, 'TRANSP', component)
  optionalButIfSetMustNotHaveParameters(component.properties.LOCATION, 'LOCATION', component)
  optionalButIfSetMustNotHaveParameters(component.properties.DESCRIPTION, 'DESCRIPTION', component)
  optionalButIfSetMustNotHaveParameters(component.properties.STATUS, 'STATUS', component)
  optionalButIfSetMustNotHaveParameters(component.properties.TRANSP, 'TRANSP', component)

  optionalButMutuallyExclusiveIfSet(
    [
      [component.properties.DTEND, 'DTEND'],
      [component.properties.DURATION, 'DURATION']
    ],
    'DTEND and DURATION are mutually exclusive and cannot both be set',
    component
  )

  const uid = component.properties.UID![0]!.value
  const title = component.properties.SUMMARY![0]!.value
  const maybeLocation = component.properties.LOCATION ? component.properties.LOCATION[0]!.value : undefined
  const maybeDescription = component.properties.DESCRIPTION ? component.properties.DESCRIPTION[0]!.value : undefined
  const maybeStatus = component.properties.STATUS ? component.properties.STATUS[0]!.value : undefined
  const maybeTransparency = component.properties.TRANSP ? component.properties.TRANSP[0]!.value : undefined

  const recurrence = matchRecurrenceRules(
    {
      rrule: component.properties.RRULE,
      sequence: component.properties.SEQUENCE,
      exdate: component.properties.EXDATE,
      recurrenceId: component.properties['RECURRENCE-ID']
    },
    options.timezone
  )

  const organizers = component.properties.ORGANIZER
    ? typeof component.properties.ORGANIZER === 'string'
      ? [{ value: component.properties.ORGANIZER, parameters: {} }]
      : component.properties.ORGANIZER
    : []

  const attendees = component.properties.ATTENDEE
    ? typeof component.properties.ATTENDEE === 'string'
      ? [{ value: component.properties.ATTENDEE, parameters: {} }]
      : component.properties.ATTENDEE
    : []

  const start = matchDateParameters(component.properties.DTSTART!, options.timezone)
  let maybeEnd: CalendarDate | undefined

  if (component.properties.DTEND) {
    mustOnlyOccurOnce(
      component.properties.DTEND,
      'DTEND (end date, potentially without time; can also supply DURATION, but not both; can also supply neither; https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1)',
      component
    )
    maybeEnd = matchDateParameters(component.properties.DTEND!, options.timezone)
  } else if (component.properties.DURATION) {
    mustOnlyOccurOnce(
      component.properties.DURATION,
      'DURATION (duration, end date = start date + duration; can also supply DTEND, but not both, can also supply neither; https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1)',
      component
    )
    maybeEnd = parseDuration(component.properties.DURATION[0]!.value, start)
  } else {
    // https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1
    // https://www.rfc-editor.org/rfc/rfc5545#page-54

    if (start.isAllDay) {
      // For cases where a "VEVENT" calendar component specifies a "DTSTART" property with a DATE value type but no "DTEND" nor "DURATION" property, the event's duration is taken to be one day
      maybeEnd = {
        date: new Date(start.date.getTime() + 24 * 60 * 60 * 1000),
        isAllDay: true,
        timezone: start.timezone
      }
    } else {
      // For cases where a "VEVENT" calendar component specifies a "DTSTART" property with a DATE-TIME value type but no "DTEND" property, the event ends on the same calendar date and time of day specified by the "DTSTART" property.
      maybeEnd = start
    }
  }

  const end = maybeEnd

  const modificationDate = component.properties['LAST-MODIFIED']
    ? matchDateParameters(component.properties['LAST-MODIFIED'], options.timezone)
    : undefined
  const creationDate = component.properties.CREATED
    ? matchDateParameters(component.properties.CREATED, options.timezone)
    : undefined

  // dtstamp refers to the creation date of the VEVENT message itself, not the event
  // it is thus more of an indicator of when some events were exported via iCAL or sent
  // somewhere, rather than when the event was created. This information is still useful
  // as it allows to handle multiple VEVENTs with the same UID as it basically acts as
  // a version number.
  // Having multiple VEVENTs with the same UID sounds like an error, but it is not.
  // Imagine using iCAL as an incremental backing store for a calendar application, you
  // might want to update a specific event and thus amend a new VEVENT message with the
  // same UID but a newer DTSTAMP. VEVENTS could thus be seen more like diffs on top of
  // an event identified by the UID, rather than a whole event by itself. Think of iCAL
  // more like a network protocol, thus something that must be able to handle partial
  // updates and conflicts, rather than a file format for exporting a calendar once.
  // It also works perfectly fine for that purpose but it does offer more than that.
  const dtstamp = matchDateParameters(component.properties.DTSTAMP!, options.timezone)

  const rest = Object.fromEntries(
    Object.entries(component.properties).filter(
      ([key]) =>
        ![
          'DTSTART',
          'DTEND',
          'DURATION',
          'UID',
          'LAST-MODIFIED',
          'CREATED',
          'DTSTAMP',
          'SUMMARY',
          'LOCATION',
          'DESCRIPTION',
          'STATUS',
          'TRANSP',
          'RRULE',
          'SEQUENCE',
          'RECURRENCE-ID',
          'EXDATE',
          'ORGANIZER',
          'ATTENDEE'
        ].includes(key)
    )
  )

  return {
    start,
    end,
    modificationDate,
    creationDate,
    dtstamp,
    uid,
    title,

    alarms: component.components.VALARM ? component.components.VALARM.map(matchAlarm) : [],

    location: maybeLocation,
    description: maybeDescription,

    organizers,
    attendees,
    status: maybeStatus,
    transparency: maybeTransparency,

    recurrence,

    rest
  }
}

export const matchCalendar = (component: Component): { events: CalendarEvent[]; metadata: CalendarMetadata } => {
  optionalButIfSetMustOccurOnlyOnce(component.properties.VERSION, 'VERSION', component, 'VCALENDAR')
  optionalButIfSetMustOccurOnlyOnce(component.properties.PRODID, 'PRODID', component, 'VCALENDAR')
  optionalButIfSetMustOccurOnlyOnce(component.properties.CALSCALE, 'CALSCALE', component, 'VCALENDAR')
  optionalButIfSetMustNotHaveParameters(component.properties.VERSION, 'VERSION', component, 'VCALENDAR')
  optionalButIfSetMustNotHaveParameters(component.properties.PRODID, 'PRODID', component, 'VCALENDAR')
  optionalButIfSetMustNotHaveParameters(component.properties.CALSCALE, 'CALSCALE', component, 'VCALENDAR')

  optionalButIfSetMustNotHaveParameters(component.properties['X-WR-TIMEZONE'], 'X-WR-TIMEZONE', component, 'VCALENDAR')

  const maybeVersion = component.properties.VERSION ? component.properties.VERSION[0]!.value : undefined
  const maybeProdId = component.properties.PRODID ? component.properties.PRODID[0]!.value : undefined
  const maybeCalScale = component.properties.CALSCALE ? component.properties.CALSCALE[0]!.value : undefined
  const maybeXWrTimezone = component.properties['X-WR-TIMEZONE']
    ? component.properties['X-WR-TIMEZONE'][0]!.value
    : undefined

  const rest = Object.fromEntries(
    Object.entries(component.properties).filter(
      ([key]) => !['VERSION', 'PRODID', 'CALSCALE', 'X-WR-TIMEZONE'].includes(key)
    )
  )

  // timezone parsing is a deviation from the ical spec
  // In the spec it is assumed that no such thing as a TZ database exists and everything has to be redefined
  // but here we assume that the browser is able to handle all timezones that are thrown against it, thus there
  // is no need to redefine "Europe/Berlin" along with all its rules (daylight saving, ..).
  // This means that certain things no longer work as they are supposed to and the ical file has to have properly
  // named timezones, but this is a tradeoff that is acceptable for the use case of this library.
  // It is also pretty common to choose correct names for timezones, so I do not expect someone to define "Asia/Shanghai"
  // as the same timezone as "America/New_York" or something like that. If someone does that, it is their fault.
  // I also expect timezone names to be properly formatted, thus "/mozilla.org/20050126_1/America/Cancun" is not valid.

  // And now for what is actually done here instead of following the spec to a T:
  // If `X-WR-TIMEZONE` is set, use that
  // If there is one `VTIMEZONE` component, use that
  // If there are multiple `VTIMEZONE` components, use the first one

  // support both X-WR-TIMEZONE (property) and VTIMEZONE (component)
  const VTimezone = component.components.VTIMEZONE ? matchTimezone(component.components.VTIMEZONE[0]!) : undefined

  if (!maybeXWrTimezone && !VTimezone) {
    throw new Error('VCALENDAR must have a configured timezone. Either use X-WR-TIMEZONE or VTIMEZONE')
  }

  const timezone = (maybeXWrTimezone || VTimezone) as string

  const metadata = { timezone, version: maybeVersion, prodid: maybeProdId, calscale: maybeCalScale, rest }

  const maybeEvents = component.components.VEVENT
    ? component.components.VEVENT.map((event) => {
        try {
          const parsedEvent = matchEvent(event, { timezone })
          return { success: true, event: parsedEvent }
        } catch (e) {
          return { success: false, error: e as Error }
        }
      })
    : []

  if (maybeEvents.some(({ success }) => !success)) {
    const errors = maybeEvents.filter(({ success }) => !success).map(({ error }) => error!)
    const events = maybeEvents.filter(({ success }) => success).map(({ event }) => event)

    const stringifiedErrors = errors.map((error) => error.message).join('\n\n')
    const stringifiedEvents = JSON.stringify(events, null, 2)
    const stringifiedMetadata = JSON.stringify(metadata, null, 2)

    throw new Error(
      [
        'Failed to parse events. This might not mean that parsing failed for every single event, thus the correctly parsed events and the calendar metadata will be output, as well as the error messages for the events that failed parsing.',
        'Errors:',
        stringifiedErrors,
        'Events:',
        stringifiedEvents,
        'Metadata:',
        stringifiedMetadata
      ].join('\n\n')
    )
  }

  const events = maybeEvents.map(({ event }) => event) as CalendarEvent[]

  return { metadata, events }
}
