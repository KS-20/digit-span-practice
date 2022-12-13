import {appEngine,SetRecord} from './source.js'

function fillPerfRecord(numOfRecords = 3600) {
    for (var i = 0; i < numOfRecords; ++i) {
        let setRecord = new SetRecord();
        setRecord.addScore(11);
        setRecord.setMinSuccessScore(5);
        appEngine.performanceRecord.addSetRecord(setRecord);
    }
}

function fillCatefories(NumOfCatagories = 17){
    var dummyArray=[];
    for (var i=0;i<NumOfCatagories;++i) {
        var catagoryName = 'c'+i.toString().padStart(29,'0');
        appEngine.addTrailCatagory(catagoryName);
        dummyArray.push(catagoryName);
    }
    const dataStringLength = JSON.stringify(dummyArray).length;
    if(dataStringLength !== NumOfCatagories*30 + NumOfCatagories*2 + NumOfCatagories+1) {
        throw Error("this should not happen")
    }
}

window.appEngine = appEngine;
window.fillPerfRecord = fillPerfRecord;
window.fillCatefories = fillCatefories;