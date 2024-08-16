const getTimezoneOffsetFromTZID = (tzid: string, date: Date) => {
  // '1/1/2024, GMT+1:00'
  const dateText = Intl.DateTimeFormat([], { timeZone: tzid, timeZoneName: 'longOffset' }).format(new Date(date))
  // 'GMT+1:00'
  const offsetText = dateText.split(' ')[1] || 'GMT+0:00'

  // ['+1', '00']
  const [signAndHours, minutesText] = (offsetText.slice(3) || '+0:00').split(':')

  const sign = signAndHours![0] === '-' ? -1 : 1
  const hours = parseInt(signAndHours!.slice(1))
  const minutes = parseInt(minutesText!)

  return sign * (hours * 60 + minutes)
}

const validateICalDateAndTime = (date: string) => {
  const chars = date.split('')

  // Check that the date is exactly 16 characters long and contains a T and a Z at the correct positions
  if (chars.length !== 16) return false
  if (chars[8] !== 'T') return false
  if (chars[15] !== 'Z') return false

  // Check that all characters except for the T and Z are numbers
  return chars.filter((_char, i) => i !== 8 && i !== 15).every((char) => !isNaN(parseInt(char)))
}

export const parseDateAndTime = (date: string) => {
  if (!validateICalDateAndTime(date)) {
    throw new Error(`Invalid iCal date format (${date})`)
  }

  // YYYYMMDDTHHMMSSZ
  const year = date.substring(0, 4)
  const month = date.substring(4, 6)
  const day = date.substring(6, 8)
  const hour = date.substring(9, 11)
  const minute = date.substring(11, 13)
  const second = date.substring(13, 15)

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`)
}

export const parseDate = (date: string, timezone: string) => {
  // YYYYMMDD
  const year = parseInt(date.substring(0, 4))
  const month = parseInt(date.substring(4, 6))
  const day = parseInt(date.substring(6, 8))

  const dateInLocalTimezone = new Date(year, month - 1, day)

  // find the timezone offsets based on the dateInLocalTimezone
  // because otherwise daylight saving time will not be taken into account
  // when converting between timezones

  // this is very much similar to a change of basis in linear algebra :)

  // local -> gmt   by adding value
  // gmt   -> local by subtracting value
  const offsetFromGMT = -new Date(dateInLocalTimezone).getTimezoneOffset()

  // target -> gmt    by adding value
  // gmt    -> target by subtracting value
  const offsetFromTargetTimezoneToGMT = getTimezoneOffsetFromTZID(timezone, dateInLocalTimezone)

  // first adjust to GMT (local -> gmt; thus adding the offset)
  dateInLocalTimezone.setMinutes(dateInLocalTimezone.getMinutes() + offsetFromGMT)

  // then to the target timezone (gmt -> target; thus subtracting the offset)
  dateInLocalTimezone.setMinutes(dateInLocalTimezone.getMinutes() - offsetFromTargetTimezoneToGMT)

  return new Date(dateInLocalTimezone)
}

export const normalizeAndSplitLines = (text: string) =>
  text
    .replace(/\r/g, '')
    .replace(/\n /g, '')
    .split('\n')
    .filter((line) => line !== '')
