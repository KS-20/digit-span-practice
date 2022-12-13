import React from "react";
import ReactApexChartModule from "react-apexcharts";
import { names } from './repeatedStrings.js'
let ReactApexChart = ReactApexChartModule.default; // need this line since adding "type": "module" to package.json, i don't know why

class ScoreChart extends React.Component {
  constructor(props) {
    super(props);
    /* TODO: see why performance is slow for about 4000 SetRecords , apexchart feature section 
    on the website shows a demo with 25K points, Maybe migrate to chart.js which reportedly
    can handle 1M points? or github.com/leeoniya/uPlot?.
    also according to this: https://github.com/apexcharts/apexcharts.js/issues/214#issuecomment-442370063
    apexchart is not built to handle thousands of points.
    */

    this.displaySelectMenu = React.createRef();

    var mainGraphOptions = {
      chart: {
        id: 'chart2',
        type: 'line',
        height: 230,
        toolbar: {
          autoSelected: 'pan',
          show: false
        },
        animations: {
          enabled: false
        }
      },
      colors: ['#77B6EA', '#545454'],
      stroke: {
        width: 3
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 1,
      },
      markers: {
        size: 0
      },
      xaxis: {
        type: 'category',
        labels: {
          show: true
        }
      }
    }

    var outlineGraphOptions = {
      chart: {
        id: 'chart1',
        height: 50,
        type: 'area',
        brush: {
          target: 'chart2',
          enabled: true,
          autoScaleYaxis: false,
        },
        selection: {
          enabled: true,
        },
        animations: {
          enabled: false
        },
      },
      colors: ['#77B6EA', '#545454'],
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.91,
          opacityTo: 0.1,
        }
      },
      markers: {
        size: 0
      },
      xaxis: {
        type: 'category',
        tooltip: {
          enabled: true
        },
        labels: {
          show: false
        }
      },
      yaxis: {
        tickAmount: 2
      }
    }

    this.state = {
      options: mainGraphOptions,
      optionsLine: outlineGraphOptions, 
      displayMode: names.averageScore,
    };
  }

  changeGraphDisplay = () => {
    var displayModeName = this.displaySelectMenu.current.value;
    this.setState({displayMode: displayModeName})
  }

  render() {

    var currentCatagory = this.props.currentCatagory;

    var catagoryDisplayLine ;
    if( currentCatagory !== names.noCatagory ) {
      catagoryDisplayLine = <p id="catagoryDisplayLine">Showing results only for category "{currentCatagory}"</p>;
    } else {
      catagoryDisplayLine = <p>Showing results for all catagories</p>;
    }

    var setNum = 1;
    var data = [];
    var data2 = [];

    for (var setRecord of this.props.performenceRecord) {
      if (currentCatagory === names.noCatagory || setRecord.getCatagory() ===  currentCatagory ) {
        if(this.state.displayMode === names.averageScore){
          data.push([setNum,setRecord.getAverageScore()]);
          data2.push([setNum,setRecord.getMaxScore()]);
        } else {
          data.push([setNum, setRecord.getSuccessRate()]);
        }
        setNum++;
      }
    }
    var series = []
    if(this.state.displayMode === names.averageScore){
      series.push( { name: "average score", data: data } );
      series.push( { name: "length of number practiced", data: data2 } )
    } else {
      series.push( { name: "average success rate", data: data } )
    }

    var seriesLine = [{
      data: data
    }]

    return (
      <div id="wrapper">
        <div id="chart-line2">
          <ReactApexChart options={this.state.options} series={series} type="line" height={"120px"} width={"600px"} />
        </div>
        <div id="chart-line">
          <ReactApexChart options={this.state.optionsLine} series={seriesLine} type="area" height={"120px"} width={"600px"} />
        </div>
        <form>
        <label htmlFor="displaySelect">Show in graph:  </label>
        <select onInput={this.changeGraphDisplay} name="displaySelect" id="displaySelect" ref={this.displaySelectMenu}>
          <option value={names.averageScore}>{names.averageScore}</option>
          <option value="Success rate">Success rate</option>
        </select>
      </form>

        {catagoryDisplayLine}
      </div>
    );
  }
}

export default ScoreChart