import React from 'react';
import ScoreChart from './scoreChart.js'
import './mystyle.css'

class InputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
    if (this.props.typePassword) {
      this.inputType = "password";
    } else {
      this.inputType = "text";
    }
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
        <input name={"input" + this.props.nameSuffix} type={this.inputType} onChange={this.handleChange}
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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { numToRecall: '12345', isInputMode: true };
    this.startButton = React.createRef();
    this.saveSettingButton = React.createRef();
  }

  focusStartButton = () => {
    this.startButton.current.focus();
  }

  componentDidMount() {
    this.props.appEngine.getGuiController().setAppComponent(this);
    this.props.appEngine.onPageLoad();
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

  setWebDavUrl = (webDavUrl) => {
    this.webDavUrlField = webDavUrl;
    this.AdjustDisableStatus();
  }

  setWebDavUserName = (webDavUserName) => {
    this.webDavUserNameField = webDavUserName;
    this.AdjustDisableStatus();
  }

  setWebDavPassword = (webDavPassword) => {
    this.webDavPasswordField = webDavPassword;
    this.AdjustDisableStatus();
  }

  AdjustDisableStatus = () => {
    var appEngine = this.props.appEngine;
    var guiController = appEngine.getGuiController();
    var shouldDisable = guiController.getNumOfDigits() === this.numLengthField &&
      guiController.getNumOfReps() === this.numOfRepsField &&
      guiController.getWebDavUrl() === this.webDavUrlField &&
      guiController.getWebDavUserName() === this.webDavUserNameField &&
      guiController.getWebDavPassword() === this.webDavPasswordField;
    if (shouldDisable) {
      this.saveSettingButton.current.disabled = true;
    } else {
      this.saveSettingButton.current.disabled = false;
    }

  }

  saveSettings = () => {
    var appEngine = this.props.appEngine;
    var guiController = appEngine.getGuiController();
    guiController.setNumOfDigits(this.numLengthField);
    appEngine.rememberNumOfDigits();

    guiController.setNumOfReps(this.numOfRepsField);
    appEngine.rememberNumOfReps();

    guiController.setWebDavUrl(this.webDavUrlField);
    appEngine.rememberWebDavUrl();

    guiController.setWebDavUserName(this.webDavUserNameField);
    appEngine.rememberWebDavUserName();

    guiController.setWebDavPassword(this.webDavPasswordField);
    appEngine.rememberWebDavPassword();

    var shouldUpdateWebDav = guiController.getWebDavUrl() !== this.webDavUrlField ||
    guiController.getWebDavPassword() !== this.webDavPasswordField ||
    guiController.getWebDavUserName() !== this.webDavUserNameField;

    appEngine.setUpWebDav();

    this.AdjustDisableStatus();

  }

  render() {
    var mainDisplay;
    if (this.state.isInputMode) {
      mainDisplay = <InputForm nameSuffix="_Digits" focusOnStart onSubmit={this.checkAnswer} />;
    } else {
      mainDisplay = <p id="numConsole">{this.state.numToRecall}</p>;
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
          <p>WebDAV URL:</p>
          <InputForm nameSuffix="_WebDavUrl" onChange={this.setWebDavUrl} defaultValue={this.state.defaultWebDavUrl} />
          <p>WebDAV User name:</p>
          <InputForm nameSuffix="_WebDavUserName" onChange={this.setWebDavUserName} defaultValue={this.state.defaultWebDavUserName} />
          <p>WebDAV Password:</p>
          <InputForm nameSuffix="_WebDavPassword" typePassword
            onChange={this.setWebDavPassword} defaultValue={this.state.defaultWebDavPassword} />

          <button id="saveSettings" type="button" onClick={this.saveSettings} ref={this.saveSettingButton}>Save Settings</button>
        </div>
        <div id="scoreChart">
          <ScoreChart performenceRecord={this.props.appEngine.getPerformanceRecord()} />
        </div>
      </>
    );
  }
}

export default App;
