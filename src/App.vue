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
      const columnsMap = [rotStructure, rotLeftArm, rotRightArm]
      const stats = columnsMap.map(col => calculateStats(col, frames))

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

function calculateStats(framesMap, frames) {
  const values = frames.map(f => framesMap.get(f) ?? 0)
  const dt = 1 / fps

  let maxSpeed = 0
  let maxAccel = 0
  let maxSpeedFrame = 0
  let maxAccelFrame = 0

  for (let i = 1; i < values.length; i++) {
    const speed = Math.abs((values[i] - values[i - 1]) / dt) / 6
    if (speed > maxSpeed) {
      maxSpeed = speed
      maxSpeedFrame = i
    }
  }

  for (let i = 2; i < values.length; i++) {
    const accel = Math.abs((values[i] - 2 * values[i - 1] + values[i - 2]) / (dt * dt)) / 6
    if (accel > maxAccel) {
      maxAccel = accel
      maxAccelFrame = i
    }
  }

  return { maxSpeed, maxAccel, maxSpeedFrame, maxAccelFrame }
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
          <v-card-title class="d-flex w-100 justify-space-between align-center">{{ result.fileName }} <v-btn small color="primary" @click="downloadCSV(result)">
              Download CSV
            </v-btn></v-card-title>
          <v-card-text>
            <v-data-table :headers="headers" :items="result.stats.map((s, i) => ({
              column: columns[i],
              maxSpeed: s.maxSpeed,
              speedTime: frameToTimestamp(s.maxSpeedFrame),
              speedFrame: s.maxSpeedFrame,
              maxAccel: s.maxAccel,
              accelTime: frameToTimestamp(s.maxAccelFrame),
              accelFrame: s.maxAccelFrame
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

                  <!-- Speed -->
                  <td>
                    <span :class="{ 'red--text': item.maxSpeed > limits[item.column].speed }">
                      {{ item.maxSpeed.toFixed(2) }}
                      <template v-if="item.maxSpeed > limits[item.column].speed">
                        (over {{ limits[item.column].speed }} RPM)
                      </template>
                    </span>
                  </td>
                  <td>{{ item.speedTime }}</td>
                  <td>{{ item.speedFrame }}</td>

                  <!-- Accel -->
                  <td>
                    <span :class="{ 'red--text': item.maxAccel > limits[item.column].accel }">
                      {{ item.maxAccel.toFixed(2) }}
                      <template v-if="item.maxAccel > limits[item.column].accel">
                        (over {{ limits[item.column].accel }} RPM/s)
                      </template>
                    </span>
                  </td>
                  <td>{{ item.accelTime }}</td>
                  <td>{{ item.accelFrame }}</td>
                </tr>
              </template>
            </v-data-table>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
