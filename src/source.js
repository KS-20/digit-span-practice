// for reference: https://timodenk.com/blog/digit-span-test-online-tool/

class AppEngine {
    constructor(guiController) {
        this.numToRecall = "";
        this.guiController = guiController;
    }

    getGuiController() {
        return this.guiController;
    }

    startPracticeSet() {
        this.currentRepIndex = 0;
        this.prepareForQuestion();
    }

    onSubmitAnswer() {
        var str = this.guiController.getInput();
        if (str === this.numToRecall) {
            alert("Good job! you put the correct answer: " + str);
        } else {
            alert("wrong!, you submitted: " + str + " but the answer is: " + this.numToRecall)
        }
        this.currentRepIndex++;
        if (this.currentRepIndex < this.guiController.getNumOfReps()) {
            this.prepareForQuestion();
        }

        return false;
    }

    onPageLoad() {
        if (localStorage.numOfDigits) {
            this.guiController.setNumOfDigitsField(localStorage.numOfDigits);
        } else {
            this.guiController.setNumOfDigitsField(2);
        }

        if(localStorage.numOfReps) {
            this.guiController.setNumOfRepsField(localStorage.numOfReps)
        } else {
            this.guiController.setNumOfRepsField(2);
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

    setNumOfDigitsField(numOfDigits) {
        this.setNumOfDigits(numOfDigits);
        this.appComponent.setState({ defaultNumSize: numOfDigits })
    }

    setNumOfRepsField(numOfReps) {
        this.setNumOfReps(numOfReps);
        this.appComponent.setState({ defaultRepNum: numOfReps })
    }


    activateDisplayMode() {
    }

    setNumToRecall(numToRecall) {
        var stateToSet = { numToRecall: numToRecall, isInputMode: false };
        this.appComponent.setState(stateToSet)
        //console.log(this.appComponent.state);
    }

}

var appEngine = new AppEngine(new ReactGui());

export default appEngine;