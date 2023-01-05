// for reference: https://timodenk.com/blog/digit-span-test-online-tool/
import { names, serverMsgs, dbColumnNames } from './repeatedStrings.js'
import { Dropbox, DropboxAuth, DropboxResponseError } from "dropbox"

class SetRecord {
    constructor() {
        this.setRecordArray = [];
        this.category = "";
        this.maxScore = 0;
    }

    getMaxScore() {
        return this.maxScore;
    }

    setMaxScore(maxScore) {
        this.maxScore = maxScore;
    }

    getAverageScore() {
        var sum = 0;
        for (var score of this.setRecordArray) {
            sum += score;
        }
        return sum / this.setRecordArray.length;
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

    getCategory() {
        return this.category;
    }

    setCategory(categoryName) {
        this.category = categoryName;
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
            setRecord.setMaxScore(unTypedSetRecord.maxScore);
            for (let score of unTypedSetRecord.setRecordArray) {
                setRecord.addScore(score);
            }
            setRecord.setCategory(unTypedSetRecord.category);
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
        this.customStorage = new CustomStorage(guiController);
        this.longTermStorage = this.dropboxStorage;
        this.trailCategoryArray = [];
        this.currentCategory = names.noCategory;
    }

    getLongTermStorage() {
        return this.longTermStorage;
    }

    getDropboxStorage() {
        return this.dropboxStorage;
    }

    getPerformanceRecord() {
        return this.performanceRecord;
    }

    getCustomStorage() {
        return this.customStorage;
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
            if (this.currentCategory !== names.noCategory) {
                this.currentSetRecord.setCategory(this.currentCategory);
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
        } else if (localStorage.storageType === names.digitSpanPracticeServer) {
            this.switchToCustomStorage();
        }

        await this.loadLongTermStorage();
    }

    async loadLongTermStorage() {
        try {
            this.guiController.setErrorMessage("");
            if (this.longTermStorage instanceof CustomStorage) {
                await this.longTermStorage.loadDataSizeLimits();
            }
            await this.loadPerfRecord();
            await this.loadCategoryData();
        } catch (e) {
            this.guiController.setSavingStatusLine("");
            this.processException(e);
        }
    }

    async loadCategoryData() {
        this.trailCategoryArray = await this.longTermStorage.loadCategoryArray();
        for (const trailCategory of this.trailCategoryArray) {
            this.guiController.addTrailCategory(trailCategory);
        }
        this.currentCategory = await this.longTermStorage.loadCurrentCategory();
        this.guiController.setSelectedCategory(this.currentCategory);
    }

    async loadPerfRecord() {
        this.performanceRecord = await this.longTermStorage.loadPerfRecord();
        this.guiController.updateGUI();
    }

    processException(e) {
        if (e instanceof DropboxResponseError) {
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
        this.currentSetRecord.setMaxScore(numOfDigits);
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
        this.guiController.setStorageTypeMenu(names.dropbox);
        this.longTermStorage = this.dropboxStorage;
    }

    switchToBrowserStorage() {
        localStorage.setItem("storageType", names.browserStorage);
        this.guiController.setStorageTypeMenu(names.browserStorage);
        this.longTermStorage = new BrowserStorage();
    }

    switchToCustomStorage() {
        localStorage.setItem("storageType", names.digitSpanPracticeServer);
        this.guiController.setStorageTypeMenu(names.digitSpanPracticeServer);
        this.longTermStorage = this.customStorage;
    }

    isUsingCustomStorage() {
        return localStorage.getItem("storageType") === names.digitSpanPracticeServer;
    };

    async saveEverything() {
        try {
            await this.longTermStorage.savePerfRecord(this.getPerformanceRecord());
            this.longTermStorage.saveTrailCategories(this.trailCategoryArray);
            this.longTermStorage.saveCurrentCategory(this.currentCategory);
        } catch (e) {
            this.guiController.setSavingStatusLine("");
            this.processException(e);
        }

    }

    addTrailCategory(name) {
        this.trailCategoryArray.push(name);
        this.guiController.addTrailCategory(name);
        this.longTermStorage.saveTrailCategories(this.trailCategoryArray);
    }
    removeTrailCategory(name, saveToStorage = true) {
        var callback = (currentValue) => { return currentValue !== name };
        this.trailCategoryArray = this.trailCategoryArray.filter(callback);
        this.guiController.removeTrailCategory(name);
        if (this.currentCategory === name) {
            this.switchToCategory(names.noCategory);
        }
        if (saveToStorage) {
            this.longTermStorage.saveTrailCategories(this.trailCategoryArray);
        }

    }

    getCurrentCategory() {
        return this.currentCategory;
    }

    switchToCategory(name) {
        this.currentCategory = name;
        this.longTermStorage.saveCurrentCategory(name);
        this.guiController.updateGUI();
    }

    getTrailCategories() {
        return this.trailCategoryArray;
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

    static getCategoriesItemName() {
        return "trailCategoriesLocalStorage";
    }

    static getCurrentCategoryItemName() {
        return "currentCategoryLocalStorage";
    }

    saveTrailCategories(categoriesArray) {
        var jsonString = JSON.stringify(categoriesArray);
        window.localStorage.setItem(BrowserStorage.getCategoriesItemName(), jsonString);
    }

    saveCurrentCategory(currentCategory) {
        window.localStorage.setItem(BrowserStorage.getCurrentCategoryItemName(), currentCategory);
    }

    loadCurrentCategory() {
        return window.localStorage.getItem(BrowserStorage.getCurrentCategoryItemName());
    }

    loadCategoryArray() {
        const jsonString = window.localStorage.getItem(BrowserStorage.getCategoriesItemName());
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
        this.dbxAuth = new DropboxAuth({
            clientId: CLIENT_ID,
        });
        this.guiController = guiController;
    }

    async saveTrailCategories(categoriesArray) {
        this.guiController.setSavingStatusLine("Trying to upload data to Dropbox");
        this.setUpDbx();
        var fileContent = JSON.stringify(categoriesArray);
        var args = {
            contents: fileContent,
            path: "/digit_span_categories_array.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        if (!this.dbx) throw new NoAccessTokenError();

        await this.dbx.filesUpload(args);
        this.guiController.setSavingStatusLine("Uploaded data to Dropbox");
    }

    async saveCurrentCategory(currentCategory) {
        this.guiController.setSavingStatusLine("Trying to upload data to Dropbox");
        this.setUpDbx();
        var fileContent = JSON.stringify(currentCategory);
        var args = {
            contents: fileContent,
            path: "/digit_span_current_category.json",
            mode: { ".tag": "overwrite" },
            autorename: true,
            mute: true,
            strict_conflict: false,
        }
        if (!this.dbx) throw new NoAccessTokenError();

        await this.dbx.filesUpload(args);
        this.guiController.setSavingStatusLine("Uploaded data to Dropbox");
    }

    async loadCurrentCategory() {
        var startingStatusLine = "Trying to load current category from Dropbox";
        var endingStatusLine = "Current category loaded successfully from Dropbox";
        var infoNotFoundMsg = "Current category information not found in Dropbox";
        var fileName = "digit_span_current_category.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine, endingStatusLine, infoNotFoundMsg, fileName);
        if (jsonString == null) {
            return names.noCategory;
        } else {
            var currentCategory = JSON.parse(jsonString);
            return currentCategory;
        }
    }

    async loadPerfRecord() {
        var startingStatusLine = "Trying to load performance data from Dropbox";
        var endingStatusLine = "Performance data from Dropbox loaded successfully";
        var infoNotFoundMsg = "Performance data not found in Dropbox";
        var fileName = "digit_span_perf_record.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine, endingStatusLine, infoNotFoundMsg, fileName);
        var performanceRecord = new PerformanceRecord();
        if (jsonString != null) {
            performanceRecord.populateFromJson(jsonString);
        }
        return performanceRecord;
    }


    async downloadFromDropbox(startingStatusLine, endingStatusLine, infoNotFoundMsg, fileName) {
        this.guiController.setSavingStatusLine(startingStatusLine);
        var args = {
            path: "/" + fileName,
        }
        this.setUpDbx();
        try {
            //When the file does not exist, a error message is written to the firefox console ("409 Conflict"), consider checking if the file exist using "filesListFolder(arg)", see https://stackoverflow.com/questions/58289223/checking-file-existence-dropbox-api-v2
            var ans = await this.dbx.filesDownload(args);
        } catch (e) {
            if (e.error && e.error.error_summary &&
                e.error.error_summary.substring(0, 15) === "path/not_found/") {
                this.guiController.setSavingStatusLine(infoNotFoundMsg);
                return null;
            }
            throw e;
        }
        var jsonString = await ans.result.fileBlob.text();
        this.guiController.setSavingStatusLine(endingStatusLine);
        return jsonString;
    }

    async loadCategoryArray() {
        var startingStatusLine = "Trying to load list of categories from Dropbox";
        var endingStatusLine = "list of categories loaded successfully from Dropbox";
        var infoNotFoundMsg = "Performance data not found in Dropbox";
        var fileName = "digit_span_categories_array.json";
        const jsonString = await this.downloadFromDropbox(startingStatusLine, endingStatusLine, infoNotFoundMsg, fileName);
        if (jsonString == null) {
            return [];
        } else {
            var categoryArray = JSON.parse(jsonString);
            return categoryArray;
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
                this.dbx = new Dropbox({
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
        this.dbx = new Dropbox({
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

class CustomStorage {
    constructor(guiController) {
        this.guiController = guiController;
    }

    async deleteAccount() {
        var requestBody = {
            requestType: "deleteAccount",
            accessToken: this.getAccessToken(),
        }
        await this.makeRequest("POST", null, requestBody);
        this.deleteLoginData();
    }


    checkCategoriesSize (categoryArray) {
        var result = {};
        result.arrayDataSize = JSON.stringify(categoryArray).length;
        result.sizeLimit = this.dataSizeLimits[dbColumnNames.trailCategories] ;
        result.isDataTooBig = result.arrayDataSize > result.sizeLimit;
        return result;
    }

    logIn(userName, password, reportLogin = true) {
        var requestBody = {
            requestType: "login",
            userName: userName,
            password: password
        }
        var customStorage = this;
        const myRequest = new Request(customStorage.getServerUrl(),
            { method: "POST", body: JSON.stringify(requestBody) });
        fetch(myRequest)
            .then((response) => {
                if (!response.ok && response.status !== 404) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                response.json().then(function (json) {
                    if (reportLogin) {
                        customStorage.guiController.popUpMessage(json.resultStr);
                    }
                    if (json.resultStr === "Login Successful") {
                        customStorage.setAccessToken(json.accessToken);
                        customStorage.setUserName(userName);
                        customStorage.guiController.goToMainScreen();
                    };
                });

            }).catch(error => {
                console.error(error);
            });
    }

    getServerUrl() {
        return 'http://localhost:6001';
    }
    getAccessToken() {
        return window.localStorage.getItem(CustomStorage.getAccessTokenKey());
    }

    setAccessToken(accessToken) {
        window.localStorage.setItem(CustomStorage.getAccessTokenKey(), accessToken);
    }

    static getAccessTokenKey() {
        return "customAccessToken";
    }

    static getUserNameKey() {
        return "userNameKey";
    }

    isLoggedIn() {
        return this.getUserName() != null;
    }

    deleteLoginData () {
        window.localStorage.removeItem(CustomStorage.getAccessTokenKey());
        window.localStorage.removeItem(CustomStorage.getUserNameKey());
    }

    logout() {
        this.deleteLoginData();
        this.guiController.updateGUI();
    }

    getUserName() {
        return window.localStorage.getItem(CustomStorage.getUserNameKey());
    }

    setUserName(userName) {
        window.localStorage.setItem(CustomStorage.getUserNameKey(), userName);
    }

    async makeRequest(method, requestHeader, requestBody, needsAccessToken = true) {
        if (needsAccessToken && this.getAccessToken() == null) {
            return null;
        }
        var options = { method: method };
        if (requestHeader) {
            options.headers = requestHeader;
        }
        if (requestBody) {
            options.body = JSON.stringify(requestBody);
        }
        const myRequest = new Request(this.getServerUrl(),
            options);

        const responseJson = await fetch(myRequest)
            .then(async (response) => {
                const json = await response.json();
                if (!response.ok && response.status !== 404) {
                    this.guiController.popUpMessage("server error, result message: " + json.resultStr);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                if (json.resultStr === serverMsgs.accessTokenExpired) {
                    this.logout();
                }
                return json;

            }).catch(error => {
                console.error(error);
            });

        return responseJson;
    }

    async loadDataSizeLimits() {
        var requestHeader = {
            requestType: "getDataSizeLimits",
        }
        const responseJson = await this.makeRequest("GET", requestHeader, null, false);
        this.dataSizeLimits = responseJson.dataSizeLimits;
    }

    getCategorySizeLimit() {
        return this.dataSizeLimits[dbColumnNames.currentCategory];
    }

    async loadPerfRecord() {
        var performanceRecord = new PerformanceRecord();

        var requestHeader = {
            requestType: "getPerformanceRecord",
            accessToken: this.getAccessToken(),
        }
        const responseJson = await this.makeRequest("GET", requestHeader);

        if (responseJson != null && responseJson.performanceRecord) {
            performanceRecord.populateFromJson(responseJson.performanceRecord);
        }
        return performanceRecord;
    }

    async savePerfRecord(performanceRecord) {

        var requestBody = {
            requestType: "setPerformanceRecord",
            accessToken: this.getAccessToken(),
            performanceRecord: performanceRecord,
        }

        this.makeRequest("POST", null, requestBody);
    }

    saveTrailCategories(categoriesArray) {
        var jsonString = JSON.stringify(categoriesArray);

        var requestBody = {
            requestType: "saveTrailCategories",
            accessToken: this.getAccessToken(),
            categoriesArray: jsonString,
        }
        this.makeRequest("POST", null, requestBody);
    }

    saveCurrentCategory(currentCategory) {
        var requestBody = {
            requestType: "saveCurrentCategory",
            accessToken: this.getAccessToken(),
            currentCategory: currentCategory,
        }
        this.makeRequest("POST", null, requestBody);
    }

    async loadCurrentCategory() {
        var requestHeader = {
            requestType: "getCurrentCategory",
            accessToken: this.getAccessToken(),
        }

        const responseJson = await this.makeRequest("GET", requestHeader);
        if (responseJson == null || responseJson.currentCategory == null) {
            return names.noCategory;
        } else {
            return responseJson.currentCategory;
        }

    }

    async loadCategoryArray() {
        var requestHeader = {
            requestType: "getTrailCategories",
            accessToken: this.getAccessToken(),
        }

        const responseJson = await this.makeRequest("GET", requestHeader);

        if (responseJson == null || responseJson.categoriesArray == null) {
            return [];
        } else {
            return JSON.parse(responseJson.categoriesArray);
        }
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

    setCategoryComponent(categoryComponent) {
        this.categoryComponent = categoryComponent;
    }

    addTrailCategory(name) {
        this.categoryComponent.setState((state, props) => {
            var newArray = [...state.categoryNamesArray]; //copy array because setState runs twice under <React.StrictMode>
            if (!newArray.includes(name)) { // loadCategoryData runs twice under <React.StrictMode>
                newArray.push(name);
            }
            var result = { categoryNamesArray: newArray };
            return result;
        });
    }

    removeTrailCategory(name) {
        this.categoryComponent.setState((state, props) => {
            var newArray = [...state.categoryNamesArray]; //copy array because setState runs twice under <React.StrictMode>
            var callback = (currentValue) => { return currentValue !== name };
            newArray = newArray.filter(callback);
            var result = { categoryNamesArray: newArray };
            return result;
        });
    }

    setSelectedCategory(name) {
        this.categoryComponent.setSelectedCategory(name);
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

    setStorageTypeMenu(storageTypeStr) {
        this.appComponent.setStorageTypeMenu(storageTypeStr);
    }

    updateGUI() {
        this.appComponent.forceUpdate();
    }

    popUpMessage(msg) {
        alert(msg);
    }

    goToMainScreen() {
        window.location.href = '/';
    }
}

var appEngine = new AppEngine(new ReactGui());

export { appEngine, SetRecord };