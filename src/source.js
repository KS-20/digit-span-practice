// for reference: https://timodenk.com/blog/digit-span-test-online-tool/

class AppEngine {
    constructor(guiController) {
        this.numToRecall = "";
        this.guiController = guiController;
    }

    getGuiController() {
        return this.guiController;
    }

    onSubmitAnswer() {
        var str = this.guiController.getInput();
        if (str === this.numToRecall) {
            alert("Good job! you put the correct answer: " + str);
        } else {
            alert("wrong!, you submitted: " + str + " but the answer is: " + this.numToRecall)
        }

        this.prepareForQuestion()
        return false;
    }



    onPageLoad() {
        if (localStorage.numOfDigits) {
            this.guiController.setNumOfDigitsField(localStorage.numOfDigits);
        }
        this.prepareForQuestion();
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
    setAppComponent(appComponent){
        this.appComponent = appComponent;
    }

    setInput(input){
        this.input = input;
    }

    getInput() {
        return this.input;
    }

    prepareForAns() {
        this.appComponent.setState( {isInputMode: true} ) 
    }

    getNumOfDigits() {
        return 2;
    }

    getInputObj() {
    }

    getDisplayObj() {
    }

    setNumOfDigitsField(numOfDigits) {
    }
    activateDisplayMode() {
    }

    setNumToRecall(numToRecall) {
        var stateToSet = {numToRecall: numToRecall, isInputMode: false};
        this.appComponent.setState(stateToSet ) 
        //console.log(this.appComponent.state);
    }

}

/* exported appEngine */

var appEngine = new AppEngine(new ReactGui());

export default appEngine;