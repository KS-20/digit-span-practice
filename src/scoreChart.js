import React from "react";
import ReactApexChart from "react-apexcharts";

class ScoreChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        chart: {
          id: 'chart2',
          type: 'line',
          height: 230,
          toolbar: {
            autoSelected: 'pan',
            show: false
          }
        },
        colors: ['#546E7A'],
        stroke: {
          width: 3
        },
        dataLabels: {
          enabled: true
        },
        fill: {
          opacity: 1,
        },
        markers: {
          size: 0
        },
        xaxis: {
          type: 'category'
        }
      },

      optionsLine: {
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
            // xaxis: {
            //   min: 3,
            //   max: 4,
            // }
          },
        },
        colors: ['#008FFB'],
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.91,
            opacityTo: 0.1,
          }
        },
        xaxis: {
          type: 'category',
          tooltip: {
            enabled: true
          }
        },
        yaxis: {
          tickAmount: 2
        }
      },
    };
  }

  render() {

    var setNum = 1;
    var data = [];
    for (var setRecord of this.props.performenceRecord) {
      data.push([setNum,setRecord.getSuccessRate()]);
      setNum++;
    }
    
    var series = [{
      name: "average success rate",
      data: data
    }];

    var seriesLine = [{
      data: data
    }]

    return (
      <div id="wrapper">
        <div id="chart-line2">
          <ReactApexChart options={this.state.options} series={series} type="line" height={120} width={600}/>
        </div>
        <div id="chart-line">
          <ReactApexChart options={this.state.optionsLine} series={seriesLine} type="area" height={120} width={600}  />
        </div>
      </div>
    );
  }
}

export default ScoreChart