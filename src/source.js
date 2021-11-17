// for reference: https://timodenk.com/blog/digit-span-test-online-tool/
const Dropbox = require("dropbox")

class SetRecord {
    constructor() {
        this.setRecordArray = [];
    }
    addScore(score) {
        this.setRecordArray.push(score);
    }

    setMinSuccessScore(minSuccessScore) {
        this.minSuccessScore = minSuccessScore;
    }

    getNumOfExercises() {
        return this.setRecordArray.length;
    }

    getNumOfSuccessfulExercises() {
        var numOfSuccessfulExercises = 0;
        for (let score of this.setRecordArray) {
            if (this.minSuccessScore <= score) {
                numOfSuccessfulExercises++;
            }
        }
        return numOfSuccessfulExercises;
    }

    getSuccessRate() {
        return Math.round(this.getNumOfSuccessfulExercises() / this.getNumOfExercises() * 100);
    }
}

class PerformanceRecord {
    constructor() {
        this.perfRecordArray = [];
    }

    addSetRecord(setRecord) {
        this.perfRecordArray.push(setRecord);
    }

    *[Symbol.iterator]() {
        for (var setRecord of this.perfRecordArray) {
            yield setRecord;
        }
    }

    populateFromJson(jsonString) {
        var untypedObject = JSON.parse(jsonString);
        this.perfRecordArray = [];
        for (const unTypedSetRecord of untypedObject.perfRecordArray) {
            let setRecord = new SetRecord();
            setRecord.setMinSuccessScore(unTypedSetRecord.minSuccessScore);
            for (let score of unTypedSetRecord.setRecordArray) {
                setRecord.addScore(score);
            }
            this.addSetRecord(setRecord)
        }
    }
}

class AppEngine {
    constructor(guiController) {
        this.numToRecall = "";
        this.guiController = guiController;
        this.performanceRecord = new PerformanceRecord();
        this.dropboxStorage = new DropboxStorage();
    }

    getDropboxStorage() {
        return this.dropboxStorage;
    }

    getPerformanceRecord() {
        return this.performanceRecord;
    }

    getGuiController() {
        return this.guiController;
    }

    startPracticeSet() {
        this.currentRepIndex = 0;
        this.currentSetRecord = new SetRecord();
        this.currentSetRecord.setMinSuccessScore(this.guiController.getNumOfDigits());
        this.prepareForQuestion();
    }

    async onSubmitAnswer() {

        var str = this.guiController.getInput();
        if (str === this.numToRecall) {
            alert("Good job! you put the correct answer: " + str);
            const numOfDigits = this.guiController.getNumOfDigits();
            this.currentSetRecord.addScore(numOfDigits)
        } else {
            alert("wrong!, you submitted: " + str + " but the answer is: " + this.numToRecall);
            this.currentSetRecord.addScore(0)
        }
        this.currentRepIndex++;
        if (this.currentRepIndex < this.guiController.getNumOfReps()) {
            this.prepareForQuestion();
        } else {
            this.performanceRecord.addSetRecord(this.currentSetRecord);
            var msg = "succeeded in  " + this.currentSetRecord.getNumOfSuccessfulExercises() + " out of " +
                this.currentSetRecord.getNumOfExercises();
            this.guiController.setNumToRecall(msg);
            this.guiController.focusStartButton();
            await this.dropboxStorage.savePerfRecord(this.getPerformanceRecord());
        }

        return false;
    }

    async onPageLoad() {
        if (localStorage.numOfDigits) {
            this.guiController.initNumOfDigits(localStorage.numOfDigits);
        } else {
            this.guiController.initNumOfDigits(2);
        }

        if (localStorage.numOfReps) {
            this.guiController.initNumOfReps(localStorage.numOfReps)
        } else {
            this.guiController.initNumOfReps(2);
        }
        const perfRecord = await this.getDropboxStorage().loadPerfRecord();;
        if (perfRecord) {
            this.performanceRecord = perfRecord;
        }

    }

    prepareForQuestion() {
        this.guiController.activateDisplayMode()
        var numOfDigits = this.guiController.getNumOfDigits();
        this.numToRecall = "";
        for (var i = 0; i < numOfDigits; ++i) {
            this.numToRecall += Math.floor(Math.random() * 10);
        }
        this.guiController.setNumToRecall(this.numToRecall);
        var secondsToWait = numOfDigits * 1000;
        setTimeout(() => this.guiController.prepareForAns(), secondsToWait);
    }

    rememberNumOfDigits() {
        localStorage.setItem("numOfDigits", this.guiController.getNumOfDigits());
    }

    rememberNumOfReps() {
        localStorage.setItem("numOfReps", this.guiController.getNumOfReps());
    }

