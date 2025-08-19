<script setup>
import { ref } from 'vue'

const results = ref([])
const fps = 50
const columns = ['Rotation', 'Left Arm', 'Right Arm']

const headers = [
  { title: 'Module', value: 'column', align: 'start' },
  {
    title: 'Speed',
    align: 'center',
    class: "g-speed",
    children: [
      { title: 'Max (RPM)', value: 'maxSpeed' },
      { title: 'Time', value: 'speedTime' },
      { title: 'Frame', value: 'speedFrame' }
    ]
  },
  {
    title: 'Acceleration',
    align: 'center',
    children: [
      { title: 'Max (RPM/s)', value: 'maxAccel' },
      { title: 'Time', value: 'accelTime' },
      { title: 'Frame', value: 'accelFrame' }
    ]
  }
]

// State for modal
const dialog = ref(false)
const dialogData = ref({ column: "", type: "", frames: [] })

// limits for each module
const limits = {
  Rotation: { speed: 80, accel: 70 },
  'Left Arm': { speed: 800, accel: 200 },
  'Right Arm': { speed: 800, accel: 200 }
}

function handleFiles(event) {
  results.value = []

  Array.from(event.target.files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      const rotStructure = parseSection(content, 'Rotation_Structure')
      const rotLeftArm = parseSection(content, 'rotation_leftArm')
      const rotRightArm = parseSection(content, 'Rotation_RightArm')

      if (!rotStructure || !rotLeftArm || !rotRightArm) {
        console.warn(`Skipping file ${file.name} - missing one or more required sections.`)
        return
      }

      const frames = Array.from(rotStructure.keys()).sort((a, b) => a - b)
      const maps = [rotStructure, rotLeftArm, rotRightArm]

      const stats = maps.map((col, i) =>
        calculateStats(col, frames, columns[i])
      )

      results.value.push({
        fileName: file.name,
        stats,
        frames,
        maps: { rotStructure, rotLeftArm, rotRightArm }
      })

      results.value.sort((a, b) => a.fileName.localeCompare(b.fileName))
    }
    reader.readAsText(file)
  })
}

function parseSection(data, sectionName) {
  const regex = new RegExp(`User Data: ${sectionName}[\\s\\S]*?(?=User Data:|NULL OBJECTS|$)`, 'i')
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

function calculateStats(framesMap, frames, column) {
  const values = frames.map(f => framesMap.get(f) ?? 0)
  const dt = 1 / fps
  const limit = limits[column]

  let maxSpeed = 0
  let maxAccel = 0
  let maxSpeedFrame = 0
  let maxAccelFrame = 0

  let exceededSpeedFrames = []
  let exceededAccelFrames = []

  for (let i = 1; i < values.length; i++) {
    const speed = Math.abs((values[i] - values[i - 1]) / dt) / 6
    if (speed > maxSpeed) {
      maxSpeed = speed
      maxSpeedFrame = i
    }
    if (speed > limit.speed) {
      exceededSpeedFrames.push(i)
    }
  }

  for (let i = 2; i < values.length; i++) {
    const accel = Math.abs((values[i] - 2 * values[i - 1] + values[i - 2]) / (dt * dt)) / 6
    if (accel > maxAccel) {
      maxAccel = accel
      maxAccelFrame = i
    }
    if (accel > limit.accel) {
      exceededAccelFrames.push(i)
    }
  }

  return { maxSpeed, maxAccel, maxSpeedFrame, maxAccelFrame, exceededSpeedFrames, exceededAccelFrames }
}

function frameToTime(frameNumber) {
  return frameNumber / fps
}

function frameToTimestamp(frameNumber) {
  const totalSeconds = frameNumber / fps
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function downloadCSV(result) {
  const { fileName, frames, maps } = result
  const { rotStructure, rotLeftArm, rotRightArm } = maps

  // header row
  const rows = [["0", "1", "2"]]

  // collect rows
  frames.forEach(frame => {
    rows.push([
      rotStructure.get(frame) ?? 0,
      rotLeftArm.get(frame) ?? 0,
      rotRightArm.get(frame) ?? 0
    ])
  })

  // convert to CSV text
  const csvContent = rows.map(r => r.join(",")).join("\n")

  // trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName.replace(/\.txt$/i, "") + ".csv"
  link.click()
  URL.revokeObjectURL(link.href)
}

function openDialog(column, type, frames) {
  dialogData.value = {
    column,
    type,
    frames: groupFramesIntoIntervals(frames)
  }
  dialog.value = true
}

function groupFramesIntoIntervals(frames) {
  if (!frames.length) return []
  const sorted = [...frames].sort((a, b) => a - b)
  const intervals = []
  let start = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      // still contiguous
      prev = sorted[i]
    } else {
      // interval ended
      intervals.push([start, prev])
      start = sorted[i]
      prev = sorted[i]
    }
  }
  intervals.push([start, prev])
  return intervals
}
</script>

