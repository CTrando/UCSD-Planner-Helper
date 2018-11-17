import React, {PureComponent} from "react";
import Calendar from "react-big-calendar";
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";
import {Button} from "primereact/components/button/Button";
import {ics} from "../../utils/ics";
import "../../css/WeekCalendar.css";
import ClassEvent from "./ClassEvent";
import {addEvents} from "../../utils/GCalendar";


Calendar.setLocalizer(Calendar.momentLocalizer(moment));


class WeekCalendar extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            subsections: [],
            events: [],
            schedule: null,
        };

        this.state.schedule = this.props.schedule;
        this.state.subsections = this.flattenSchedule();
        this.state.events = this.initEvents();
    }

    flattenSchedule() {
        // generationResult should look like a 2D array where each element is a list of subsections
        let ret = [];
        for (let Class of this.state.schedule.classes) {
            for (let subsection of Class) {
                ret.push(subsection);
            }
        }
        console.log(ret);
        return ret;
    }

    initEvents() {
        let ret = [];
        for (let subsection of this.state.subsections) {
            let startTime = subsection.timeInterval['start'];
            let endTime = subsection.timeInterval['end'];
            ret.push({
                start: startTime,
                end: endTime,
                ...subsection,
            });
        }
        return ret;
    }

    downloadICS(subsections) {
        let calendar = ics();
        for (let subsection of subsections) {
            let fiveWeeksAhead = new Date();
            // setting five weeks ahead
            fiveWeeksAhead.setDate(fiveWeeksAhead.getDate() + 35);
            let recurringEventRule = {
                freq: "WEEKLY",
                until: fiveWeeksAhead,
                interval: 1,
                byday: [subsection.day]
            };

            calendar.addEvent(
                subsection.classTitle,
                subsection.description,
                subsection.location,
                subsection.timeInterval['start'],
                subsection.timeInterval['end'],
                recurringEventRule
            )
        }
        calendar.download("Calendar");
    }
    render() {
        // setting max and min times
        const minTime = new Date();
        const maxTime = new Date();
        minTime.setHours(8, 0, 0);
        maxTime.setHours(23, 0, 0);

        const dayFormat = {
            dayFormat: 'ddd'
        };

        const icsDownload = (
            <Button label="Download Calendar" className="ui-button-info"
                    onClick={this.downloadICS.bind(this, this.state.subsections)}
                    disabled={this.props.empty}/>
        );
        const toGCalendar = (
            <Button id="gcalendar-button" label="Add to Google Calendar" className="ui-button-info"
                    onClick={addEvents.bind(this, this.state.subsections)}
                    disabled={this.props.empty}/>
        );
        const components = {
            event: ClassEvent
        };

        return (
            <div className="calendar-content">
                {!this.props.empty &&
                    <div className="calendar-button">
                        {icsDownload}
                        {toGCalendar}
                    </div>
                }
                <Calendar
                    components={components}
                    formats={dayFormat}
                    id="calendar"
                    min={minTime}
                    max={maxTime}
                    toolbar={false}
                    defaultDate={new Date()}
                    defaultView={'work_week'}
                    views={['work_week']}
                    events={this.state.events}
                />
            </div>
        );
    }
}


WeekCalendar.defaultProps = {
    schedule: {
        classes: [],
        errors: []
    },
};

export default WeekCalendar;