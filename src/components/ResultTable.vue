<script setup>
import { ref } from 'vue'
import { downloadCSV } from '../utils/download'
import { frameToTimestamp, groupFramesIntoIntervals } from '../utils/stats'
import ExceededDialog from './ExceededDialog.vue'
import MappingDialog from './MappingDialog.vue'

const props = defineProps({
  result: Object,
  columns: Array,
  limits: Object
})

const limitsDialog = ref(false)
const limitsDialogData = ref({ column: "", type: "", frames: [] })

const mappingDialog = ref(false)
const mappingDialogData = ref(null)

function openLimitsDialog(column, type, frames) {
  limitsDialogData.value = {
    column,
    type,
    frames: groupFramesIntoIntervals(frames)
  }
  limitsDialog.value = true
}

function openMappingDialog(result) {
  mappingDialogData.value = result
  mappingDialog.value = true
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex w-100 justify-space-between">
      <div class="mt-2">
        {{ result.fileName }}
      </div>
      <div>
        <div class="text-caption d-flex justify-end align-center mb-1">
          Assigned to: <v-chip class="ml-1" size="small" :color="module < 0 ? 'secondary' : 'primary'"
            v-for="module in $store.state.mapping[result.fileName]">{{ Math.abs(module) }}</v-chip>
        </div>
        <div class="text-caption d-flex justify-end align-center">
          <v-btn small prepend-icon="mdi-download" color="secondary" class="mr-2"
            @click="downloadCSV(result)">CSV</v-btn>
          <v-btn small prepend-icon="mdi-format-list-checks" color="primary" @click="openMappingDialog(result)">Assign
            Modules</v-btn>
        </div>
      </div>
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
              </span>
              <span v-if="item.maxSpeed > limits[item.column].speed"> (max {{ limits[item.column].speed }})</span>
            </td>
            <td>{{ item.speedTime }}</td>
            <td>
              <v-btn small text @click="openLimitsDialog(item.column, 'speed', item.exceededSpeedFrames)">
                {{ item.speedFrame }}
              </v-btn>
            </td>
            <td class="accel-cell">
              <span :class="{ 'red--text': item.maxAccel > limits[item.column].accel }">
                {{ item.maxAccel.toFixed(2) }}
              </span>
              <span v-if="item.maxAccel > limits[item.column].accel"> (max {{ limits[item.column].accel }})</span>
            </td>
            <td class="accel-cell">{{ item.accelTime }}</td>
            <td class="accel-cell">
              <v-btn small text @click="openLimitsDialog(item.column, 'accel', item.exceededAccelFrames)">
                {{ item.accelFrame }}
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card-text>

    <ExceededDialog v-model="limitsDialog" :dialogData="limitsDialogData"
      :unit="limitsDialogData.type === 'speed' ? 'RPM' : 'RPM/s'" :limits="limits[limitsDialogData.column]" />
    <MappingDialog v-model="mappingDialog" :dialogData="mappingDialogData" />
  </v-card>
</template>

<style scoped>
.accel-cell {
  background-color: #1e1e1e;
}
</style>
