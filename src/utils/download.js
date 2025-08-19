export function downloadCSV(result) {
  const { fileName, frames, maps } = result
  const { rotStructure, rotLeftArm, rotRightArm } = maps

  const rows = [["0", "1", "2"]]
  frames.forEach(frame => {
    rows.push([
      rotStructure.get(frame) ?? 0,
      rotLeftArm.get(frame) ?? 0,
      rotRightArm.get(frame) ?? 0
    ])
  })

  const csvContent = rows.map(r => r.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName.replace(/\.txt$/i, "") + ".csv"
  link.click()
  URL.revokeObjectURL(link.href)
}
