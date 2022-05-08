import React from 'react';
import ScoreChart from './scoreChart.js'
import './mystyle.css'
import { names } from './names.js'
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
        <input name={"input" + this.props.nameSuffix} type={"text"} onChange={this.handleChange}
          defaultValue={this.props.defaultValue} ref={(input) => { this.nameInput = input; }} />
      </form>
    );
  }
}

InputForm.defaultProps = {
  onSubmit: () => { },
  onChange: () => { },
  defaultValue: "",
  nameSuffix: "",
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

class App extends React.Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<PracticeScreen appEngine={this.props.appEngine} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>)
  }
}

class TrailCatagoryWidget extends React.Component {
  constructor(props) {
    super(props);
    this.catagorySelectMenu = React.createRef();
    this.catagoryRemoveMenu = React.createRef();
    this.state = {catagoryNamesArray: []};
    this.catagoryWasAdded=false;
  }

  async componentDidMount() {
    this.props.appEngine.getGuiController().setCatagoryComponent(this);
  }

  addCatagory = (event) => {
    event.preventDefault();
    var catagorySelectMenu = this.catagorySelectMenu.current
    var options = catagorySelectMenu.options;
    for (var i = 0; i < catagorySelectMenu.length; ++i) {
      if (options[i].text === this.catagoryToAdd) {
        return;
      }
    }
    this.props.appEngine.addTrailCatagory(this.catagoryToAdd);
    this.props.appEngine.switchToCatagory(this.catagoryToAdd);

    this.catagoryWasAdded = true;
  }

  removeCatagory = (event) => {
    event.preventDefault();
    var name = this.catagoryRemoveMenu.current.value;
    this.props.appEngine.removeTrailCatagory(name)
  }

  setSelectedCatagory(name) {
    var catagorySelectMenu = this.catagorySelectMenu.current
    var options = catagorySelectMenu.options;
    for (var i = 0; i < catagorySelectMenu.length; ++i) {
      if (options[i].text === name) {
        catagorySelectMenu.selectedIndex = i;
        return;
      }
    }
  }

  switchToCatagory = (event) => {
    var name = this.catagorySelectMenu.current.value;
    this.props.appEngine.switchToCatagory(name);
  }

  componentDidUpdate(){
    if(this.catagoryWasAdded){
      var catagorySelectMenu = this.catagorySelectMenu.current;
      catagorySelectMenu.selectedIndex = catagorySelectMenu.length-1;
      this.catagoryWasAdded = false;
    }
  }

  render() {
    var options = [];
    for (var catagoryName of this.state.catagoryNamesArray) {
      options.push(<option key={catagoryName} value={catagoryName}>{catagoryName}</option>);
    }
    return (<>
      <form>
        <label htmlFor="catagorySelect">Switch to catagory:  </label>
        <select onInput={this.switchToCatagory} name="catagorySelect" id="catagorySelect" ref={this.catagorySelectMenu}>
          <option value="None">None</option>
          {options}
        </select>
      </form>
      <form onSubmit={this.addCatagory}>
        <label htmlFor="fname">Add trail catagory: </label>
        <input type="text" id="fname" name="fname" onChange={(event) => { this.catagoryToAdd = event.target.value }} />
        <input type="submit" value="Add" />
      </form>

      <form>
        <label htmlFor="catagoryRemove">Remove catagory:   </label>
        <select name="catagoryRemove" id="catagoryRemove" ref={this.catagoryRemoveMenu}>
        {options}
        </select>
        <input onClick={this.removeCatagory} type="submit" value="remove" />
      </form>
    </>
    )
  }
}

class PracticeScreen extends React.Component {
  constructor(props) {
    super(props);
    console.log("Starting digit span practice app");
    this.state = { numToRecall: '12345', isInputMode: true, savingStatusLine: "" };
    this.requestAccessCode = false;
    this.startButton = React.createRef();
    this.saveSettingButton = React.createRef();
    this.storageTypeButton = React.createRef();

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

  setStorageTypeButton = (storageTypeStr) => {
    this.storageTypeButton.current.value = storageTypeStr;
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
    } else {
      console.error("Invalid string");
    }
    await appEngine.saveEverything();

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
          <button id="startPractice" type="button" autoFocus onClick={() => this.props.appEngine.startPracticeSet()}
            ref={this.startButton}>
            start practice </button>
          <p>length of number:</p>
          <InputForm nameSuffix="_NumLen" onChange={this.setNumLengthField} defaultValue={this.state.defaultNumSize} />
          <p>Number of reps:</p>
          <InputForm nameSuffix="_RepCount" onChange={this.setNumOfRepsField} defaultValue={this.state.defaultRepNum} />
          <button id="saveSettings" type="button" onClick={this.saveSettings} ref={this.saveSettingButton}>Save Settings</button>
          <form>
            <label htmlFor="dataSource">Save and Load to  </label>
            <select onInput={this.setStorageTech} name="dataSource" id="dataSource" ref={this.storageTypeButton}>
              <option value={names.dropbox}>{names.dropbox}</option>
              <option value={names.browserStorage}>{names.browserStorage}</option>
            </select>
          </form>

          <div id="dropboxLine">
            <button id="setUpDropbox" type="button" onClick={this.setUpDropbox} >Set up Dropbox Storage</button>
            <div>{this.state.savingStatusLine}</div>
          </div>
          <div id="errorConsole">
            {errorElements}
          </div>
          <TrailCatagoryWidget appEngine={this.props.appEngine}/>

          <Link to="/about">About this task</Link>
        </div>
        <div id="scoreChart">
          <ScoreChart performenceRecord={this.props.appEngine.getPerformanceRecord()} 
          currentCatagory={this.props.appEngine.getCurrentCatagory()} />
        </div>
      </>
    );
  }
}

export default App;
