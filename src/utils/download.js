function interpolateFrames(frames, valueFn) {
    const rows = []
    frames.forEach((frame, i) => {
        if (i === 0) {
            rows.push(valueFn(frame, i))
        } else if (i % 2 === 0) {
            rows.push(valueFn(frame, i, frame - 1))
        }
    })
    return rows
}

function exportCSV(fileName, headers, rows) {
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
}

export function downloadCSV(result) {
    const { fileName, frames, maps } = result
    const rot = maps["Rotation"]
    const left = maps["Left Arm"]
    const right = maps["Right Arm"]

    const headers = ["0", "1", "2"]

    const rows = interpolateFrames(frames, (f, i, prev) => {
        if (i === 0) {
            return [rot.get(f) ?? 0, left.get(f) ?? 0, right.get(f) ?? 0]
        }
        return [
            (rot.get(f) + rot.get(prev)) / 2,
            (left.get(f) + left.get(prev)) / 2,
            (right.get(f) + right.get(prev)) / -2,
        ]
    })

    exportCSV(fileName.replace(/\.txt$/i, "") + ".csv", headers, rows)
}

export function createFullChoreography(results, mapping) {
    // Prepare module lookup
    const orderedModules = []
    const headers = []
    Object.entries(mapping).forEach(([fileName, indices]) => {
        indices.forEach(idx => {
            const mirror = idx < 0
            idx = Math.abs(idx)
            idx -= 1
            headers.push(`${idx * 3}`, `${idx * 3 + 1}`, `${idx * 3 + 2}`)
            orderedModules.push({ idx, fileName, mirror })
        })
    })

    // Find max frame count
    const frameCount = Math.max(...results.map(r => r.maps["Rotation"].size))
    const frames = Array.from({ length: frameCount }, (_, i) => i)

    const rows = interpolateFrames(frames, (f, i, prev) => {
        return orderedModules.flatMap(({ fileName, mirror }) => {
            const res = results.find(r => r.fileName === fileName)
            if (!res) return ["", "", ""]

            const mult = mirror ? -1 : 1
            const rot = res.maps["Rotation"]
            const left = res.maps["Left Arm"]
            const right = res.maps["Right Arm"]
            let result = []
            if (i === 0) {
                result = [
                    (rot.get(f) ?? 0) * mult,
                    (left.get(f) ?? 0),
                    (right.get(f) ?? 0) * -1,
                ]
            } else {
                result = [
                    ((rot.get(f) ?? 0) + (rot.get(prev) ?? 0)) * mult,
                    ((left.get(f) ?? 0) + (left.get(prev) ?? 0)),
                    ((right.get(f) ?? 0) + (right.get(prev) ?? 0)) * -1,
                ]
            }

            if (mirror) return [result[0], result[2], result[1]]
            return result
        })
    })

    exportCSV("full_choreography.csv", headers, rows)
}