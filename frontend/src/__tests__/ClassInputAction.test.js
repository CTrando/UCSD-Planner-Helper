import React from 'react';
import ClassInputContainer from "../containers/ClassInputContainer";
import {mount, shallow} from "enzyme";
import {
    setConflicts,
    setCourseNum,
    setCourseNums,
    setDepartment,
    setDepartments, setInstructor, setInstructors
} from "../actions/ClassInput/ClassInputMutator";
import {applyMiddleware, createStore} from "redux";
import reducers from "../reducers";
import thunk from "redux-thunk";
import {getInputHandler as getReduxInputHandler} from "../actions/ClassInput/ClassInputHandler";
import ClassInput from "../components/landing/ClassInput";
import {enterEditMode, enterInputMode, populateDataPerClass} from "../actions/ClassInput/ClassInputActions";
import {DataFetcher} from "../utils/DataFetcher";

function getInputHandler(store) {
    let fn = getReduxInputHandler();
    return fn(store.dispatch, store.getState);
}

describe("ClassInput actions such as adding, editing and removing classes", () => {
    let store;

    beforeEach((done) => {
        store = createStore(reducers, applyMiddleware(thunk));
        done();
    });

    test('Can add a class successfully', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("12"));
        store.dispatch(setConflicts(["LE", "blah"]));
        store.dispatch(setInstructor("Mr. Cameron Trando"));

        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();

        let classList = store.getState().ClassList;

        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(1);

        let addedClass = classList.selectedClasses[0];

        const result = {
            classTitle: "CSE 12",
            department: "CSE",
            courseNum: "12",
            conflicts: ["LE", "blah"],
            priority: null,
            instructor: "Mr. Cameron Trando"
        };

        chaiExpect(addedClass).to.eql(result)
    });

    test('Cannot add duplicate classes', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("12"));
        store.dispatch(setConflicts(["LE", "blah"]));
        store.dispatch(setInstructor("Mr. Cameron Trando"));


        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();

        // making second class
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("12"));
        store.dispatch(setConflicts(["LE", "blah"]));
        store.dispatch(setInstructor("Mr. Cameron Trando"));

        // adding again
        inputHandler.handleAdd();

        let classList = store.getState().ClassList;
        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(1);
    });

    test('Can add multiple classes', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));

        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("12"));
        store.dispatch(setConflicts(["LE", "blah"]));
        store.dispatch(setInstructor("Mr. Cameron Trando"));

        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();

        // making second class
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));

        // adding again
        inputHandler.handleAdd();

        let classList = store.getState().ClassList;
        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(2);
    });

    test('Can edit a simple class correctly', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));

        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));

        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();

        store.dispatch(enterEditMode(0));

        // making second class
        inputHandler.onDepartmentChange("DSC");
        inputHandler.onCourseNumChange("11");

        // adding again
        inputHandler.handleEdit();

        // returning back to input mode
        store.dispatch(enterInputMode());

        let classList = store.getState().ClassList;
        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(1);

        const result = {
            classTitle: "DSC 11",
            department: "DSC",
            courseNum: "11",
            conflicts: [],
            priority: null,
            instructor: null,
        };

        let newClass = classList.selectedClasses[0];
        chaiExpect(newClass).eql(result);
    });

    test('Can edit a more complex class with instructor and conflicts fields and so on correctly', () => {
        // need shallow here because ClassInput has a componentDidMount method causing what I believe to be a
        // race condition between updating in this test thread and updating in the componentDidMount thread,
        // giving wrong results - should not occur in production however

        const classInput = shallow(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));
        store.dispatch(setInstructors(["Rick Ord", "Joseph Politz"]));

        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));
        store.dispatch(setConflicts(["LE", "LA", "DI"]));
        store.dispatch(setInstructor("Rick Ord"));

        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();

        store.dispatch(enterEditMode(0));

        // making edits
        inputHandler.onInstructorChange("Joseph Politz");

        // adding again
        inputHandler.handleEdit();

        let classList = store.getState().ClassList;
        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(1);

        const result = {
            classTitle: "CSE 11",
            department: "CSE",
            courseNum: "11",
            conflicts: [],
            priority: null,
            instructor: "Joseph Politz",
        };

        let newClass = classList.selectedClasses[0];
        chaiExpect(newClass).eql(result);
    });

    test('Instructors options change correctly after editing a class and trying to edit other classes', () => {
        // need shallow here because ClassInput has a componentDidMount method causing what I believe to be a
        // race condition between updating in this test thread and updating in the componentDidMount thread,
        // giving wrong results - should not occur in production however

        let prev = DataFetcher.fetchClassSummaryFor;
        DataFetcher.fetchClassSummaryFor = (department) => {
            return {
                courseNums: ["11", "12"],
                instructorsPerClass: {"11": ["Joseph Politz", "Rick Ord"]},
                classTypesPerClass: {},
                descriptionsPerClass: {}
            }
        };

        const classInput = shallow(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE", "DSC"]));
        store.dispatch(setCourseNums(["11", "12"]));
        store.dispatch(setInstructors(["Rick Ord", "Joseph Politz"]));
        store.dispatch(populateDataPerClass({"11": ["Joseph Politz", "Rick Ord"], "12": ["Joseph Politz"]},
            {}, {}));

        let inputHandler = getInputHandler(store);
        inputHandler.onDepartmentChange("CSE");
        inputHandler.onCourseNumChange("11");
        inputHandler.onConflictChange(["LE", "LA", "DI"]);
        inputHandler.onInstructorChange("Rick Ord");

        inputHandler.handleAdd();

        inputHandler.onDepartmentChange("CSE");
        inputHandler.onCourseNumChange("12");

        inputHandler.handleAdd();

        store.dispatch(enterEditMode(0));
        store.dispatch(populateDataPerClass({"11": ["Joseph Politz", "Rick Ord"], "12": ["Joseph Politz"]}));

        const state = store.getState().ClassInput;
        chaiExpect(state.instructors).to.have.members(["Joseph Politz", "Rick Ord"]);

        DataFetcher.fetchClassSummaryFor = prev;
    });

    test('Duplicate checking only looks at the class title', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        // making first class
        store.dispatch(setDepartments(["CSE"]));
        store.dispatch(setCourseNums(["11"]));
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));
        // adding first class
        let inputHandler = getInputHandler(store);
        inputHandler.handleAdd();
        // making second class
        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));
        // adding again
        inputHandler.handleAdd();

        let classList = store.getState().ClassList;
        chaiExpect(Object.keys(classList.selectedClasses)).to.have.lengthOf(1);
    });
});