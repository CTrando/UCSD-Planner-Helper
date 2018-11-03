import {DayPreference, InstructorPreference, PriorityModifier, TimePreference} from "../utils/Preferences";
import {classTypeToCode, DataFetcher} from "../utils/DataFetcher";
import {Subsection} from "../utils/ClassUtils";


export const REQUEST_SCHEDULE = 'REQUEST_SCHEDULE';

export function requestSchedule() {
    return {
        type: REQUEST_SCHEDULE,
        generating: true,
    }
}

export const RECEIVE_SCHEDULE = 'RECEIVE_SCHEDULE';

export function getGenerationResults(schedule) {
    return {
        type: RECEIVE_SCHEDULE,
        generationResult: schedule,
        generating: false
    }
}

export const SET_UID = "SET_UID";

export function setUID(uid) {
    return {
        type: SET_UID,
        uid: uid,
    }
}

export const INCREMENT_PROGRESS = "INCREMENT_PROGRESS";

export const SET_PROGRESS = "SET_PROGRESS";

export function setProgress(generatingProgress) {
    return {
        type: SET_PROGRESS,
        generatingProgress: generatingProgress
    }
}

export const GENERATE_SCHEDULE = "GENERATE_SCHEDULE";

export function generateSchedule(classData, conflicts, preferences) {
    return {
        type: GENERATE_SCHEDULE,
        classData: classData,
        conflicts: conflicts,
        preferences: preferences
    }
}

export const SET_TOTAL_POSSIBLE_NUM_SCHEDULE = "SET_TOTAL_POSSIBLE_NUM_SCHEDULE";

export function setTotalPossibleNumSchedule(num) {
    return {
        type: SET_TOTAL_POSSIBLE_NUM_SCHEDULE,
        totalNumPossibleSchedule: num
    }
}

/**
 * Populates the preference array with the correct Preference objects.
 *
 * @param Class the class with the preferences
 * @param preferences the array to populate
 */
function handlePriority(Class, preferences) {
    let priority = 1;
    let preferencesToBeModified = [];
    if (Class.priority !== null) {
        priority = Class.priority;
    }

    if (Class.instructor !== null) {
        preferencesToBeModified.push(new InstructorPreference(Class, Class.instructor));
    }

    let priorityModifier = new PriorityModifier(Class, preferencesToBeModified, priority);
    // add preferences to the priority modifier
    preferences.push(priorityModifier);
}

/**
 * Will populate the conflicts object with the correct info about Class -> type conflicts
 *
 * Creates a mapping like so:
 * e.g Class1 -> [LE, DI]
 *     Class2 -> [LA]
 * @param Class the class to consider - has a list of type conflicts
 * @param conflicts the conflicts array to populate
 */
function handleConflicts(Class, conflicts) {
    // class not guaranteed to have conflicts array populated
    if (Class.conflicts) {
        if (!(Class.classTitle in conflicts)) {
            conflicts[Class.classTitle] = [];
        }
        conflicts[Class.classTitle] = Class.conflicts.map((conflict) => classTypeToCode[conflict])
    }
}

function handleSchedulePreferences(schedulePreferences, preferences) {

    if (schedulePreferences.startTimePreference && schedulePreferences.endTimePreference) {
        let startTime = schedulePreferences.startTimePreference.toDate();
        let endTime = schedulePreferences.endTimePreference.toDate();
        preferences.push(new TimePreference(startTime, endTime));
    }

    let days = schedulePreferences.dayPreference;
    if (days) {
        preferences.push(new DayPreference(days));
    }
}

// dirty class data is a 2D array where each element is an array of subsections for each class section
function cleanData(dirtyClassData) {
    let ret = {};
    for (let courseName of Object.keys(dirtyClassData)) {
        ret[courseName] = [];

        let slowPtr = 0;
        let fastPtr = 0;

        let copyCourseData = dirtyClassData[courseName].slice();
        copyCourseData.push({"SECTION_ID": null});

        while (fastPtr < copyCourseData.length) {
            let slowSectionID = copyCourseData[slowPtr]["SECTION_ID"];
            let fastSectionID = copyCourseData[fastPtr]["SECTION_ID"];

            if (slowSectionID !== fastSectionID) {
                // inclusive exclusive for bounds
                let subsectionsPerSection = copyCourseData.slice(slowPtr, fastPtr);
                // converting each one into a subsection
                subsectionsPerSection = subsectionsPerSection.reduce((ret, subsectionData) => {
                    let subsection = new Subsection(subsectionData);
                    if (isValidSubsection(subsection)) {
                        ret.push(subsection);
                    }
                    return ret;

                }, []);

                // we can have issues where all classes are canceled
                if (subsectionsPerSection.length > 0) {
                    ret[courseName].push(subsectionsPerSection);
                }
                slowPtr = fastPtr;
            }

            fastPtr++;
        }
    }
    // no alterations to input
    return ret;
}

function isValidSubsection(subsection) {
    // we don't want to include finals or midterms in the regular week view
    if (subsection.type === "FI" || subsection.type === "MI") {
        return false;
    }
    // if timeInterval is null that means time is TBA and/or day is TBA which means
    // don't include in here
    if (!subsection.timeInterval) {
        return false;
    }
    return true;
}


function calculateMaxSize(classData) {
    return Object.keys(classData).reduce((accum, cur) => {
        return accum * classData[cur].length;
    }, 1);
}

/**
 * This is in redux so we have hooks that determine the progress of generating the generationResult *
 * @param selectedClasses comes in as a dictionary so must convert to a list
 * @returns {Function}
 */
export function getSchedule(selectedClasses) {
    return async function (dispatch, getState) {
        // let redux know that we are creating a generationResult
        dispatch(requestSchedule());

        selectedClasses = Object.values(selectedClasses);


        let preferences = [];
        let conflicts = {};
        // setting progress to 0 initially
        dispatch(setProgress(0));

        let schedulePreferences = getState().SchedulePreferences;
        handleSchedulePreferences(schedulePreferences, preferences);
        // Class has very little data but the names
        // passes in data from UI
        for (let Class of selectedClasses) {
            handlePriority(Class, preferences);
            handleConflicts(Class, conflicts);
        }

        let classData = await DataFetcher.fetchClassData(selectedClasses);
        // will put the data into
        // CSE 11 -> section 0 [subsection, subsection], section 1 [subsection, subsection]
        classData = cleanData(classData);

        // putting number of possible schedules
        let size = calculateMaxSize(classData);
        dispatch(setTotalPossibleNumSchedule(size));
        // tell middleware we want to create a generationResult with an action
        // this will allow the web worker to take over
        dispatch(generateSchedule(classData, conflicts, preferences));
    }
}

