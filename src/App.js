import React from 'react';
import ScoreChart from './scoreChart.js'
import './mystyle.css'
import { names } from './repeatedStrings.js'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

class InputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
  }
  componentDidMount() {
    if (this.props.focusOnStart) {
      this.nameInput.focus();
    }
  }

  handleChange = (event) => {
    var currentValue = event.target.value;
    this.setState({ value: currentValue });
    this.props.onChange(currentValue);
  }

  onSubmit = (event) => {
    this.props.onSubmit(this.state.value)
    event.preventDefault();
  }

  render() {
    return (
      <form name={"form" + this.props.nameSuffix} onSubmit={this.onSubmit} >
        <input name={"input" + this.props.nameSuffix} type={this.props.inputType}
          onChange={this.handleChange} defaultValue={this.props.defaultValue}
          ref={(input) => { this.nameInput = input; }} />
      </form>
    );
  }
}

InputForm.defaultProps = {
  onSubmit: () => { },
  onChange: () => { },
  defaultValue: "",
  nameSuffix: "",
  inputType: "text",
}

class AboutPage extends React.Component {
  render() {
    return (
      <>
        <p>Digit span is a measure of short term and working memory ,
          it is bascially the number of digits a person can remember, Reportedly most can remember between 5-9,
          But a <a href="https://www.science.org/doi/abs/10.1126/science.7375930">study</a> trained someone to recall up to 79 digit,
          and a <a href="http://help.cambridgebrainsciences.com/en/articles/624895-what-is-the-digit-span-test">world record</a> was set for 3029 digits.</p>
        <Link to="/">Back to main screen</Link>
      </>
    )
  }
}

class SignUpPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { userNameValue: "", passwordValue: "" };
  }

  setUserName = (userNameValue) => {
    this.setState({ userNameValue: userNameValue });

  }

  setPassword = (passwordValue) => {
    this.setState({ passwordValue: passwordValue });
  }

  tryToSignUp = (event) => {
    event.preventDefault();
    const userNameValue = this.state.userNameValue;
    const passwordValue = this.state.passwordValue;
    if (userNameValue === '') {
      alert("Please enter a user name before siging up");
      return;
    }
    if (passwordValue === '') {
      alert("Please enter a password before siging up");
      return;
    }
    var requestBody = {
      requestType: "signup",
      userName: userNameValue,
      password: passwordValue
    }
    var customStorage = this.props.appEngine.getCustomStorage();
    const myRequest = new Request(customStorage.getServerUrl(),
      { method: "POST", body: JSON.stringify(requestBody) });
    var processSignUpResult = this.genSignUpHelper(customStorage, userNameValue, passwordValue);
    fetch(myRequest)
      .then(processSignUpResult).catch(error => {
        console.error(error);
      });

  }

  genSignUpHelper(customStorage, userName, password) {
    return (response) => {
      if (!response.ok && response.status !== 409) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      response.json().then(function (json) {
        alert(json.resultStr);
        if (json.resultStr === "Created new User") {
          customStorage.logIn(userName, password, false);
        }
      });
    }
  }

  render() {
    var divStyle = { display: "grid", gridTemplateColumns: "100px" }
    return (
      <>
        <div style={divStyle}>
          <p>User Name:</p>
          <InputForm nameSuffix="_userNameForSignUp" onChange={this.setUserName} />
          <p>Password</p>
          <InputForm nameSuffix="_passwordForSignUp" onChange={this.setPassword}
            inputType="password" />
          <input type="submit" value="Sign up" onClick={this.tryToSignUp} />

          <Link to="/">Back to main screen</Link>
        </div>
      </>
    )
  }
}

class LoginPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { userNameValue: "", passwordValue: "" };
  }

  setUserName = (userNameValue) => {
    this.setState({ userNameValue: userNameValue });

  }

  setPassword = (passwordValue) => {
    this.setState({ passwordValue: passwordValue });
  }

  tryTologin = (event) => {
    event.preventDefault();
    if (this.state.userNameValue === '') {
      alert("Please enter a user name before logging in");
      return;
    }
    if (this.state.passwordValue === '') {
      alert("Please enter a password before logging in");
      return;
    }
    var customStorage = this.props.appEngine.getCustomStorage();
    customStorage.logIn(this.state.userNameValue, this.state.passwordValue);
  }

  render() {
    var divStyle = { display: "grid", gridTemplateColumns: "100px" }
    return (
      <>
        <div style={divStyle}>
          <p>User Name:</p>
          <InputForm nameSuffix="_userNameForLogin" onChange={this.setUserName} />
          <p>Password</p>
          <InputForm nameSuffix="_passwordForLogin" onChange={this.setPassword}
            inputType="password" />
          <input id="logIn" type="submit" value="log in" onClick={this.tryTologin} />

          <Link to="/">Back to main screen</Link>
        </div>
      </>
    )
  }
}



