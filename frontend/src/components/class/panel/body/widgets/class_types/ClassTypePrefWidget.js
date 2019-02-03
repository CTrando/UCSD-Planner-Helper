import React from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";

import "./ClassTypePrefWidget.css";

import {Accordion} from "../../../../../../utils/accordion/Accordion";
import {AccordionBody, AccordionLabel, AccordionPanel} from "../../../../../../utils/accordion/AccordionPanel";
import {ReactComponent as PlusIcon} from "../../../../../../svg/icon-plus.svg";
import {ListBox} from "../../../../../../utils/listbox/ListBox";


const codeToClassType = {
    AC: 'Activity',
    CL: 'Clinical Clerkship',
    CO: 'Conference',
    DI: 'Discussion',
    FI: 'Final Exam',
    FM: 'Film',
    FW: 'Fieldwork',
    IN: 'Independent Study',
    IT: 'Internship',
    LA: 'Lab',
    LE: 'Lecture',
    MI: 'Midterm',
    MU: 'Make-up Session',
    OT: 'Other Additional Meeting',
    PB: 'Problem Session',
    PR: 'Practicum',
    RE: 'Review Session',
    SE: 'Seminar',
    ST: 'Studio',
    TU: 'Tutorial',
};


export const ClassTypePrefWidget = (props) => {
    const types = props.types.map(type => codeToClassType[type]);
    const plusMinusNames = classNames("class-input__panel__part__body__header__icon", {"active": props.isOpen});

    const listBox = types.length > 0 ? (
        <ListBox
            className="type-pref__container"
            stylePerButton={["type-pref__button"]}
            keyPrefix={props.Class.classTitle}
                 onClick={(selectedTypes) => {
                     props.inputHandler.onClassTypesToIgnoreChange(selectedTypes)
                 }}
                 values={types}/>
    ) : (<div> No class types </div>);

    console.log(props.Class.classTitle);
    return (
        <div className="class-input__panel__pref">
            <Accordion>
                <AccordionPanel label={props.Class.classTitle} {...props}>
                    <AccordionLabel>
                        <div className="class-input__panel__part__body__header">
                            <div/>

                            <div className="class-input__panel__part__body__header__title">
                                View Class Types
                            </div>
                            <div className={plusMinusNames}>
                                <PlusIcon/>
                            </div>
                        </div>
                    </AccordionLabel>
                    <AccordionBody>
                        {listBox}
                    </AccordionBody>
                </AccordionPanel>
            </Accordion>
        </div>
    );
};

ClassTypePrefWidget.propTypes = {
    inputHandler: PropTypes.object.isRequired,
    types: PropTypes.array.isRequired
};