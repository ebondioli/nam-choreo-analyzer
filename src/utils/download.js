export function downloadCSV(result, csvFps) {
  const { fileName, frames, maps } = result
  const rotStructure = maps['Rotation']
  const rotLeftArm = maps['Left Arm']
  const rotRightArm = maps['Right Arm']
  const inputFps = 50
  const durationSec = frames[frames.length - 1] / inputFps
  const totalFramesOut = Math.floor(durationSec * csvFps)

  const rows = [["Rotation", "Left Arm", "Right Arm"]]

  for (let i = 0; i <= totalFramesOut; i++) {
    const timeSec = i / csvFps
    const sourceFrame = Math.floor(timeSec * inputFps)

    rows.push([
      rotStructure.get(sourceFrame) ?? 0,
      rotLeftArm.get(sourceFrame) ?? 0,
      rotRightArm.get(sourceFrame) ?? 0,
    ])
  }

  const csvContent = rows.map(r => r.join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName.replace(/\.txt$/i, "") + `.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
