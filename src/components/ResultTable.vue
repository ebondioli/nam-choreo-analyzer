<script setup>
import { ref } from 'vue'
import { downloadCSV } from '../utils/download'
import { frameToTimestamp, groupFramesIntoIntervals } from '../utils/stats'
import ExceededDialog from './ExceededDialog.vue'

const props = defineProps({
  result: Object,
  columns: Array,
  limits: Object,
  fps: Number
})

const dialog = ref(false)
const dialogData = ref({ column: "", type: "", frames: [] })

function openDialog(column, type, frames) {
  dialogData.value = {
    column,
    type,
    frames: groupFramesIntoIntervals(frames)
  }
  dialog.value = true
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex w-100 justify-space-between align-center">
      {{ result.fileName }}
      <v-btn small color="primary" @click="downloadCSV(result, fps)">Download CSV</v-btn>
    </v-card-title>

    <v-card-text>
      <v-data-table :items="result.stats.map((s, i) => ({
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
        <!-- Custom headers (same as your original code) -->
        <template #headers>
          <tr>
            <th class="v-data-table__td v-data-table-column--align-start v-data-table__th" rowspan="2">
              <div class="v-data-table-header__content"><span>Element</span></div>
            </th>
            <th class="v-data-table__td v-data-table-column--align-center v-data-table__th" colspan="3">
              <div class="v-data-table-header__content"><span>Speed</span></div>
            </th>
            <th class="v-data-table__td v-data-table-column--align-center v-data-table__th accel-cell" colspan="3">
              <div class="v-data-table-header__content"><span>Acceleration</span></div>
            </th>
          </tr>
          <tr>
            <th>
              <div class="v-data-table-header__content"><span>Max (RPM)</span></div>
            </th>
            <th>
              <div class="v-data-table-header__content"><span>Time</span></div>
            </th>
            <th>
              <div class="v-data-table-header__content"><span>Frame</span></div>
            </th>
            <th class="accel-cell">
              <div class="v-data-table-header__content"><span>Max (RPM/s)</span></div>
            </th>
            <th class="accel-cell">
              <div class="v-data-table-header__content"><span>Time</span></div>
            </th>
            <th class="accel-cell">
              <div class="v-data-table-header__content"><span>Frame</span></div>
            </th>
          </tr>
        </template>

        <!-- Custom row rendering (same style as your original code) -->
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
              <v-btn small text @click="openDialog(item.column, 'speed', item.exceededSpeedFrames)">
                {{ item.speedFrame }}
              </v-btn>
            </td>
            <td class="accel-cell">
              <span :class="{ 'red--text': item.maxAccel > limits[item.column].accel }">
                {{ item.maxAccel.toFixed(2) }}
                <span v-if="item.maxAccel > limits[item.column].accel"> ({{ limits[item.column].accel }})</span>
              </span>
            </td>
            <td class="accel-cell">{{ item.accelTime }}</td>
            <td class="accel-cell">
              <v-btn small text @click="openDialog(item.column, 'acceleration', item.exceededAccelFrames)">
                {{ item.accelFrame }}
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card-text>

    <ExceededDialog v-model="dialog" :dialogData="dialogData" :unit="dialogData.type === 'speed' ? 'RPM' : 'RPM/s'" />
  </v-card>
</template>

<style scoped>
.accel-cell {
  background-color: #1e1e1e;
}
</style>
