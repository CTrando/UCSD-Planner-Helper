import React, {PureComponent} from 'react';
import {ReactComponent as CalendarIcon} from "../../svg/icon-calendar.svg";
import PropTypes from 'prop-types';
import {addToCalendar} from "./GCalendar";
import {Button} from "../../utils/button/Button";
import Popover from 'react-tiny-popover';
import './DownloadOptions.css';
import {downloadICS} from "./ics";

export class DownloadOptions extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            popOverOpen: false,
        }
    }

    onClick() {
        this.setState({popOverOpen: !this.state.popOverOpen});
    }

    showOptions() {
        return (
            <div className="options-list">
                <Button className="gcalendar-button" label="Google Calendar"
                        onClick={addToCalendar.bind(this, this.props.currentSchedule, this.props.classData)}/>
                <Button className="gcalendar-button ics-button" label="ics"
                        onClick={downloadICS.bind(this, this.props.currentSchedule, this.props.classData)}/>
            </div>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Popover
                    containerClassName="download-options-popover"
                    isOpen={this.state.popOverOpen}
                    position={['bottom', 'left', 'top', 'right']}
                    transitionDuration={.25}
                    onClickOutside={() => this.setState({popOverOpen: false})}
                    content={() => (
                        <div>
                            {this.showOptions()}
                        </div>
                    )}
                >
                    <Button className="export-calendar-button" onClick={this.onClick.bind(this)}>
                        <CalendarIcon/>
                    </Button>
                </Popover>
            </React.Fragment>
        );
    }
}

DownloadOptions.propTypes = {
    classData: PropTypes.array.isRequired,
    currentSchedule: PropTypes.array.isRequired
};


