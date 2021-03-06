import React, { Component } from 'react';

const axios = require('axios');

import {
  Row,
  Col,
  //Button,
  FormControl,
  Form,
  DropdownButton,
  MenuItem,
} from 'react-bootstrap';

class BnbAgenda extends Component {
  constructor(props) {
    super(props);

    this.state = {
      api: 'http://' + window.location.hostname + ':8000',
      interval: 200,
      ip: '',
    }
  }

  handleAllCalBat(type) {
    if (!confirm('重建任务将抹去当前所有未完成的同类型任务')) {
      return
    }
    const api = this.state.api;
    axios
      .post(api + '/queue/create', {
        data: {type: type}
      }, {
        withCredentials: true
      })
      .then(function(response) {
        console.log(response.data);
      });
  }

  handlePurge(type) {
    if (!confirm('清空任务将抹去当前所有未完成的同类型任务')) {
      return
    }
    const api = this.state.api;
    axios
      .post(api + '/queue/purge', {
        data: {type: type}
      }, {
        withCredentials: true
      })
      .then(function(response) {
        console.log(response.data);
      });
  }

  handleSingleCalBat(type) {
    let airbnb_pk = this.airbnb_pk.value;
    if (!airbnb_pk) {
      alert('请输入airbnb_pk, 多个之间以逗号隔开');
      return;
    }
    airbnb_pk = airbnb_pk.split(',');
    const api = this.state.api;
    axios
      .post(api + '/queue/create', {
        data: {
          airbnb_pk: airbnb_pk,
          type: type
        }
      }, {
        withCredentials: true
      })
      .then(function(response) {
        console.log(response.data);
      });
  }

  fetchCalendar(job) {
    const _this = this;
    const api = this.state.api;
    const d = new Date();
    const airbnb_api = 'https://zh.airbnb.com/api/v2';
    const resource = 'calendar_months';
    let params = {
      listing_id: job.airbnb_pk,
      key: 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
      currency: 'USD',
      locale: 'en',
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      count: 2,
      _format: 'with_conditions',
    }

    //return new Promise(function(resolve){resolve({data:{}})});

    return axios
      .get(airbnb_api + '/' + resource, {
        params: params,
        withCredentials: true
      })
      .then((response)=>{
        console.log('fetched', response)
        let schedule = response.data;
        let calendar_months = schedule.calendar_months;
        axios
          .post(api + '/queue/execute', {
            data: {
              id: job.id,
              result: calendar_months,
              _validity: true,
            }
          }, {
            withCredentials: true
          })
          .then(function(response) {
            console.log('executed!', response.data);
          });
      }, (err)=>{
        console.log('failed', err)
        axios
          .post(api + '/queue/execute', {
            data: {
              id: job.id,
              result: err,
              _validity: false,
            }
          }, {
            withCredentials: true
          })
          .then(function(response) {
            console.log('executed but failed!', response.data);
          });
      })
  }

  fetchHost(job) {
    const _this = this;
    const api = this.state.api;
    const airbnb_api = 'https://zh.airbnb.com/api/v1';
    const resource = 'listings';

    let params = {
      key: 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
    }

    //return new Promise(function(resolve){resolve({data:{}})});

    return axios
      .get(airbnb_api + '/' + resource + '/' + job.airbnb_pk, {
        params: params,
        withCredentials: true
      })
      .then((response)=>{
        console.log('fetched', response)
        let host = response.data;
        axios
          .post(api + '/queue/execute', {
            data: {
              id: job.id,
              result: host,
              _validity: true,
            }
          }, {
            withCredentials: true
          })
          .then(function(response) {
            console.log('executed!', response.data);
          });
      }, (err)=>{
        console.log('failed', err)
        axios
          .post(api + '/queue/execute', {
            data: {
              id: job.id,
              result: err,
              _validity: false,
            }
          }, {
            withCredentials: true
          })
          .then(function(response) {
            console.log('executed but failed!', response.data);
          });
      })
  }

  handleExecute(type) {
    const _this = this;
    const api = this.state.api;
    axios
      .post(api + '/queue/jobs', {
        data: {type: type}
      }, {
        withCredentials: true
      })
      .then(function(response) {
        let jobs = response.data;
        jobs.forEach((job, index)=>{
          setTimeout(() => {
            console.log('received job', job.id, 'pk', job.airbnb_pk);

            if (type === 'fetch_calendar') {
              _this.fetchCalendar(job)
            }
            else if (type === 'fetch_host') {
              _this.fetchHost(job)
            }
          }, index * _this.state.interval);
        })
      });
  }

  handleIntervalChange() {
    this.setState({interval: parseInt(this.intervalRef.value, 10)});
  }

  render() {
    const agenda = 'http://' + window.location.hostname + ':3001';
    return  (
      <div style={{padding: '15px'}}>
        <Row>
          <Col>
            <Form inline>
              客户端IP: {this.state.ip} &nbsp;
              执行频率
              <FormControl type="number"
                           style={{width: 70}}
                           inputRef={(input) => { this.intervalRef = input; }}
                           onChange={this.handleIntervalChange.bind(this)}/>毫秒
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form inline>
             <DropdownButton title="自动重建任务" id="auto-create-task">
               <MenuItem eventKey="1"
                         onSelect={this.handleAllCalBat.bind(this, 'fetch_calendar')}
                         >重建日历任务</MenuItem>
               <MenuItem eventKey="1"
                         onSelect={this.handleAllCalBat.bind(this, 'fetch_host')}
                         >重建房源任务</MenuItem>
             </DropdownButton>

             <FormControl type="text"
                          inputRef={(input) => { this.airbnb_pk = input; }}
                          placeholder="airbnb_pk" />

             <DropdownButton title="手动建任务" id="manual-create-task">
               <MenuItem eventKey="1"
                         onSelect={this.handleSingleCalBat.bind(this, 'fetch_calendar')}
                         >日历</MenuItem>
               <MenuItem eventKey="1"
                         onSelect={this.handleSingleCalBat.bind(this, 'fetch_host')}>
                         房源</MenuItem>
             </DropdownButton>

             <DropdownButton title="清空任务" id="delete-task">
               <MenuItem eventKey="1"
                         onSelect={this.handlePurge.bind(this, 'fetch_calendar')}
                         >清空日历任务</MenuItem>
               <MenuItem eventKey="1"
                         onSelect={this.handlePurge.bind(this, 'fetch_host')}
                         >清空房源任务</MenuItem>
             </DropdownButton>

             <DropdownButton title="执行任务" id="run-task">
               <MenuItem eventKey="1"
                         onSelect={this.handleExecute.bind(this, 'fetch_calendar')}
                         >同步日历</MenuItem>
               <MenuItem eventKey="1"
                         onSelect={this.handleExecute.bind(this, 'fetch_host')}
                         >同步房源</MenuItem>
             </DropdownButton>
            </Form>
          </Col>
        </Row>
        <Row>
          <iframe src={agenda}
                  style={{border: 'none'}}
                  width="100%"
                  height={window.innerHeight - 70}></iframe>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    const _this = this;
    const api = this.state.api;
    axios
      .post(api + '/ip', {data: {}}, {
        withCredentials: true
      })
      .then(function(response) {
        console.log('ip', response.data);
        _this.setState({ip: response.data});
      });

    this.intervalRef.value = this.state.interval;
  }

};

class Agenda extends Component {
  render() {
    return (
      <div>
        <BnbAgenda/>
      </div>
    )
  }

  componentWillMount() {
    this.props.updateAppTitle('同步数据');
  }

}

export default Agenda;
