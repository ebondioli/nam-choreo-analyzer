export function downloadCSV(result, exportRate = 2) {
    const { fileName, frames, maps } = result
    const rotStructure = maps['Rotation']
    const rotLeftArm = maps['Left Arm']
    const rotRightArm = maps['Right Arm']

    const rows = [["0", "1", "2"]]
    frames.forEach((frame, i) => {
        if (i === 0) {
            rows.push([
                rotStructure.get(frame) ?? 0,
                rotLeftArm.get(frame) ?? 0,
                rotRightArm.get(frame) ?? 0
            ])
        }
        else if (i % 2 === 0) {
            rows.push([
                (rotStructure.get(frame) + rotStructure.get(frame - 1)) / 2,
                (rotLeftArm.get(frame) + rotLeftArm.get(frame - 1)) / 2,
                (rotRightArm.get(frame) + rotRightArm.get(frame - 1)) / 2
            ])
        }
    })

    const csvContent = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName.replace(/\.txt$/i, "") + ".csv"
    link.click()
    URL.revokeObjectURL(link.href)
}
