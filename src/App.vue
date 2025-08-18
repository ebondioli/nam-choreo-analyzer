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
    children: [
      { title: 'Max (RPM)', value: 'maxSpeed' },
      { title: 'Time (s)', value: 'speedTime' },
      { title: 'Frame', value: 'speedFrame' }
    ]
  },
  {
    title: 'Acceleration',
    align: 'center',
    children: [
      { title: 'Max (RPM/s)', value: 'maxAccel' },
      { title: 'Time (s)', value: 'accelTime' },
      { title: 'Frame', value: 'accelFrame' }
    ]
  }
]

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
        stats
      })
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
    const speed = Math.abs((values[i] - values[i-1]) / dt) / 6
    if (speed > maxSpeed) {
      maxSpeed = speed
      maxSpeedFrame = i
    }
  }

  for (let i = 2; i < values.length; i++) {
    const accel = Math.abs((values[i] - 2*values[i-1] + values[i-2]) / (dt*dt)) / 6
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
</script>

<template>
  <v-container>
    <div class="d-flex w-100 justify-space-between align-center"><h1>NAM Choreo Analyzer</h1><img src="/logo.png" width="32" height="32"/></div>
    <p>Select one or multiple .txt files exported from C4D</p>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-file-input
          label="Select TXT Files"
          multiple
          accept=".txt"
          @change="handleFiles"
          outlined
        />
      </v-col>
    </v-row>

    <v-row v-if="results.length">
      <v-col cols="12" v-for="result in results" :key="result.fileName">
        <v-card class="mb-4">
          <v-card-title>{{ result.fileName }}</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="result.stats.map((s, i) => ({
                column: columns[i],
                maxSpeed: s.maxSpeed,
                speedTime: frameToTimestamp(s.maxSpeedFrame),
                speedFrame: s.maxSpeedFrame,
                maxAccel: s.maxAccel,
                accelTime: frameToTimestamp(s.maxAccelFrame),
                accelFrame: s.maxAccelFrame
              }))"
              class="elevation-1"
              dense
              hide-default-footer
             
            >
              <template #item.maxSpeed="{ item }">
                <span :class="{'red--text': item.maxSpeed > 80}">
                  {{ item.maxSpeed.toFixed(2) }}
                </span>
              </template>
              <template #item.maxAccel="{ item }">
                <span :class="{'red--text': item.maxAccel > 70}">
                  {{ item.maxAccel.toFixed(2) }}
                </span>
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
</style>
