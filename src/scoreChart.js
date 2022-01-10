import React from "react";
import ReactApexChart from "react-apexcharts";

class ScoreChart extends React.Component {
  constructor(props) {
    super(props);
    /* TODO: see why performance is slow for about 4000 SetRecords , apexchart feature section 
    on the website shows a demo with 25K points, Maybe migrate to chart.js which reportedly
    can handle 1M points? or github.com/leeoniya/uPlot?.
    also according to this: https://github.com/apexcharts/apexcharts.js/issues/214#issuecomment-442370063
    apexchart is not built to handle thousands of points.
    */

    this.state = {
      options: {
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
        colors: ['#546E7A'],
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
          animations: {
            enabled: false
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