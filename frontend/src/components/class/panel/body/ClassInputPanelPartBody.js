import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import "./ClassInputPanelPartBody.css"

import {ReactComponent as PlusIcon} from "../../../../svg/icon-plus.svg";
import {RemoveCourseWidget} from "./widgets/remove_course/RemoveCourseWidget";
import InstructorPrefWidgetContainer from "./widgets/instructor/InstructorPrefWidgetContainer";

export class ClassInputPanelPartBody extends PureComponent {

    render() {
        return (
            <div>
                <InstructorPrefWidgetContainer inputHandler={this.props.inputHandler}/>
                <ClassInputPanelPartBodySection label={"CAPES"}/>
                <ClassInputPanelPartBodySection label={"View Class Types"}/>
                <ClassInputPanelPartBodySection label={"Course Description"}/>
                <RemoveCourseWidget />
            </div>
        )
    }
}

class ClassInputPanelPartBodySection extends PureComponent {
    // TODO use children as icons instead of just using plus here
    render() {
        const plusMinusNames = classNames("class-input__panel__part__body__header__icon", {"active": this.props.isOpen});

        return (
            <div className="class-input__panel__part__body__header">
                <div/>
                <div className="class-input__panel__part__body__header__title">
                    {this.props.label}
                </div>
                <div className={plusMinusNames}>
                    <PlusIcon/>
                </div>
            </div>
        );
    }
}

ClassInputPanelPartBodySection.propTypes = {
    onClick: PropTypes.func,
    label: PropTypes.string.isRequired,
};




