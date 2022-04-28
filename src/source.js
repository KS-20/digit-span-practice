// for reference: https://timodenk.com/blog/digit-span-test-online-tool/
import { names } from './names.js'
const Dropbox = require("dropbox")

class SetRecord {
    constructor() {
        this.setRecordArray = [];
        this.catagory = "";
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

    getCatagory () {
        return this.catagory;
    }

    setCatagory (catagoryName) {
        this.catagory = catagoryName;
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
            setRecord.setCatagory(unTypedSetRecord.catagory);
            this.addSetRecord(setRecord)
        }
    }
}

class AppEngine {
    constructor(guiController) {
        this.numToRecall = "";
        this.guiController = guiController;
        this.performanceRecord = new PerformanceRecord();
        this.dropboxStorage = new DropboxStorage(guiController);
        this.longTermStorage = this.dropboxStorage;
        this.trailCatagoryArray = [];
        this.currentCatagory = names.noCatagory;
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
            if( this.currentCatagory !== names.noCatagory ) {
                this.currentSetRecord.setCatagory(this.currentCatagory);
            }
            this.performanceRecord.addSetRecord(this.currentSetRecord);
            var msg = "succeeded in  " + this.currentSetRecord.getNumOfSuccessfulExercises() + " out of " +
                this.currentSetRecord.getNumOfExercises();
            this.guiController.setNumToRecall(msg);
            this.guiController.focusStartButton();
            try {
                await this.longTermStorage.savePerfRecord(this.getPerformanceRecord());
            } catch (e) {
                this.guiController.setSavingStatusLine("");
                this.processException(e);
            }
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

        if (localStorage.storageType === names.browserStorage) {
            this.switchToBrowserStorage();
        } else if (localStorage.storageType === names.dropbox) {
            this.switchToDropboxStorage();
        }

        await this.loadPerfRecord();
        await this.loadCatagoryData();
    }

    async loadCatagoryData() {
        this.trailCatagoryArray = await this.longTermStorage.loadCatagoryArray();
        for(const trailCatagory of this.trailCatagoryArray) {
            this.guiController.addTrailCatagory(trailCatagory) ;
        }
        this.currentCatagory = await this.longTermStorage.loadCurrentCatagory();
        this.guiController.setSelectedCatagory(this.currentCatagory);
    }

    async loadPerfRecord() {
        try {
            this.guiController.setErrorMessage("");
            this.performanceRecord = await this.longTermStorage.loadPerfRecord();
            this.guiController.updateGUI();
        } catch (e) {
            this.guiController.setSavingStatusLine("");
            this.processException(e);
        }
    }

