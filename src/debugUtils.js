import {appEngine,SetRecord} from './source.js'

function fillPerfRecord(numOfRecords = 3600) {
    for (var i = 0; i < numOfRecords; ++i) {
        let setRecord = new SetRecord();
        setRecord.addScore(11);
        setRecord.setMinSuccessScore(5);
        appEngine.performanceRecord.addSetRecord(setRecord);
    }
}

function fillCatefories(NumOfCategories = 17){
    var dummyArray=[];
    for (var i=0;i<NumOfCategories;++i) {
        var categoryName = 'c'+i.toString().padStart(29,'0');
        appEngine.addTrailCategory(categoryName);
        dummyArray.push(categoryName);
    }
    const dataStringLength = JSON.stringify(dummyArray).length;
    if(dataStringLength !== NumOfCategories*30 + NumOfCategories*2 + NumOfCategories+1) {
        throw Error("this should not happen")
    }
}

window.appEngine = appEngine;
window.fillPerfRecord = fillPerfRecord;
window.fillCatefories = fillCatefories;