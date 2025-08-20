<script setup>
import { nextTick, ref, watch } from 'vue';
import store from '../store';

const props = defineProps({
    modelValue: Boolean,
    dialogData: Object
})
defineEmits(['update:modelValue'])

const mapEl = ref(null)
const modulesMap = ref([])
let modules = {}

watch(() => props.modelValue, val => {
    nextTick(() => {
        const els = Array.from(mapEl.value.querySelectorAll('#modules>g'))
        modules = {}
        els.forEach(el => {
            const match = el.id.match(/module-(\d+)/)
            if (match) {
                modules[parseInt(match[1])] = false
            }
        })
    })
})

function toggleModule(id) {
    const file = props.dialogData.fileName
    const mapping = { ...store.state.mapping }
    const list = mapping[file] || []

    if (list.includes(id)) {
        // currently active → turn into mirrored
        mapping[file] = list.map(mid => mid === id ? -id : mid)
    } else if (list.includes(-id)) {
        // currently mirrored → remove (none)
        mapping[file] = list.filter(mid => mid !== -id)
    } else {
        // none → add as active
        mapping[file] = [...list, id]
    }

    store.commit('SET_MAPPING', mapping)
}

function getState(id) {
    const list = store.state.mapping[props.dialogData.fileName] || []
    if (list.includes(id)) return 'active'
    if (list.includes(-id)) return 'mirrored'
    return 'none'
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="500" @update:modelValue="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="text-center">
                Assign <span class="text-primary">{{dialogData.fileName}}</span> To Modules
            </v-card-title>
            <v-card-text>
                <div class="d-flex justify-center mb-4 pb-4 border-b-thin">
                    <div class="pa-1 text-caption mr-2 legend active">Assigned</div>
                    <div class="pa-1 text-caption mr-2 legend mirrored">Mirrored</div>
                    <div class="pa-1 text-caption mr-2 legend unassigned">Unassigned</div>
                </div>
                <svg id="nam-map" data-name="nam-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 753.14 457.27"
                    ref="mapEl">
                    <g id="modules">


                        <g id="module-1" :class="getState(1)" @click="toggleModule(1)">
                            <circle class="cls-2" cx="376.51" cy="22.48" r="22.48" />
                            <text class="cls-1" transform="translate(371.38 27.47)">
                                <tspan x="0" y="0">1</tspan>
                            </text>
                        </g>
                        <g id="module-3" :class="getState(3)" @click="toggleModule(3)">
                            <circle class="cls-2" cx="481.14" cy="63.87" r="22.48" />
                            <text class="cls-1" transform="translate(478.05 68.55)">
                                <tspan x="0" y="0">3</tspan>
                            </text>
                        </g>
                        <g id="module-4" :class="getState(4)" @click="toggleModule(4)">
                            <circle class="cls-2" cx="120.51" cy="104.25" r="22.48" />
                            <text class="cls-1" transform="translate(115.38 108.93)">
                                <tspan x="0" y="0">4</tspan>
                            </text>
                        </g>
                        <g id="module-5" :class="getState(5)" @click="toggleModule(5)">
                            <circle class="cls-2" cx="632.51" cy="104.25" r="22.48" />
                            <text class="cls-1" transform="translate(627.38 108.93)">
                                <tspan x="0" y="0">5</tspan>
                            </text>
                        </g>
                        <g id="module-6" :class="getState(6)" @click="toggleModule(6)">
                            <circle class="cls-2" cx="163.43" cy="207.37" r="22.48" />
                            <text class="cls-1" transform="translate(158.3 214.04)">
                                <tspan x="0" y="0">6</tspan>
                            </text>
                        </g>
                        <g id="module-10" :class="getState(10)" @click="toggleModule(10)">
                            <circle class="cls-2" cx="589.84" cy="207.37" r="22.48" />
                            <text class="cls-1" transform="translate(579.58 214.04)">
                                <tspan x="0" y="0">10</tspan>
                            </text>
                        </g>
                        <g id="module-8" :class="getState(8)" @click="toggleModule(8)">
                            <circle class="cls-2" cx="376" cy="213.46" r="22.48" />
                            <text class="cls-1" transform="translate(370.87 218.93)">
                                <tspan x="0" y="0">8</tspan>
                            </text>
                        </g>
                        <g id="module-9" :class="getState(9)" @click="toggleModule(9)">
                            <circle class="cls-2" cx="484.7" cy="174.6" r="22.48" />
                            <text class="cls-1" transform="translate(479.6 179.25)">
                                <tspan x="0" y="0">9</tspan>
                            </text>
                        </g>
                        <g id="module-7" :class="getState(7)" @click="toggleModule(7)">
                            <circle class="cls-2" cx="269.33" cy="174.6" r="22.48" />
                            <text class="cls-1" transform="translate(264.2 179.25)">
                                <tspan x="0" y="0">7</tspan>
                            </text>
                        </g>
                        <g id="module-11" :class="getState(11)" @click="toggleModule(11)">
                            <circle class="cls-2" cx="22.48" cy="279.37" r="22.48" />
                            <text class="cls-1" transform="translate(12.22 284.04)">
                                <tspan x="0" y="0">11</tspan>
                            </text>
                        </g>
                        <g id="module-12" :class="getState(12)" @click="toggleModule(12)">
                            <circle class="cls-2" cx="171.81" cy="317.08" r="22.48" />
                            <text class="cls-1" transform="translate(161.55 321.76)">
                                <tspan x="0" y="0">12</tspan>
                            </text>
                        </g>
                        <g id="module-13" :class="getState(13)" @click="toggleModule(13)">
                            <circle class="cls-2" cx="279.37" cy="324.32" r="22.48" />
                            <text class="cls-1" transform="translate(267.39 328.99)">
                                <tspan x="0" y="0">13</tspan>
                            </text>
                        </g>
                        <g id="module-14" :class="getState(14)" @click="toggleModule(14)">
                            <circle class="cls-2" cx="473.52" cy="324.32" r="22.48" />
                            <text class="cls-1" transform="translate(463.26 328.61)">
                                <tspan x="0" y="0">14</tspan>
                            </text>
                        </g>
                        <g id="module-15" :class="getState(15)" @click="toggleModule(15)">
                            <circle class="cls-2" cx="581.33" cy="317.08" r="22.48" />
                            <text class="cls-1" transform="translate(571.07 324.36)">
                                <tspan x="0" y="0">15</tspan>
                            </text>
                        </g>
                        <g id="module-17" :class="getState(17)" @click="toggleModule(17)">
                            <circle class="cls-2" cx="129.52" cy="420.7" r="22.48" />
                            <text class="cls-1" transform="translate(119.26 425.37)">
                                <tspan x="0" y="0">17</tspan>
                            </text>
                        </g>
                        <g id="module-18" :class="getState(18)" @click="toggleModule(18)">
                            <circle class="cls-2" cx="301.84" cy="434.79" r="22.48" />
                            <text class="cls-1" transform="translate(291.58 439.47)">
                                <tspan x="0" y="0">18</tspan>
                            </text>
                        </g>
                        <g id="module-19" :class="getState(19)" @click="toggleModule(19)">
                            <circle class="cls-2" cx="451.05" cy="434.79" r="22.48" />
                            <text class="cls-1" transform="translate(438.89 439.47)">
                                <tspan x="0" y="0">19</tspan>
                            </text>
                        </g>
                        <g id="module-20" :class="getState(20)" @click="toggleModule(20)">
                            <circle class="cls-2" cx="624" cy="420.7" r="22.48" />
                            <text class="cls-1" transform="translate(613.74 426.57)">
                                <tspan x="0" y="0">20</tspan>
                            </text>
                        </g>
                        <g id="module-16" :class="getState(16)" @click="toggleModule(16)">
                            <circle class="cls-2" cx="730.67" cy="279.37" r="22.48" />
                            <text class="cls-1" transform="translate(720.41 284.04)">
                                <tspan x="0" y="0">16</tspan>
                            </text>
                        </g>
                        <g id="module-2" :class="getState(2)" @click="toggleModule(2)">
                            <circle class="cls-2" cx="271.37" cy="63.87" r="22.48" />
                            <text class="cls-1" transform="translate(266.24 68.55)">
                                <tspan x="0" y="0">2</tspan>
                            </text>
                        </g>
                    </g>
                </svg>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="$emit('update:modelValue', false)">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss">
#nam-map {
    .cls-2 {
        fill: #494949;
        cursor: pointer;
    }

    .cls-1 {
        fill: #fff;
        user-select: none;
        cursor: pointer;
    }

    .active .cls-2 {
        fill: #2196f3;
        opacity: 1;
    }

    .mirrored .cls-2 {
        fill: #54b6b2;
        opacity: 1;
    }

}

.legend {
    border-radius: 1rem;

    &.active {
        background-color: #2196f3;
    }

    &.mirrored {
        background-color: #54b6b2;
    }

    &.unassigned {
        background-color: #494949;
    }

}
</style>