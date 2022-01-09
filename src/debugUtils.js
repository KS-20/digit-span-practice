import {appEngine,SetRecord} from './source.js'

function fillPerfRecord(numOfRecords = 3600) {
    for (var i = 0; i < numOfRecords; ++i) {
        let setRecord = new SetRecord();
        setRecord.addScore(11);
        setRecord.setMinSuccessScore(5);
        appEngine.performanceRecord.addSetRecord(setRecord);
    }
}

window.appEngine = appEngine;
window.fillPerfRecord = fillPerfRecord;