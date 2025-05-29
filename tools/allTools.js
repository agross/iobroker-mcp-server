import { getAdapters } from "./getAdapters.js"
import { getRunningInstances } from "./getInstances.js"
import { search } from "./search.js"
import { getState } from "./getState.js"
import { setState } from "./setState.js"
import { getStatesWithValues } from "./getStatesWithValues.js"  
import { describe } from "./describe.js"
import { anotate } from "./anotate.js"
import { setStateBulk } from "./setStateBulk.js"
import { createState } from "./createState.js"
import { createScene } from "./createScene.js"
import { setObject } from "./setObject.js"
import { searchDB } from "./searchDB.js"
import { getAllRooms } from "./getAllRooms.js"
import { getAllObjectsInRoom } from "./getAllObjectsInRoom.js"
import { getHistory } from "./getHistory.js"
export const Tools = {
    getAdapters,
    getRunningInstances,
    search,
    getState,
    setState,
    getStatesWithValues,
    describe,
    anotate,
    setStateBulk,
    createState,
    createScene,
    setObject,
    searchDB,
    getAllRooms,
    getAllObjectsInRoom,
    getHistory,
    // Add other tools here as needed
}