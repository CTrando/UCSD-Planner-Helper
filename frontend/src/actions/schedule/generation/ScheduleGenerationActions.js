import {DataFetcher} from "../../../utils/DataFetcher";
import {DataCleaner} from "../../../utils/DataCleaner";
import {setClassData, setCurrentSchedule} from "../ScheduleActions";

export const START_GENERATING = 'START_GENERATING';
export const GENERATE_SCHEDULE = "GENERATE_SCHEDULE";
export const FINISH_GENERATING = 'FINISH_GENERATING';
export const SET_GENERATION_RESULT = "SET_GENERATION_RESULT";
export const SET_TOTAL_POSSIBLE_NUM_SCHEDULE = "SET_TOTAL_POSSIBLE_NUM_SCHEDULE";
export const INCREMENT_PROGRESS = "INCREMENT_PROGRESS";
export const SET_PROGRESS = "SET_PROGRESS";

export function startGenerating() {
    return {
        type: START_GENERATING,
        generating: true,
    }
}

export function finishedGenerating() {
    return {
        type: FINISH_GENERATING,
        generating: false,
    }
}

export function updateWithResult(result) {
    return function (dispatch) {
        dispatch(setGenerationResult(result));

        if(result.schedules.length > 0)
            dispatch(setCurrentSchedule(result.schedules[0]));
        else dispatch(setCurrentSchedule([]));
    }
}

export function setGenerationResult(result) {
    return {
        type: SET_GENERATION_RESULT,
        generationResult: result,
    }
}

export function incrementProgress(val) {
    return {
        type: INCREMENT_PROGRESS,
        amount: val
    }
}

export function setProgress(generatingProgress) {
    return {
        type: SET_PROGRESS,
        generatingProgress: generatingProgress
    }
}


export function generateSchedule(classData, classTypesToIgnore, preferences, totalNumPossibleSchedule) {
    return {
        type: GENERATE_SCHEDULE,
        classData: classData,
        classTypesToIgnore: classTypesToIgnore,
        preferences: preferences,
        totalNumPossibleSchedule: totalNumPossibleSchedule
    }
}


export function setTotalPossibleNumSchedule(num) {
    return {
        type: SET_TOTAL_POSSIBLE_NUM_SCHEDULE,
        totalNumPossibleSchedule: num
    }
}

export class ScheduleGeneratorPreprocessor {
    constructor(dispatch, getState) {
        this.dispatch = dispatch;
        this.getState = getState;

        if (!dispatch)
            console.error("Dispatch is null, failing");
        if (!getState)
            console.error("getState is null, failing");

        // setting selected class to only the values of the one from the state
        this.selectedClasses = Object.values(this.getState().ClassList.selectedClasses);
    }

    processProgressBar() {
        this.dispatch(setProgress(0));

        // putting number of possible schedules
        let size = this.calculateMaxSize();

        this.totalNumPossibleSchedule = size;
        console.log(`Total number of possible schedules is ${size}`);
        // this is for progress bar purposes
        this.dispatch(setTotalPossibleNumSchedule(size));
    }

    processPreferences() {
        let schedulePreferences = this.getState().SchedulePreferences;
        let {globalPref, classSpecificPref} = schedulePreferences;

        // filtering class specific preferences based on those the user selected
        // this is because when removing a class, instead of having to deal with removing preferences, just let them be
        classSpecificPref = this.handleClassSpecificPreferences(this.selectedClasses, classSpecificPref);

        this.preferences = {
            globalPref: globalPref,
            classSpecificPref: classSpecificPref
        }
    }

    async processClassData() {
        let classData = await DataFetcher.fetchClassData(this.selectedClasses);
        // will put the data into
        // CSE 11 -> section 0 [subsection, subsection], section 1 [subsection, subsection]
        classData = DataCleaner.cleanData(classData);

        this.classData = classData;
    }

    processClassTypesToIgnore() {
        console.log("HERE");
        console.log(this.getState().IgnoreClassTypes);
        this.classTypesToIgnore = this.getState().IgnoreClassTypes.classMapping;
    }

    calculateMaxSize() {
        return this.classData.reduce((accum, cur) => {
            if (!cur) {
                console.warn("Class is null in calculating max size");
                return accum;
            }

            if (!cur.sections) {
                console.warn(`Class ${cur.title} has no sections array!`);
                return accum;
            }

            if (cur.sections.length === 0) {
                console.warn(`Class ${cur.title} has no sections!`);
                return accum;
            }
            return accum * cur.sections.length;
        }, 1);
    }

    handleClassSpecificPreferences(selectedClasses, classSpecificPref) {
        let classTitles = selectedClasses.map(e => e.classTitle);

        return classTitles.reduce((accum, cur) => {
            return {
                ...accum,
                [cur]: classSpecificPref[cur]
            }
        }, {})
    }

    async preprocess() {
        await this.processClassData();
        this.processPreferences();
        this.processClassTypesToIgnore();
        this.processProgressBar();

        return {
            classData: this.classData,
            preferences: this.preferences,
            classTypesToIgnore: this.classTypesToIgnore,
            totalNumPossibleSchedule: this.totalNumPossibleSchedule,
        }
    }
}

/**
 * This is in redux so we have hooks that determine the progress of generating the generationResult *
 * @returns {Function}
 */
// in the future, consider adding default parameters for an IT test here
export function getSchedule() {
    return async function (dispatch, getState) {
        console.log("Beginning generation");
        // let redux know that we are creating a generationResult
        dispatch(startGenerating());
        let {classData, classTypesToIgnore, preferences, totalNumPossibleSchedule} = await new ScheduleGeneratorPreprocessor(dispatch, getState).preprocess();

        // setting data for future use
        dispatch(setClassData(classData));

        // tell middleware we want to create a generationResult with an action
        // this will allow the web worker to take over
        dispatch(generateSchedule(classData, classTypesToIgnore, preferences, totalNumPossibleSchedule));
    }
}