class App extends React.Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<PracticeScreen appEngine={this.props.appEngine} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signup" element={<SignUpPage appEngine={this.props.appEngine} />} />
          <Route path="/login" element={<LoginPage appEngine={this.props.appEngine} />} />

        </Routes>
      </Router>)
  }
}

function alertCategoriesSize (arrayDataSize, sizeLimit) {
  alert("The size of storing all the categories in the custom storage server is too big,"+
  " the size to store is "+arrayDataSize+" characters, but the maximum size is "+
  sizeLimit);
}


class TrailCategoryWidget extends React.Component {
  constructor(props) {
    super(props);
    this.categorySelectMenu = React.createRef();
    this.categoryRemoveMenu = React.createRef();
    this.state = { categoryNamesArray: [] };
    this.categoryWasAdded = false;
    this.categoryToAdd = "";
  }

  async componentDidMount() {
    this.props.appEngine.getGuiController().setCategoryComponent(this);
  }

  addCategory = async (event) => {
    event.preventDefault();
    if (this.categoryToAdd === "") {
      alert("Please enter the name of the category to add");
      return;
    }
    var appEngine = this.props.appEngine;
    var longTermStorage = appEngine.getLongTermStorage();
    if (appEngine.isUsingCustomStorage()) {
      var categorySizeLimit = longTermStorage.getCategorySizeLimit();
      if (this.categoryToAdd.length > categorySizeLimit) {
        alert("Size of current category must not exceed the maximum size set by the custom storage server of "
          + categorySizeLimit);
        return;
      }

      var categoriesArray = [...appEngine.getTrailCategories()];
      categoriesArray.push(this.categoryToAdd);
      var result = longTermStorage.checkCategoriesSize(categoriesArray);
      if (result.isDataTooBig) {
        alertCategoriesSize(result.arrayDataSize, result.sizeLimit);
        return;
      }  
    }

    var categorySelectMenu = this.categorySelectMenu.current
    var options = categorySelectMenu.options;
    for (var i = 0; i < categorySelectMenu.length; ++i) {
      if (options[i].text === this.categoryToAdd) {
        return;
      }
    }
    appEngine.addTrailCategory(this.categoryToAdd);
    appEngine.switchToCategory(this.categoryToAdd);

    this.categoryWasAdded = true;
  }

  removeCategory = (event) => {
    event.preventDefault();
    var name = this.categoryRemoveMenu.current.value;
    this.props.appEngine.removeTrailCategory(name)
  }

  setSelectedCategory(name) {
    var categorySelectMenu = this.categorySelectMenu.current
    var options = categorySelectMenu.options;
    for (var i = 0; i < categorySelectMenu.length; ++i) {
      if (options[i].text === name) {
        categorySelectMenu.selectedIndex = i;
        return;
      }
    }
  }

  switchToCategory = (event) => {
    var name = this.categorySelectMenu.current.value;
    this.props.appEngine.switchToCategory(name);
  }

  componentDidUpdate() {
    if (this.categoryWasAdded) {
      var categorySelectMenu = this.categorySelectMenu.current;
      categorySelectMenu.selectedIndex = categorySelectMenu.length - 1;
      this.categoryWasAdded = false;
    }
  }

  render() {
    var options = [];
    for (var categoryName of this.state.categoryNamesArray) {
      options.push(<option key={categoryName} value={categoryName}>{categoryName}</option>);
    }
    return (<>
      <form>
        <label htmlFor="categorySelect">Switch to category:  </label>
        <select onInput={this.switchToCategory} name="categorySelect" id="categorySelect" ref={this.categorySelectMenu}>
          <option value="None">None</option>
          {options}
        </select>
      </form>
      <form onSubmit={this.addCategory}>
        <label htmlFor="fname">Add trail category: </label>
        <input type="text" id="fname" name="fname" onChange={(event) => { this.categoryToAdd = event.target.value }} />
        <input type="submit" value="Add" />
      </form>

      <form>
        <label htmlFor="categoryRemove">Remove category:   </label>
        <select name="categoryRemove" id="categoryRemove" ref={this.categoryRemoveMenu}>
          {options}
        </select>
        <input onClick={this.removeCategory} type="submit" value="remove" />
      </form>
    </>
    )
  }
}