    switchToPureHtmlGui() {
        this.guiController = new HtmlPureGui();
    }
}

class DropboxStorage {
    constructor() {
        this.redirectUri = '';
        var CLIENT_ID = 'y9rc6q1jk1bg8lx';
        this.dbxAuth = new Dropbox.DropboxAuth({
            clientId: CLIENT_ID,
        });
    }

    doAuthentication() {
        return this.dbxAuth.getAuthenticationUrl(this.redirectUri, undefined, 'code', 'offline', undefined, undefined, true)
            .then(authUrl => {
                window.localStorage.clear();
                window.localStorage.setItem("codeVerifier", this.dbxAuth.codeVerifier);
                window.open(authUrl);
            })
            .catch((error) => this.reportError(error));
    }
    generateAccessToken(accessCode) {
        this.dbxAuth.setCodeVerifier(window.localStorage.getItem('codeVerifier'));
        this.dbxAuth.getAccessTokenFromCode(this.redirectUri, accessCode)
            .then((response) => {
                const accessToken = response.result.access_token;
                window.localStorage.setItem("accessToken", accessToken);
                this.dbxAuth.setAccessToken(accessToken);
                this.dbx = new Dropbox.Dropbox({
                    auth: this.dbxAuth
                });
            })
            .catch((error) => {
                this.reportError(error)
            });
    }

    async loadPerfRecord() {
        var args = {
            path: "/digit_span_perf_record.json",
        }
        const codeVerifier = window.localStorage.getItem('codeVerifier');
        const accessToken = window.localStorage.getItem("accessToken");
        if (accessToken === null) {
            return;
        }
        this.dbxAuth.setCodeVerifier(codeVerifier);
        this.dbxAuth.setAccessToken(accessToken);
        this.dbx = new Dropbox.Dropbox({
            auth: this.dbxAuth
        });
        var ans = await this.dbx.filesDownload(args);
        var jsonString = await ans.result.fileBlob.text();
        var performanceRecord = new PerformanceRecord();
        performanceRecord.populateFromJson(jsonString);
        return performanceRecord;
    }

    async savePerfRecord(performanceRecord) {
        var fileContent = JSON.stringify(performanceRecord);
        var args = {
            contents: fileContent,
            path: "/digit_span_perf_record.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        await this.dbx.filesUpload(args);
    }

    reportError(responseError) {
        console.error(responseError)
        console.error(responseError.error)
    }
}

class HtmlPureGui {
    getInput() {
        return this.getInputObj().value;
    }

    prepareForAns() {
        this.getInputObj().style.display = "block";
        this.getDisplayObj().style.display = "none";
    }

    getNumOfDigits() {
        return document.forms["form2"]["numOfDigits"].value
    }

    getInputObj() {
        return document.forms["form1"]["input1"];
    }

    getDisplayObj() {
        return document.getElementById("numToRemember");
    }

    setNumOfDigitsField(numOfDigits) {
        document.forms["form2"]["numOfDigits"].value = numOfDigits;
    }
    activateDisplayMode() {
        this.getInputObj().style.display = "none";
        this.getDisplayObj().style.display = "block";
    }

    setNumToRecall(numToRecall) {
        this.getDisplayObj().innerHTML = numToRecall;
    }

}

class ReactGui {
    setAppComponent(appComponent) {
        this.appComponent = appComponent;
    }

    setInput(input) {
        this.input = input;
    }

    getInput() {
        return this.input;
    }

    prepareForAns() {
        this.appComponent.setState({ isInputMode: true })
    }

    getNumOfDigits() {
        return this.numOfDigits;
    }

    setNumOfDigits(numOfDigits) {
        this.numOfDigits = numOfDigits;
    }

    getNumOfReps(numOfReps) {
        return this.numOfReps;
    }

    setNumOfReps(numOfReps) {
        this.numOfReps = numOfReps;
    }

    getInputObj() {
    }

    getDisplayObj() {
    }

    initNumOfDigits(numOfDigits) {
        this.setNumOfDigits(numOfDigits);
        this.appComponent.setState({ defaultNumSize: numOfDigits })
        this.appComponent.setNumLengthField(numOfDigits);
    }

    initNumOfReps(numOfReps) {
        this.setNumOfReps(numOfReps);
        this.appComponent.setState({ defaultRepNum: numOfReps })
        this.appComponent.setNumOfRepsField(numOfReps);

    }

    activateDisplayMode() {
    }

    setNumToRecall(numToRecall) {
        var stateToSet = { numToRecall: numToRecall, isInputMode: false };
        this.appComponent.setState(stateToSet)
    }

    focusStartButton() {
        this.appComponent.focusStartButton();
    }
}

var appEngine = new AppEngine(new ReactGui());

export default appEngine;