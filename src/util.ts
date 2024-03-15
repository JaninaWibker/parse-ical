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

export const parseDate = (date: string) => {
  // YYYYMMDD
  const year = parseInt(date.substring(0, 4))
  const month = parseInt(date.substring(4, 6))
  const day = parseInt(date.substring(6, 8))

  return new Date(year, month - 1, day)
}

export const normalizeAndSplitLines = (text: string) =>
  text
    .replace(/\r/g, '')
    .replace(/\n /g, '')
    .split('\n')
    .filter((line) => line !== '')