class CustomStorageControls extends React.Component {

  signUp = () => {
    window.location.href = '/signup';
  }

  login = () => {
    window.location.href = '/login';
  }

  logout = () => {
    this.props.customStorage.logout();
  }

  render() {
    var customStorage = this.props.customStorage;
    var elementToRender;
    if (customStorage.isLoggedIn()) {
      elementToRender = <div className="CustomStorageControls">
        <label>logged in as: {customStorage.getUserName()} </label>
        <button id="logout" type="button" onClick={this.logout} >
          Log out</button>
      </div>
    } else {
      elementToRender = <div className="CustomStorageControls">
        <button id="signIn" type="button" onClick={this.login} >Log In</button>
        <button id="login" type="button" onClick={this.signUp} >Sign Up</button>
      </div>;
    }
    return (
      <>
        {elementToRender}
      </>
    )
  }
}

class PracticeScreen extends React.Component {
  constructor(props) {
    super(props);
    console.log("Starting digit span practice app");
    this.state = {
      numToRecall: '12345', isInputMode: true, savingStatusLine: "",
      isUsingCustomStorage: this.props.appEngine.isUsingCustomStorage()
    };
    this.requestAccessCode = false;
    this.startButton = React.createRef();
    this.saveSettingButton = React.createRef();
    this.storageTypeMenu = React.createRef();

    this.setUpDropbox = this.setUpDropbox.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    document.removeEventListener("visibilitychange", document._visibilityEventHandler);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    document._visibilityEventHandler = this.handleVisibilityChange;

  }

  // window.prompt does not open in chrome when it's not the active tab (at least on certain conditions)
  // so we wait for the window to become visible, this is the error: https://chromestatus.com/feature/5637107137642496
  async handleVisibilityChange() {
    if (this.requestAccessCode && document.visibilityState === "visible") {
      this.requestAccessCode = false;
      var appEngine = this.props.appEngine;
      var dropboxStorage = appEngine.getDropboxStorage();
      var accessCode = prompt("Enter the access code provided by dropbox:");
      try {
        await dropboxStorage.generateAccessToken(accessCode);
        await appEngine.loadPerfRecord();
      } catch (e) {
        this.setState({ savingStatusLine: "" });
        appEngine.processException(e);
      }
    }
  }

  focusStartButton = () => {
    this.startButton.current.focus();
  }

  setStorageTypeMenu = (storageTypeStr) => {
    this.storageTypeMenu.current.value = storageTypeStr;
    this.storageTypeLastValue = storageTypeStr;
  }

  async componentDidMount() {
    this.startButton.current.disabled = true;
    this.props.appEngine.getGuiController().setAppComponent(this);
    await this.props.appEngine.onPageLoad();
    this.forceUpdate();
    this.startButton.current.disabled = false;
  }
  checkAnswer = (input) => {
    var appEngine = this.props.appEngine;
    appEngine.getGuiController().setInput(input);
    appEngine.onSubmitAnswer();
  }

  setNumLengthField = (length) => {
    this.numLengthField = length;
    this.AdjustDisableStatus();
  }

  setNumOfRepsField = (numOfReps) => {
    this.numOfRepsField = numOfReps;
    this.AdjustDisableStatus();
  }

  setStorageTech = async (event) => {
    var appEngine = this.props.appEngine;
    var sourceToSwitchTo = event.target.value;
    if (names.browserStorage === sourceToSwitchTo) {
      appEngine.switchToBrowserStorage();
    } else if (names.dropbox === sourceToSwitchTo) {
      appEngine.switchToDropboxStorage();
    } else if (names.digitSpanPracticeServer === sourceToSwitchTo) {
      if ( ! await this.handleSwitchToCustomStorage() ) {
        this.setStorageTypeMenu(this.storageTypeLastValue);
        return
      };
    } else {
      console.error("Invalid string");
    }

    if ( !appEngine.isUsingCustomStorage() ) {
      this.setState({ isUsingCustomStorage: false });
    }
    await appEngine.saveEverything();

  }

