import { rrulestr } from './rrule-wrapper'
import type { CalendarEvent, CalendarMetadata, Component, Property } from './types'
import { parseDate, parseDateAndTime } from './util'

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
  mustOnlyOccurOnce(component.properties.DTEND, 'DTEND (end date, potentially without time)', component)
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
  const end = matchDateParameters(component.properties.DTEND!, options.timezone)
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

  // support both X-WR-TIMEZONE (property) and VTIMEZONE (component)
  const hasVTimezone = !!component.components.VTIMEZONE && component.components.VTIMEZONE.length === 1

  const VTimezone = hasVTimezone ? matchTimezone(component.components.VTIMEZONE![0]!) : undefined

  if (!!maybeXWrTimezone && hasVTimezone && maybeXWrTimezone !== VTimezone) {
    throw new Error('VCALENDAR has both X-WR-TIMEZONE and VTIMEZONE, but they do not match')
  }

  if (!maybeXWrTimezone && !hasVTimezone) {
    throw new Error('VCALENDAR must contain exactly one VTIMEZONE component or one X-WR-TIMEZONE property')
  }

  const timezone = (maybeXWrTimezone || VTimezone) as string

  const events = component.components.VEVENT
    ? component.components.VEVENT.map((event) => matchEvent(event, { timezone }))
    : []

  return {
    metadata: { timezone, version: maybeVersion, prodid: maybeProdId, calscale: maybeCalScale, rest },
    events
  }
}
