import {makeTimeInterval} from "../utils/time/TimeUtils";
import {SGWorker} from "../utils/schedulegeneration/SGWorker";

import {expect} from 'chai';

describe('Schedule generation', () => {

    const testInput = {
        classData: [
            {
                title: "CSE 12",
                number: "12",
                description: "Basic Data Struct & OO Design  ( 4Units)",
                department: "CSE",
                sections: [{
                    id: "961434",
                    sectionNum: "CSE12$0",
                    subsections: [{
                        day: "Tu",
                        instructor: "Politz, Joseph Gibbs",
                        location: "YORK",
                        room: "115",
                        timeInterval: makeTimeInterval("17:00-17:50", "Tu"),
                        type: "DI",
                    }]
                }]
            }
        ],
        conflicts: [],
        preferences: []
    };

    const testInputConflicts = {
        classData: [
            {
                title: "CSE 12",
                number: "12",
                description: "Basic Data Struct & OO Design  ( 4Units)",
                department: "CSE",
                sections: [{
                    id: "961434",
                    sectionNum: "CSE12$0",
                    subsections: [{
                        day: "Tu",
                        instructor: "Politz, Joseph Gibbs",
                        location: "YORK",
                        room: "115",
                        timeInterval: makeTimeInterval("17:00-17:50", "Tu"),
                        type: "DI",
                    }]
                }]
            }
        ],
        conflicts: {"CSE 12": ["DI"]},
        preferences: []
    };

    const testInputNoSubsections = {
        classData: [
            {
                title: "CSE 12",
                number: "12",
                description: "Basic Data Struct & OO Design  ( 4Units)",
                department: "CSE",
                sections: [{
                    id: "961434",
                    sectionNum: "CSE12$0",
                    subsections: [{
                        day: "Tu",
                        instructor: "Politz, Joseph Gibbs",
                        location: "YORK",
                        room: "115",
                        timeInterval: makeTimeInterval("17:00-17:50", "Tu"),
                        type: "DI",
                    }]
                }]
            }, {
                title: "AIP 197",
                number: "197",
                description: "Academic Internship Program    ( 4/12 by 4Units)",
                department: "AIP",
                sections: [{
                    id: "953879",
                    sectionNum: "AIP197$0",
                    classTitle: "AIP 197",
                    subsections: [],
                }]
            }
        ], conflicts: {"CSE 12": ["DI"]},
        preferences: []
    };


    const testInputShouldGiveError = {
        classData: [
            {
                title: "CSE 12",
                number: "12",
                description: "Basic Data Struct & OO Design  ( 4Units)",
                department: "CSE",
                sections: [{
                    id: "961434",
                    sectionNum: "CSE12$0",
                    subsections: [{
                        day: "Tu",
                        instructor: "Politz, Joseph Gibbs",
                        location: "YORK",
                        room: "115",
                        timeInterval: makeTimeInterval("17:00-17:50", "Tu"),
                        type: "DI",
                    }]
                }]
            },
            {
                title: "CSE 11",
                number: "11",
                description: "Test Class ( 4Units)",
                department: "CSE",
                sections: [{
                    id: "2828382",
                    sectionNum: "CSE11$0",
                    subsections: [{
                        day: "Tu",
                        instructor: "Cameron Trando",
                        location: "YORK",
                        room: "115",
                        timeInterval: makeTimeInterval("17:00-17:50", "Tu"),
                        type: "DI",
                    }]
                }]
            }
        ],
        conflicts: [],
        preferences: []
    };

    it('It can generate a schedule of one class', () => {
        let worker = new SGWorker();
        let result = worker.generate(testInput);

        expect(Object.keys(result.errors).length).to.equal(0);
        expect(result.schedules.length).to.equal(1);

        // schedule is a list of classes
        let schedule = result.schedules[0];
        let Class = schedule[0];

        expect(Class).to.equal("CSE12$0");
    });

    it('Returns nothing on given empty data', () => {
        let worker = new SGWorker();
        let result = worker.generate({classData: [], conflicts: [], preferences: []});

        expect(Object.keys(result.errors).length).to.equal(0);
        expect(result.schedules.length).to.equal(0);
    });

    it('Can handle bad inputs correctly', () => {
        let worker = new SGWorker();
        let result = worker.generate({
            classData: [{hello: "world"}],
            conflicts: ["bad", "input"],
            preferences: ["really bad"]
        });

        expect(Object.keys(Object.keys(result.errors))).to.have.lengthOf(0);
        expect(result.schedules).to.have.lengthOf(0);
    });

    it('Fails when two of the required classes overlap', () => {
        let worker = new SGWorker();
        let result = worker.generate(testInputShouldGiveError);

        expect(Object.keys(result.errors).length).to.not.equal(0);
        expect(result.schedules.length).to.equal(0);

        let errors = result.errors["CSE11$0"];
        expect(errors[0]).to.equal("CSE12$0");
    });


    it("Schedule generation can ignore sections correctly", () => {
        let sg = new SGWorker().getScheduleGenerator(testInputConflicts);

        let result = sg.isClassIgnored(testInput.classData[0]);
        expect(result).to.equal(true);
    });

    it("Generates successfully even when one class has no subsections", () => {
        let worker = new SGWorker();
        let result = worker.generate(testInputNoSubsections);

        expect(result.schedules.length).to.equal(1);
    });
});
