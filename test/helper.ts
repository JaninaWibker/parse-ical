import fs from 'fs'
import path from 'path'

export const loadFixture = (filename: string) => {
  return new Promise<string>((resolve, reject) =>
    fs.readFile(path.join(__dirname, 'fixtures', filename), 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  )
}
