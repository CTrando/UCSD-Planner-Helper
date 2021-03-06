import React from 'react';
import Dayz from "dayz/dist/dayz";
import ScheduleGeneratorEventContainer from "./ScheduleGeneratorEventContainer";

export default class ScheduleGeneratorEventWrapper extends Dayz.EventsCollection.Event {
    defaultRenderImplementation() {
        return (
            <ScheduleGeneratorEventContainer {...this.attributes} />
        );
    }
}
