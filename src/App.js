import React from 'react';

class InputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    // this.onSubmit = this.onSubmit.bind(this);
  }

  handleChange = (event)=> {
    var currentValue = event.target.value;
    this.setState({value: currentValue});
    this.props.onChange(currentValue);
  }

  onSubmit = (event)=> {
    this.props.onSubmit(this.state.value)
    event.preventDefault();
  }

  render() {
    return (
        <form name={"form1"} onSubmit={this.onSubmit} >
          <input name={"input1"} type={"text"} autoFocus onChange={this.handleChange} 
          defaultValue={this.props.defaultValue} />
        </form>
    );
  }
}

InputForm.defaultProps = {
  onSubmit: ()=>{},
  onChange: ()=>{},
  defaultValue: "",
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {numToRecall: '12345', isInputMode: true};
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

  setNumLength = (length) => {
    var appEngine = this.props.appEngine;
    appEngine.getGuiController().setNumOfDigits(length);
    appEngine.rememberNumOfDigits();
  }

  render() {
    var mainDisplay;
    if (this.state.isInputMode) {
      mainDisplay = <InputForm onSubmit={this.checkAnswer}/>;
    } else {
      mainDisplay = <p>{this.state.numToRecall}</p>;
    }
    return (
      <>
        {mainDisplay}
        <InputForm onChange={this.setNumLength} defaultValue={this.state.defaultNumSize} />
      </>
    );
  }
}

export default App;