    processException(e) {
        if (e instanceof Dropbox.DropboxResponseError) {
            let errorMsg = "error detected: \n" + e.toString() + "\n";
            if (e.error && e.error.error_summary === "expired_access_token/...") {
                errorMsg += "Dropbox access token has expired, suggested resolution: try to reauthenticate \n";
            }
            errorMsg += "error JSON string: \n" + JSON.stringify(e);
            this.guiController.setErrorMessage(errorMsg);
        } else if (e instanceof UserReportedError) {
            this.guiController.setErrorMessage(e.getMessage());
        } else {
            throw e;
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

    switchToDropboxStorage() {
        localStorage.setItem("storageType", names.dropbox);
        this.guiController.setStorageTypeButton(names.dropbox);
        this.longTermStorage = this.dropboxStorage;
    }

    switchToBrowserStorage() {
        localStorage.setItem("storageType", names.browserStorage);
        this.guiController.setStorageTypeButton(names.browserStorage);
        this.longTermStorage = new BrowserStorage();
    }

    addTrailCatagory(name) {
        this.trailCatagoryArray.push(name);
        this.guiController.addTrailCatagory(name);
        this.longTermStorage.saveTrailCatagories(this.trailCatagoryArray);
    }
    removeTrailCatagory(name) {
        var callback = (currentValue) => { return currentValue !== name };
        this.trailCatagoryArray = this.trailCatagoryArray.filter(callback);
        this.guiController.removeTrailCatagory(name);
        if(this.currentCatagory === name) {
            this.switchToCatagory(names.noCatagory);
        }
        this.longTermStorage.saveTrailCatagories(this.trailCatagoryArray);
    }

    getCurrentCatagory() {
        return this.currentCatagory;
    }

    switchToCatagory(name) {
        this.currentCatagory = name;
        this.longTermStorage.saveCurrentCatagory(name);
    }

    getTrailCatagories(){
        return this.trailCatagoryArray;
    }
}

class UserReportedError {
    constructor(message) {
        this.message = message;
    }

    getMessage() {
        return this.message;
    }

    toString() {
        return this.getMessage();
    }
}

class NoAccessTokenError extends UserReportedError {
    constructor(message) {
        super();
        this.message = "Error , no access token is set for Dropbox (was the access code entered correctly?)";
    }
}

class BrowserStorage {
    async loadPerfRecord() {
        var performanceRecord = new PerformanceRecord();
        const jsonString = window.localStorage.getItem(BrowserStorage.getPerfItemName());
        if (jsonString) {
            performanceRecord.populateFromJson(jsonString);
        }
        return performanceRecord;
    }

    async savePerfRecord(performanceRecord) {
        var jsonString = JSON.stringify(performanceRecord);
        window.localStorage.setItem(BrowserStorage.getPerfItemName(), jsonString);

    }

    static getPerfItemName() {
        return "performanceRecordLocalStorage";
    }

    static getCatagoriesItemName() {
        return "trailCatagoriesLocalStorage";
    }

    static getCurrentCatagoryItemName(){
        return "currentCatagoryLocalStorage";
    }

    saveTrailCatagories(catagoriesArray){
        var jsonString = JSON.stringify(catagoriesArray);
        window.localStorage.setItem(BrowserStorage.getCatagoriesItemName(), jsonString);
    }

    saveCurrentCatagory(currentCatagory) {
        window.localStorage.setItem(BrowserStorage.getCurrentCatagoryItemName(),currentCatagory);
    }

    loadCurrentCatagory(){
        return window.localStorage.getItem(BrowserStorage.getCurrentCatagoryItemName());
    }

    loadCatagoryArray() {
        const jsonString = window.localStorage.getItem(BrowserStorage.getCatagoriesItemName());
        var parsedJSON = JSON.parse(jsonString);
        if (parsedJSON == null) {
            return []
        } else {
            return parsedJSON;
        }
    }
}

class DropboxStorage {
    constructor(guiController) {
        this.redirectUri = '';
        var CLIENT_ID = 'y9rc6q1jk1bg8lx';
        this.dbxAuth = new Dropbox.DropboxAuth({
            clientId: CLIENT_ID,
        });
        this.guiController = guiController;
    }

    async saveTrailCatagories(catagoriesArray){
        this.guiController.setSavingStatusLine("Trying to upload data to Dropbox");
        this.setUpDbx();
        var fileContent = JSON.stringify(catagoriesArray);
        var args = {
            contents: fileContent,
            path: "/digit_span_catagories_array.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        if (!this.dbx) throw new NoAccessTokenError();

        await this.dbx.filesUpload(args);
        this.guiController.setSavingStatusLine("Uploaded data to Dropbox");
    }

    async saveCurrentCatagory(currentCatagory){
        this.guiController.setSavingStatusLine("Trying to upload data to Dropbox");
        this.setUpDbx();
        var fileContent = JSON.stringify(currentCatagory);
        var args = {
            contents: fileContent,
            path: "/digit_span_current_catagory.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        if (!this.dbx) throw new NoAccessTokenError();

        await this.dbx.filesUpload(args);
        this.guiController.setSavingStatusLine("Uploaded data to Dropbox");
    }

    async loadCurrentCatagory(){
        var startingStatusLine = "Trying to load current catagory from Dropbox";
        var endingStatusLine = "Current catagory loaded successfully from Dropbox";
        var infoNotFoundMsg = "Current catagory information not found in Dropbox";
        var fileName = "digit_span_current_catagory.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine,endingStatusLine,infoNotFoundMsg,fileName);
        if(jsonString == null) {
            return names.noCatagory;
        } else {
            var currentCatagory = JSON.parse(jsonString);
            return currentCatagory;    
        }
    }

    async loadPerfRecord() {
        var startingStatusLine = "Trying to load performance data from Dropbox";
        var endingStatusLine = "Performance data from Dropbox loaded successfully";
        var infoNotFoundMsg = "Performance data not found in Dropbox";
        var fileName = "digit_span_perf_record.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine,endingStatusLine,infoNotFoundMsg,fileName);
        var performanceRecord = new PerformanceRecord();
        if(jsonString != null) {
            performanceRecord.populateFromJson(jsonString);
        } 
        return performanceRecord;
    }


    async downloadFromDropbox(startingStatusLine,endingStatusLine,infoNotFoundMsg,fileName){
        this.guiController.setSavingStatusLine(startingStatusLine);
        var args = {
            path: "/"+fileName,
        }
        this.setUpDbx();
        try {
            //When the file does not exist, a error message is written to the firefox console ("409 Conflict"), consider checking if the file exist using "filesListFolder(arg)", see https://stackoverflow.com/questions/58289223/checking-file-existence-dropbox-api-v2
            var ans = await this.dbx.filesDownload(args);
        } catch (e) {
            if (e.error && e.error.error_summary.substring(0,15) === "path/not_found/") {
                this.guiController.setSavingStatusLine(infoNotFoundMsg);
                return null;
            }
            throw e;
        }
        var jsonString = await ans.result.fileBlob.text();
        this.guiController.setSavingStatusLine(endingStatusLine);
        return jsonString;
    }

    async loadCatagoryArray(){
        var startingStatusLine = "Trying to load list of catagories from Dropbox";
        var endingStatusLine = "list of catagories loaded successfully from Dropbox";
        var infoNotFoundMsg = "Performance data not found in Dropbox";
        var fileName = "digit_span_catagories_array.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine,endingStatusLine,infoNotFoundMsg,fileName);
        if(jsonString == null) {
            return [];
        } else {
            var catagoryArray = JSON.parse(jsonString);
            return catagoryArray;    
        }
    }

    doAuthentication() {
        return this.dbxAuth.getAuthenticationUrl(this.redirectUri, undefined, 'code', 'offline', undefined, undefined, true)
            .then(authUrl => {
                window.localStorage.removeItem("accessToken");
                window.localStorage.removeItem("refreshToken");

                window.localStorage.setItem("codeVerifier", this.dbxAuth.codeVerifier);
                window.open(authUrl);
            })
            .catch((error) => {
                throw error
            });
    }
    async generateAccessToken(accessCode) {
        this.dbxAuth.setCodeVerifier(window.localStorage.getItem('codeVerifier'));
        await this.dbxAuth.getAccessTokenFromCode(this.redirectUri, accessCode)
            .then((response) => {
                const accessToken = response.result.access_token;
                const refreshToken = response.result.refresh_token;
                window.localStorage.setItem("accessToken", accessToken);
                window.localStorage.setItem("refreshToken", refreshToken);
                this.dbxAuth.setAccessToken(accessToken);
                this.dbxAuth.setRefreshToken(refreshToken);
                this.dbx = new Dropbox.Dropbox({
                    auth: this.dbxAuth
                });
            })
            .catch((error) => {
                throw error;
            });
    }

    setUpDbx() {
        if (this.dbx) {
            return; //If We recreate dbx it returns: "error_summary":"expired_access_token/" error, I don't know why
        }
        const codeVerifier = window.localStorage.getItem('codeVerifier');
        const accessToken = window.localStorage.getItem("accessToken");
        const refreshToken = window.localStorage.getItem("refreshToken");
        if (accessToken === null) {
            throw new NoAccessTokenError();
        }
        this.dbxAuth.setCodeVerifier(codeVerifier);
        this.dbxAuth.setAccessToken(accessToken);
        this.dbxAuth.setRefreshToken(refreshToken);
        this.dbx = new Dropbox.Dropbox({
            auth: this.dbxAuth
        });
    }

    async savePerfRecord(performanceRecord) {
        this.guiController.setSavingStatusLine("Trying to upload data to Dropbox");
        this.setUpDbx();
        var fileContent = JSON.stringify(performanceRecord);
        var args = {
            contents: fileContent,
            path: "/digit_span_perf_record.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        if (!this.dbx) throw new NoAccessTokenError();

        await this.dbx.filesUpload(args);
        this.guiController.setSavingStatusLine("Uploaded data to Dropbox");
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

    setCatagoryComponent(catagoryComponent) {
        this.catagoryComponent = catagoryComponent;
    }

    addTrailCatagory(name) {
        this.catagoryComponent.setState((state, props) => {
            var newArray = [...state.catagoryNamesArray]; //copy array because setState runs twice under <React.StrictMode>
            newArray.push(name);
            var result = {catagoryNamesArray: newArray };
            return result;
          });
    }

    removeTrailCatagory(name) {
        this.catagoryComponent.setState((state, props) => {
            var newArray = [...state.catagoryNamesArray]; //copy array because setState runs twice under <React.StrictMode>
            var callback = (currentValue) => { return currentValue !== name };
            newArray = newArray.filter(callback);    
            var result = {catagoryNamesArray: newArray };
            return result;
          });
    }

    setSelectedCatagory(name) {
        this.catagoryComponent.setSelectedCatagory(name);
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

    setErrorMessage(msg) {
        this.appComponent.setState({ errorMsg: msg });
    }

    setSavingStatusLine(msg) {
        this.appComponent.setState({ savingStatusLine: msg });
    }

    setStorageTypeButton(storageTypeStr) {
        this.appComponent.setStorageTypeButton(storageTypeStr);
    }

    updateGUI(){
        this.appComponent.forceUpdate();
    }
}

var appEngine = new AppEngine(new ReactGui());

export { appEngine, SetRecord };