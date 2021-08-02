import React from 'react';

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
      <form name={"form1"} onSubmit={this.onSubmit} >
        <input name={"input1"} type={"text"} onChange={this.handleChange}
          defaultValue={this.props.defaultValue} ref={(input) => { this.nameInput = input; }} />
      </form>
    );
  }
}

InputForm.defaultProps = {
  onSubmit: () => { },
  onChange: () => { },
  defaultValue: "",
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

  AdjustDisableStatus = () => {
    var appEngine = this.props.appEngine;
    var shouldDisable = appEngine.getGuiController().getNumOfDigits() === this.numLengthField && 
    appEngine.getGuiController().getNumOfReps() === this.numOfRepsField;
    if(shouldDisable) {
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

  render() {
    var mainDisplay;
    if (this.state.isInputMode) {
      mainDisplay = <InputForm focusOnStart onSubmit={this.checkAnswer} />;
    } else {
      mainDisplay = <p>{this.state.numToRecall}</p>;
    }
    return (
      <>
        {mainDisplay}
        <button type="button" autoFocus onClick={() => this.props.appEngine.startPracticeSet() }
        ref={this.startButton}>
          start practice </button>
        <p>length of number:</p>
        <InputForm onChange={this.setNumLengthField} defaultValue={this.state.defaultNumSize} />
        <p>Number of reps:</p>
        <InputForm onChange={this.setNumOfRepsField} defaultValue={this.state.defaultRepNum} />

        <button type="button" onClick={this.saveSettings} ref={this.saveSettingButton}>Save Settings</button>
      </>
    );
  }
}

export default App;
