// for reference: https://timodenk.com/blog/digit-span-test-online-tool/

class AppEngine {
    constructor() {
        this.numToRecall = "";
    }

    onSubmitAnswer() {
        var str = this.getInputObj().value
        if (str == this.numToRecall) {
            alert("Good job! you put the correct answer: " + str);
        } else {
            alert("wrong!, you submitted: " + str + " but the answer is: " + this.numToRecall)
        }

        this.prepareForQuestion()
        return false;
    }

    getInputObj() {
        return document.forms["form1"]["input1"];
    }

    getDisplayObj() {
        return document.getElementById("numToRemember");
    }

    onPageLoad() {
        if (localStorage.numOfDigits) {
            document.forms["form2"]["numOfDigits"].value = localStorage.numOfDigits;
        }
        this.prepareForQuestion();
    }

    prepareForQuestion() {
        this.getInputObj().style.display = "none";
        this.getDisplayObj().style.display = "block";

        var numOfDigits = this.getNumOfDigits();
        this.numToRecall = "";
        for (var i = 0; i < numOfDigits; ++i) {
            this.numToRecall += Math.floor(Math.random() * 10);
        }
        this.getDisplayObj().innerHTML = this.numToRecall;
        this.getInputObj().style.display = "none";
        var secondsToWait = numOfDigits * 1000;
        setTimeout(() => this.prepareForAns(), secondsToWait);
    }

    prepareForAns() {
        this.getInputObj().style.display = "block";
        this.getDisplayObj().style.display = "none";
    }

    getNumOfDigits() {
        return document.forms["form2"]["numOfDigits"].value
    }

    rememberNumOfDigits() {
        localStorage.setItem("numOfDigits", this.getNumOfDigits());
    }
}

/* exported appEngine */

var appEngine = new AppEngine(); 
