import {
    setCourseNum,
    setCourseNums,
    setDepartment,
    setEditOccurred,
    setInstructor,
    setInstructors,
    setPriority,
    setTransactionID,
    setTypes
} from "./ClassInputMutator";
import {addClass, editClass, enterInputMode, populateSectionData, removeClass} from "./ClassInputActions";
import {SchedulePreferenceInputHandler} from "../schedulepreference/SchedulePreferenceInputHandler";
import {ignoreClassTypeCodes} from "../class_types/ignore/IgnoreClassTypesActions";
import {getSchedule} from "../schedule/generation/ScheduleGenerationActions";
import {TESTING_viewClassTypeCodes} from "../class_types/view/ViewClassTypesActions";

/**
 * Is responsible for handling all ClassInput actions, which includes running business logic when changing fields to adding
 * and removing classes
 */
export class ClassInputHandler {
    constructor(dispatch, getState) {
        this.dispatch = dispatch;
        this.getState = getState;
    }

    /**
     * Edits the department and runs business rule validation on it
     */
    onDepartmentChange(rawDepartment, triggers = true) {
        if (!rawDepartment) {
            this.dispatch(setDepartment(null));
            return;
        }

        const state = this.getState().ClassInput;
        let department = rawDepartment.trim();

        // sets the department in the store
        this.dispatch(setDepartment(department));

        if (!triggers)
            return;

        // don't alter anything if the department isn't even valid
        if (!state.departments.includes(department))
            return;

        // set all other fields to blank
        this.dispatch(setCourseNum(null));
        this.dispatch(setInstructor(null));
        // will autoconvert to empty list
        this.dispatch(setPriority(null));

        // if (state.editMode)
        //     this.autosave(true);
        // populate the course nums and the data
        return this.dispatch(populateSectionData(department));
    }


    onCourseNumChange(rawCourseNum, triggers = true) {
        if (!rawCourseNum) {
            this.dispatch(setCourseNum(null));
            return;
        }

        const state = this.getState().ClassInput;
        let courseNum = rawCourseNum.trim();
        this.dispatch(setCourseNum(courseNum));

        if (!triggers)
            return;

        if (!state.courseNums.includes(courseNum))// && state.courseNums.length > 0)
            return;

        const instructors = state.instructorsPerClass[courseNum];
        if (!instructors)
            console.warn(`Instructors are undefined for course num ${courseNum}`);

        const types = state.classTypesPerClass[courseNum];
        if (!types)
            console.warn(`Class Types are undefined for course num ${courseNum}`);

        // must clear out the fields
        this.dispatch(setInstructor(null));
        this.dispatch(setPriority(null));
        this.dispatch(setTypes(types));
        this.dispatch(setInstructors(instructors));

        // autosave after everything else has been set
        // if (state.editMode)
        //     this.autosave(true);
    }

    onInstructorChange(rawInstructor) {
        const state = this.getState().ClassInput;
        if (!rawInstructor) {
            this.dispatch(setInstructor(null));
            if (state.editMode)
                this.autosave(true);
            return;
        }

        let instructor = rawInstructor.trim();
        this.dispatch(setInstructor(instructor));

        if (!state.instructors.includes(instructor))
            return;

        // only record valid edits
        if (state.editMode)
            this.autosave(true);

        this.dispatch(setPriority(null));
    }

    onIgnoreClassTypes(types) {
        const state = this.getState().ClassInput;
        const classTitle = `${state.department} ${state.courseNum}`;

        this.dispatch(ignoreClassTypeCodes(classTitle, types));
    }

    onViewClassTypes(types) {
        const state = this.getState().ClassInput;
        const classTitle = `${state.department} ${state.courseNum}`;

        this.dispatch(TESTING_viewClassTypeCodes(classTitle, types));
    }

    buildClassFromInput() {
        const state = this.getState().ClassInput;
        // should refactor this into ClassSkeleton
        return Object.assign({},
            {
                classTitle: `${state.department} ${state.courseNum}`,
                courseNum: state.courseNum,
                department: state.department,
                instructor: state.instructor,
                priority: state.priority,

                instructors: state.instructors,
                types: state.types,

                transactionID: state.transactionID
            }
        );
    }

    isValidAdd(newClass) {
        const state = this.getState().ClassInput;
        if (this.isDuplicate(newClass))
            return {
                valid: false,
                reason: `Class ${state.department} ${state.courseNum} has already been added!`
            };
        return this.isValid(newClass);
    }

    isValidEdit(newClass) {
        const state = this.getState().ClassInput;
        const classList = this.getState().ClassList;

        let oldClass = classList.selectedClasses[state.transactionID];

        if (this.isDuplicate(newClass, state.transactionID)) {
            return {
                valid: false,
                reason: `Class ${state.department} ${state.courseNum} has already been added!`
            };
        } else if (oldClass.classTitle !== newClass.classTitle) {
            return {
                valid: false,
                reason: `Cannot edit department or course number. To edit, please remove the class and add a new one in.`
            }
        }

        return this.isValid(newClass);
    }

