const fps = 50

export function calculateStats(framesMap, frames, column, limits) {
    const values = frames.map(f => framesMap.get(f) ?? 0)
    const dt = 1 / fps
    const limit = limits[column]

    let maxSpeed = 0
    let maxAccel = 0
    let maxSpeedFrame = 0
    let maxAccelFrame = 0

    const exceededSpeedFrames = []
    const exceededAccelFrames = []

    for (let i = 1; i < values.length; i++) {
        const speed = Math.abs((values[i] - values[i - 1]) / dt) / 6
        if (speed > maxSpeed) {
            maxSpeed = speed
            maxSpeedFrame = i
        }
        if (speed > limit.speed) exceededSpeedFrames.push([i, speed])
    }

    for (let i = 2; i < values.length; i++) {
        const accel = Math.abs((values[i] - 2 * values[i - 1] + values[i - 2]) / (dt * dt)) / 6
        if (accel > maxAccel) {
            maxAccel = accel
            maxAccelFrame = i
        }
        if (accel > limit.accel) exceededAccelFrames.push([i, accel])
    }

    return {
        maxSpeed,
        maxAccel,
        maxSpeedFrame,
        maxAccelFrame,
        exceededSpeedFrames,
        exceededAccelFrames,
    }
}

export function frameToTimestamp(frameNumber) {
    const totalSeconds = frameNumber / fps
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
}

export function groupFramesIntoIntervals(frames) {
    if (!frames.length) return []

    // Sort by frame number
    const sorted = frames.slice().sort((a, b) => a[0] - b[0])
    const intervals = []

    let start = sorted[0][0]
    let prev = sorted[0][0]
    let maxVal = sorted[0][1]

    for (let i = 1; i < sorted.length; i++) {
        const [frameNum, value] = sorted[i]

        if (frameNum === prev + 1) {
            // contiguous
            prev = frameNum
            if (value > maxVal) maxVal = value
        } else {
            // interval ended
            intervals.push([start, prev, maxVal])
            start = frameNum
            prev = frameNum
            maxVal = value
        }
    }

    // push the last interval
    intervals.push([start, prev, maxVal])
    return intervals
}


