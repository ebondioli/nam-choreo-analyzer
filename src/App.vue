<script setup>
import { ref } from 'vue'
import { parseSection } from './utils/parser.js'
import { calculateStats } from './utils/stats.js'
import ResultTable from './components/ResultTable.vue'
import store from './store.js'
import { createFullChoreography } from './utils/download.js'

const results = ref([])
const exportFPS = ref(25)
const columns = ['Rotation', 'Left Arm', 'Right Arm']
const limits = {
  Rotation: { speed: 80, accel: 70 },
  'Left Arm': { speed: 800, accel: 200 },
  'Right Arm': { speed: 800, accel: 200 }
}
const mirroredMappings = [3, 5, 9, 10, 14, 15, 16, 19, 20]

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
      store.commit('SET_RESULTS', results.value)
      const mapping = {}
      results.value.forEach(r => {
        mapping[r.fileName] = extractDefaultMapping(r.fileName)
      })
      store.commit('SET_MAPPING', mapping)
      console.log(results.value, mapping)

    }
    reader.readAsText(file)
  })
}

function extractDefaultMapping(fileName) {
  const match = fileName.match(/For(\d+)/)
  if (!match) return []

  // match[1] is the digits after "For"
  const digits = match[1]

  // split into 2-digit chunks
  const numbers = digits.match(/.{2}/g) || []
  const assignedIds = numbers.map(n => {
    n = parseInt(n.trim())
    if (mirroredMappings.includes(n)) return -1 * n
    return n
  })
  return assignedIds
}

function createChoreography() {
  createFullChoreography(store.state.results, store.state.mapping)
}
</script>

<template>
  <v-container>
    <div class="d-flex w-100 justify-space-between align-center">
      <h1>NAM Choreo Parser</h1>
      <img src="/logo.png" width="32" height="32" />
    </div>
    <p>Select one or multiple .txt files exported from C4D</p>

    <v-row class="mt-4">
      <v-col cols="12" :md="results.length ? 8 : 12">
        <v-file-input label="Select TXT Files" multiple accept=".txt" @change="handleFiles" variant="solo-filled"
          chips />
      </v-col>
      <v-col cols="12" md="4" v-if="results.length">
        <v-btn small prepend-icon="mdi-set-merge" color="primary" class="mr-2" @click="createChoreography">Create
          choreography</v-btn>
        <p class="mt-2 text-caption text-medium-emphasis">Creates a single choreography file playing each choreography
          on the modules selected using <strong>Assign Modules</strong></p>
      </v-col>
    </v-row>

    <v-row v-if="results.length">
      <v-col cols="12" v-for="result in results" :key="result.fileName">
        <ResultTable :result="result" :columns="columns" :limits="limits" />
      </v-col>
    </v-row>
  </v-container>
</template>
