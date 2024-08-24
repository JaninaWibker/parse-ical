import type { RRule } from 'rrule'

export type Property = { value: string; parameters: Record<string, string> }[]
export type Properties = Record<string, Property>

export type CalendarDate = {
  date: Date
  isAllDay: boolean
  timezone: string | undefined
}

export type Component = {
  properties: Properties
  components: Record<string, Component[]>
}

export type CalendarEvent = {
  start: CalendarDate
  end: CalendarDate
  modificationDate?: CalendarDate
  creationDate?: CalendarDate
  dtstamp: CalendarDate
  uid: string
  title: string

  location?: string
  description?: string
  alarms?: Properties[]

  organizers?: { value: string; parameters: Record<string, string> }[]
  attendees?: { value: string; parameters: Record<string, string> }[]
  status?: string
  transparency?: string

  recurrence?: {
    rrule: RRule | undefined
    exdate: CalendarDate[] | undefined
    sequence: number | undefined
    recurrenceId: CalendarDate | undefined
  }

  rest: Properties
}

export type CalendarDaylightOrStandard = {
  tzoffsetfrom: string
  tzoffsetto: string
  dtstart: string
  tzname?: string
  rrule?: string
}

export type CalendarTimezone = {
  tzid: string
  lastModified?: string
  tzurl?: string
  xLicLocation?: string
  daylight: CalendarDaylightOrStandard[]
  standard: CalendarDaylightOrStandard[]

  rest: Properties
}

export type CalendarMetadata = {
  timezone: string
  definedTimezones: CalendarTimezone[]
  prodid: string | undefined
  version: string | undefined
  calscale: string | undefined

  rest: Properties
}