  handleSwitchToCustomStorage = async () => {
    var appEngine = this.props.appEngine;
    var customStorage = appEngine.getCustomStorage();
    await customStorage.loadDataSizeLimits();
    var categorySizeLimit = customStorage.getCategorySizeLimit();
    var categoriesArray = appEngine.getTrailCategories();

    var result = customStorage.checkCategoriesSize(categoriesArray);
    if (result.isDataTooBig) {
      alertCategoriesSize(result.arrayDataSize, result.sizeLimit);
      return false;
    }  

    var askToPrune = false;
    for (const categoryName of categoriesArray) {
      if (categoryName.length > categorySizeLimit) {
        askToPrune = true;
        break;
      }
    }

    if (askToPrune) {
      var shouldPrune = window.confirm("One or more of your categories exceeds the maximum number of characters allowed " +
        "by the custom storage server (" + categorySizeLimit + " characters) click OK to have the categories" +
        "removed, click cancel to not switch to the custom storage server");
      if (shouldPrune) {
        for (const categoryName of categoriesArray) {
          if (categoryName.length > categorySizeLimit) {
            appEngine.removeTrailCategory(categoryName,false);
          }
        }
      } else { 
        return false;
      };
    }
    this.setState({ isUsingCustomStorage: true });
    appEngine.switchToCustomStorage();
    return true;
  }

  AdjustDisableStatus = () => {
    var appEngine = this.props.appEngine;
    var shouldDisable = appEngine.getGuiController().getNumOfDigits() === this.numLengthField &&
      appEngine.getGuiController().getNumOfReps() === this.numOfRepsField;
    if (shouldDisable) {
      this.saveSettingButton.current.disabled = true;
    } else {
      this.saveSettingButton.current.disabled = false;
    }

  }

  saveSettings = () => {
    var appEngine = this.props.appEngine;
    appEngine.getGuiController().setNumOfDigits(this.numLengthField);
    appEngine.rememberNumOfDigits();

    appEngine.getGuiController().setNumOfReps(this.numOfRepsField);
    appEngine.rememberNumOfReps();
    this.AdjustDisableStatus();
  }

  async setUpDropbox() {
    var dropboxStorage = this.props.appEngine.getDropboxStorage();
    await dropboxStorage.doAuthentication();
    this.requestAccessCode = true;
  }

  render() {
    var mainDisplay;
    var appEngine = this.props.appEngine;
    var custonStorageControls = "";
    if (this.state.isUsingCustomStorage) {
      custonStorageControls = <CustomStorageControls customStorage={appEngine.getCustomStorage()} />
    }
    if (this.state.isInputMode) {
      mainDisplay = <InputForm nameSuffix="_Digits" focusOnStart onSubmit={this.checkAnswer} />;
    } else {
      mainDisplay = <p id="numConsole">{this.state.numToRecall}</p>;
    }
    let errorElements = [];
    if (this.state.errorMsg) {
      let errorLines = this.state.errorMsg.split("\n");
      let index = 0;
      for (const line of errorLines) {
        errorElements.push(<p key={index}>{line}</p>);
        index++;
      }
    }
    return (
      <>
        <div id="mainTerminal">
          {mainDisplay}
          <button id="startPractice" type="button" autoFocus onClick={() => appEngine.startPracticeSet()}
            ref={this.startButton}>
            start practice </button>
          <p>Length of number:</p>
          <InputForm nameSuffix="_NumLen" onChange={this.setNumLengthField} defaultValue={this.state.defaultNumSize} />
          <p>Number of reps:</p>
          <InputForm nameSuffix="_RepCount" onChange={this.setNumOfRepsField} defaultValue={this.state.defaultRepNum} />
          <button id="saveSettings" type="button" onClick={this.saveSettings} ref={this.saveSettingButton}>Save Settings</button>
          <form>
            <label htmlFor="dataStorageSelector">Save and Load to  </label>
            <select onInput={this.setStorageTech} name="dataStorageSelector" id="dataStorageSelector" ref={this.storageTypeMenu}>
              <option value={names.dropbox}>{names.dropbox}</option>
              <option value={names.browserStorage}>{names.browserStorage}</option>
              <option value={names.digitSpanPracticeServer}>{names.digitSpanPracticeServer}</option>
            </select>
          </form>
          {custonStorageControls}
          <div id="dropboxLine">
            <button id="setUpDropbox" type="button" onClick={this.setUpDropbox} >Set up Dropbox Storage</button>
            <div>{this.state.savingStatusLine}</div>
          </div>
          <div id="errorConsole">
            {errorElements}
          </div>
          <TrailCategoryWidget appEngine={appEngine} />

          <Link to="/about">About this task</Link>
        </div>
        <div id="scoreChart">
          <ScoreChart performenceRecord={appEngine.getPerformanceRecord()}
            currentCategory={appEngine.getCurrentCategory()} />
        </div>
      </>
    );
  }
}

export default App;
