import React from 'react';
import renderer from 'react-test-renderer';
import thunk from 'redux-thunk';
import {applyMiddleware, createStore} from "redux";
import reducers from "../reducers";
import {setCourseNum, setCourseNums, setDepartment, setDepartments} from "../actions/ClassInput/ClassInputMutator";
import ClassInputContainer from "../containers/ClassInputContainer";
import {AutoComplete} from "primereact/components/autocomplete/AutoComplete";
import {mount} from 'enzyme';

let store = createStore(reducers, applyMiddleware(thunk));
const should = require('chai').should();

describe("ClassInput component", () => {
    beforeEach((done) => {
        store = createStore(reducers, applyMiddleware(thunk));
        done();
    });

    test('Renders correctly with no props', () => {
        const classInput = renderer.create(
            <ClassInputContainer store={store}/>,
        );
        let tree = classInput.toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('Can type in the department autocomplete and have it remember the input', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        store.dispatch(setDepartments(["CSE"]));

        store.dispatch(setDepartment("CS"));
        chaiExpect(store.getState().ClassInput.department).to.equal("CS");

        let department = classInput.find({id: "department"}).find(AutoComplete).instance();
        chaiExpect(department.props.value).to.equal("CS");
    });


    test('Entering a valid department allows the user to enter course number', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        let courseAutocomplete = classInput.find({id: "course-number"}).find(AutoComplete).instance();
        chaiExpect(courseAutocomplete.props.disabled).to.equal(true);

        store.dispatch(setDepartments(["CSE"]));
        store.dispatch(setDepartment("CSE"));

        chaiExpect(courseAutocomplete.props.disabled).to.equal(false);
    });

    test('Entering an invalid department keeps the course number autocomplete disabled', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );
        store.dispatch(setDepartments(["Hello"]));
        store.dispatch(setDepartment("CSE"));

        let courseAutocomplete = classInput.find({id: "course-number"}).find(AutoComplete).instance();
        chaiExpect(courseAutocomplete.props.disabled).to.equal(true);
    });

    test('Entering a valid course number opens up the instructor', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );
        store.dispatch(setDepartments(["CSE"]));
        store.dispatch(setCourseNums(["11"]));

        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("11"));

        let instructor = classInput.find({id: "instructor"}).find(AutoComplete).instance();
        chaiExpect(instructor.props.disabled).to.equal(false);
    });

    test('Entering an invalid course number keeps instructor autocomplete disabled', () => {
        const classInput = mount(
            <ClassInputContainer store={store}/>
        );

        store.dispatch(setDepartments(["CSE"]));
        store.dispatch(setCourseNums(["11"]));

        store.dispatch(setDepartment("CSE"));
        store.dispatch(setCourseNum("12"));

        let instructor = classInput.find({id: "instructor"}).find(AutoComplete).instance();
        chaiExpect(instructor.props.disabled).to.equal(true);
    });

});

