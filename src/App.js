import React from 'react';

class InputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    // this.onSubmit = this.onSubmit.bind(this);
  }

  handleChange = (event)=> { 
    this.setState({value: event.target.value});
  }

  onSubmit = (event)=> {
    this.props.onSubmit(this.state.value)
    // alert("one two three");
    event.preventDefault();
  }

  render() {
    return (
        <form name={"form1"} onSubmit={this.onSubmit} >
          <input name={"input1"} type={"text"} autoFocus onChange={this.handleChange} />
        </form>
    );
  }
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
  processInput = (input) => {
    var appEngine = this.props.appEngine;
    appEngine.getGuiController().setInput(input);
    appEngine.onSubmitAnswer();
  }

  render() {
    var mainDisplay;
    if (this.state.isInputMode) {
      mainDisplay = <InputForm onSubmit={this.processInput}/>;
    } else {
      mainDisplay = <p>{this.state.numToRecall}</p>;
    }
    return (
      <>
        {mainDisplay}
      </>
    );
  }
}

export default App;
