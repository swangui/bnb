import React, { Component } from 'react';
import {DropdownButton, MenuItem} from 'react-bootstrap';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

class AppNav extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  onMenuItemSelect = (eventKey, event) => {
    this.props.history.push(eventKey);
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <DropdownButton title="我是房客" id="guestMenu" bsSize="xsmall">
            <MenuItem eventKey="/user/request"
                      onSelect={this.onMenuItemSelect}>我有民宿需求</MenuItem>
            <MenuItem>我的订单</MenuItem>
          </DropdownButton>
          <DropdownButton title="管理入口" id="adminMenu" bsSize="xsmall">
            <MenuItem eventKey="/admin/requests"
                      onSelect={this.onMenuItemSelect}>需求匹配管理</MenuItem>
            <MenuItem>订单管理</MenuItem>
            <MenuItem eventKey="/admin/hosts"
                      onSelect={this.onMenuItemSelect}>房源管理</MenuItem>
          </DropdownButton>
        </div>
      </div>
    )
  }
}

export default AppNav;