import { createStore } from "vuex";

const store = createStore({
    state: {
        results: [],
        mapping: {}
    },
    mutations: {
        SET_RESULTS(state, data) {
            state.results = data;
        },
        SET_MAPPING(state, data) {
            state.mapping = data;
        }
    }
})

export default store