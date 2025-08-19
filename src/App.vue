<script setup>
import { ref } from 'vue'
import { parseSection } from './utils/parser.js'
import { calculateStats } from './utils/stats.js'
import ResultTable from './components/ResultTable.vue'

const results = ref([])
const exportFPS = ref(25)
const columns = ['Rotation', 'Left Arm', 'Right Arm']
const limits = {
  Rotation: { speed: 80, accel: 70 },
  'Left Arm': { speed: 800, accel: 200 },
  'Right Arm': { speed: 800, accel: 200 }
}

function handleFiles(event) {
  results.value = []
  Array.from(event.target.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target.result
      const rotStructure = parseSection(content, 'Rotation_Structure')
      const rotLeftArm = parseSection(content, 'rotation_leftArm')
      const rotRightArm = parseSection(content, 'Rotation_RightArm')

      if (!rotStructure || !rotLeftArm || !rotRightArm) {
        console.warn(`Skipping file ${file.name} - missing sections.`)
        return
      }

      const frames = Array.from(rotStructure.keys()).sort((a, b) => a - b)
      const maps = {
        Rotation: rotStructure,
        'Left Arm': rotLeftArm,
        'Right Arm': rotRightArm
      }

      const stats = Object.keys(maps).map(col =>
        calculateStats(maps[col], frames, col, limits)
      )

      results.value.push({ fileName: file.name, stats, frames, maps })
      results.value.sort((a, b) => a.fileName.localeCompare(b.fileName))
    }
    reader.readAsText(file)
  })
}
</script>

<template>
  <v-container>
    <div class="d-flex w-100 justify-space-between align-center">
      <h1>NAM Choreo Analyzer</h1>
      <img src="/logo.png" width="32" height="32" />
    </div>
    <p>Select one or multiple .txt files exported from C4D</p>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-file-input label="Select TXT Files" multiple accept=".txt" @change="handleFiles" outlined />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model.number="exportFPS" type="number" label="CSV Export FPS" min="1" outlined />
      </v-col>
    </v-row>

    <v-row v-if="results.length">
      <v-col cols="12" v-for="result in results" :key="result.fileName">
        <ResultTable :result="result" :columns="columns" :limits="limits" />
      </v-col>
    </v-row>
  </v-container>
</template>