    /**
     * Returns whether a class is valid or not as long as the reason it is not if so
     * @param newClass the class to check
     * @returns {valid, reason}
     */
    isValid(newClass) {
        const state = this.getState().ClassInput;
        if (!state.departments.includes(newClass.department))
            return {
                valid: false,
                reason: "Department is not valid"
            };
        if (!state.courseNums.includes(newClass.courseNum))
            return {
                valid: false,
                reason: "Course Num is not valid"
            };
        if (newClass.instructor && !state.instructors.includes(newClass.instructor))
            return {
                valid: false,
                reason: "Instructor is not valid"
            };
        if (this.isDuplicate(newClass)) {

        }

        return {
            valid: true
        };
    }

    /**
     * Called in editMode such that whenever the user makes an edit, any changes are saved to the store
     */
    autosave(force = false) {
        const state = this.getState().ClassInput;
        if (force || (state.editMode && state.editOccurred)) {
            console.log("Autosaving class...");
            // just save everything
            let newClass = this.buildClassFromInput();

            let {valid, reason} = this.isValidEdit(newClass);
            if (!valid) {
                return `Failed to edit class. Reason: ${reason}`;
            }

            this.dispatch(setEditOccurred(false));
            this.dispatch(editClass(state.transactionID, newClass));
            this.savePreferences();
        }
    }

    handleEdit() {
        const state = this.getState().ClassInput;
        let errMsg = this.autosave(true);
        if (errMsg)
            state.messageHandler.showError(errMsg, 1000);

        this.dispatch(enterInputMode());
        // TODO check if this is a significant change, and if it is then regenerate schedule
        this.dispatch(getSchedule());
    }

    /**
     * Handle what occurs when the remove button is hit during edit mode
     *
     * If the user has edited some of the fields such that the department and courseNum are no longer valid, then just
     * say remove, otherwise if the class was valid then output a message with the department and courseNum
     */
    handleRemove() {
        const state = this.getState().ClassInput;

        if (!state.editMode) {
            console.warn("Somehow, the user was able to trigger class removal without being in edit mode, breaking now.");
            return;
        }

        if (state.departments.includes(state.department) && state.courseNums.includes(state.courseNum))
            state.messageHandler.showSuccess(`Removed class ${state.department} ${state.courseNum}`, 2000);
        else state.messageHandler.showSuccess("Successfully removed class", 2000);

        this.dispatch(removeClass(state.transactionID));
        this.dispatch(enterInputMode());
        this.dispatch(getSchedule());
    }

    /**
     * Checks if a class is already in the store
     * @param newClass the class to check for duplicates
     * @param exclude class id to exclude - we are using this because in an edit, the class we want is already in the store
     * @returns boolean the store contains the given class already
     */
    isDuplicate(newClass, exclude = "") {
        let state = this.getState().ClassList;

        if (typeof exclude !== "string")
            console.warn(`The given key ${exclude} is of type ${typeof exclude} instead of string, continuing`);

        return Object.keys(state.selectedClasses).reduce(function (accumulator, key) {
            if (exclude === key)
                return accumulator;
            return accumulator || newClass.classTitle === state.selectedClasses[key]['classTitle']
        }, false);
    }

    setDefaultValues(newClass) {
        const state = this.getState().ClassInput;
        this.dispatch(ignoreClassTypeCodes(newClass.classTitle, state.types));
        this.dispatch(TESTING_viewClassTypeCodes(newClass.classTitle, state.types));
    }

    clearInputs() {
        // nulling out the other fields
        this.dispatch(setInstructor(null));
        this.dispatch(setCourseNum(null));
        this.dispatch(setPriority(null));
        this.dispatch(setTransactionID(null));
    }

    handleAdd() {
        const state = this.getState().ClassInput;
        // gotta have course num and department to do anything
        // checking for both null and undefined
        if (!state.courseNum || !state.department)
            return;

        let newClass = this.buildClassFromInput();

        let {valid, reason} = this.isValidAdd(newClass);
        if (!valid) {
            state.messageHandler.showError(`Failed to add class. Reason: ${reason}`, 1000);
            return;
        }

        this.setDefaultValues(newClass);
        // using the addClass method from the reducer
        this.dispatch(addClass(newClass, state.transactionID));
        this.savePreferences();
        this.clearInputs();
    }

    clear() {
        this.dispatch(setDepartment(null));
        this.dispatch(setInstructor(null));
        this.dispatch(setCourseNum(null));
        this.dispatch(setPriority(null));

        this.dispatch(setCourseNums(null));
        this.dispatch(setInstructors(null));
        this.dispatch(setTypes(null));

        // null out this transaction
        this.dispatch(setTransactionID(null));
    }

    /**
     * Saves the preferences in the class
     */
    savePreferences() {
        // TODO this is terrible gotta fix this, why create an object like this?
        let inputHandler = new SchedulePreferenceInputHandler(this.dispatch, this.getState);
        inputHandler.setClassSpecificPref();
    }
}

export function getInputHandler(dispatch = null, getState = null) {
    // overloading so can be used by redux and outside of redux as well
    if (dispatch && getState)
        return new ClassInputHandler(dispatch, getState);

    return function (dispatch, getState) {
        return new ClassInputHandler(dispatch, getState);
    }
}
