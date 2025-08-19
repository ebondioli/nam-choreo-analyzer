export function parseSection(data, sectionName) {
  const regex = new RegExp(
    `User Data: ${sectionName}[\\s\\S]*?(?=User Data:|NULL OBJECTS|$)`,
    'i'
  )
  const match = data.match(regex)
  if (!match) return null

  const sectionText = match[0]
  const frameRegex = /Frame (\d+): ([\d\.\-eE]+)/g
  let frameMatch
  const frames = new Map()
  while ((frameMatch = frameRegex.exec(sectionText)) !== null) {
    const frameNum = parseInt(frameMatch[1], 10)
    const value = parseFloat(frameMatch[2])
    frames.set(frameNum, value)
  }
  return frames
}
