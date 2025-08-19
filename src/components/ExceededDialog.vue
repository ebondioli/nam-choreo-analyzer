<script setup>
import { frameToTimestamp } from '../utils/stats.js'

const props = defineProps({
    modelValue: Boolean,
    dialogData: Object,
    unit: String
})
defineEmits(['update:modelValue'])
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="500" @update:modelValue="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title>
                {{ dialogData.column }} - {{ dialogData.type }} Exceeded Frames
            </v-card-title>
            <v-card-text>
                <v-list v-if="dialogData.frames.length">
                    <v-list-item v-for="(interval, idx) in dialogData.frames" :key="idx">
                        <template v-if="interval[0] === interval[1]">
                            Frame {{ interval[0] }} ({{ frameToTimestamp(interval[0]) }}) — <span class="red--text"> {{
                                interval[2].toFixed(2) }} {{props.unit}}</span>
                        </template>
                        <template v-else>
                            Frames {{ interval[0] }} - {{ interval[1] }}
                            ({{ frameToTimestamp(interval[0]) }} → {{ frameToTimestamp(interval[1]) }})
                            — <span class="red--text">{{ interval[2].toFixed(2) }} {{props.unit}}</span>
                        </template>
                    </v-list-item>
                </v-list>
                <div v-else>No frames exceeded the limit</div>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="$emit('update:modelValue', false)">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