<template>
  <v-container>
    <div class="d-flex w-100 justify-space-between align-center">
      <h1>NAM Choreo Analyzer</h1><img src="/logo.png" width="32" height="32" />
    </div>
    <p>Select one or multiple .txt files exported from C4D</p>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-file-input label="Select TXT Files" multiple accept=".txt" @change="handleFiles" outlined />
      </v-col>
    </v-row>

    <v-row v-if="results.length">
      <v-col cols="12" v-for="result in results" :key="result.fileName">
        <v-card class="mb-4">
          <v-card-title class="d-flex w-100 justify-space-between align-center">{{ result.fileName }} <v-btn small
              color="primary" @click="downloadCSV(result)">
              Download CSV
            </v-btn></v-card-title>
          <v-card-text>
            <v-data-table :headers="headers" :items="result.stats.map((s, i) => ({
              column: columns[i],
              maxSpeed: s.maxSpeed,
              speedTime: frameToTimestamp(s.maxSpeedFrame),
              speedFrame: s.maxSpeedFrame,
              exceededSpeedFrames: s.exceededSpeedFrames,
              maxAccel: s.maxAccel,
              accelTime: frameToTimestamp(s.maxAccelFrame),
              accelFrame: s.maxAccelFrame,
              exceededAccelFrames: s.exceededAccelFrames
            }))" class="elevation-1" dense hide-default-footer>
              <!-- Custom header -->
              <template #headers>
                <tr>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th" colspan="1"
                    rowspan="2">
                    <div class="v-data-table-header__content"><span>Element</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-center v-data-table__th" colspan="3"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Speed</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-center v-data-table__th accel-cell" colspan="3"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Acceleration</span></div>
                  </th>
                </tr>
                <tr>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Max (RPM)</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Time</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Frame</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th accel-cell" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Max (RPM/s)</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th accel-cell" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Time</span></div>
                  </th>
                  <th class="v-data-table__td v-data-table-column--align-start v-data-table__th accel-cell" colspan="1"
                    rowspan="1">
                    <div class="v-data-table-header__content"><span>Frame</span></div>
                  </th>
                </tr>
              </template>

              <!-- Custom row rendering -->
              <template #item="{ item }">
                <tr>
                  <td>{{ item.column }}</td>
                  <td>
                    <span :class="{ 'red--text': item.maxSpeed > limits[item.column].speed }">
                      {{ item.maxSpeed.toFixed(2) }}
                      <span v-if="item.maxSpeed > limits[item.column].speed"> ({{ limits[item.column].speed }})</span>
                    </span>
                  </td>
                  <td>{{ item.speedTime }}</td>
                  <td>
                    <v-btn small text @click="openDialog(item.column, 'Speed', item.exceededSpeedFrames)">
                      {{ item.speedFrame }}
                    </v-btn>
                  </td>
                  <td>
                    <span :class="{ 'red--text': item.maxAccel > limits[item.column].accel }">
                      {{ item.maxAccel.toFixed(2) }}
                      <span v-if="item.maxAccel > limits[item.column].accel"> ({{ limits[item.column].accel }})</span>
                    </span>
                  </td>
                  <td>{{ item.accelTime }}</td>
                  <td>
                    <v-btn small text @click="openDialog(item.column, 'Acceleration', item.exceededAccelFrames)">
                      {{ item.accelFrame }}
                    </v-btn>
                  </td>
                </tr>
              </template>
            </v-data-table>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ dialogData.column }} - {{ dialogData.type }} Exceeded Frames
        </v-card-title>
        <v-card-text>
          <v-list v-if="dialogData.frames.length">
            <v-list v-if="dialogData.frames.length">
              <v-list-item v-for="(interval, idx) in dialogData.frames" :key="idx">
                <template v-if="interval[0] === interval[1]">
                  Frame {{ interval[0] }} ({{ frameToTimestamp(interval[0]) }})
                </template>
                <template v-else>
                  Frames {{ interval[0] }} - {{ interval[1] }}
                  ({{ frameToTimestamp(interval[0]) }} → {{ frameToTimestamp(interval[1]) }})
                </template>
              </v-list-item>
            </v-list>
          </v-list>
          <div v-else>No frames exceeded the limit</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.red--text {
  color: red !important;
}

.accel-cell {
  background-color: #1e1e1e;
}
</style>
