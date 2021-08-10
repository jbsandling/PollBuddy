import React, { Component } from "react";
import "mdbreact/dist/css/mdb.css";
import { MDBContainer, MDBRow, MDBCol } from "mdbreact";
import {Link, Redirect, withRouter} from "react-router-dom";
import LoadingWheel from "../../components/LoadingWheel/LoadingWheel";
const Joi = require('joi');

import "./AccountInfo.scss";

class AccountInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      changePassword: false,
      doneLoading: false,
      userName: "mans",
      userNameLoaded: false,
      firstName: "SIS",
      firstNameLoaded: false,
      lastName: "Man",
      lastNameLoaded: false,
      email: "sisman@rpi.edu",
      emailLoaded: false
    };
    this.changePassword = this.handleToggleClick.bind(this);
    //Bounce back to log in if they are not logged 
    if(localStorage.getItem("loggedIn") != "true"){
      this.props.history.push('/login');
    }
  }

  componentDidMount(){
    this.props.updateTitle("Account Info");
    fetch(process.env.REACT_APP_BACKEND_URL + "/users/me", {
      method: "POST"
    }).then(response => {
        console.log(response);
      })
    //Load user values from localStorage (if present)
    //These should be loaded into localStorage after login/register backend calls
    if(localStorage.getItem("userName")) {
      this.setState({
        userName: localStorage.getItem("userName"),
        userNameLoaded:true
      });
    }
    if(localStorage.getItem("firstName")) {
      this.setState({
        firstName: localStorage.getItem("firstName"),
        firstNameLoaded:true
      });
    }
    if(localStorage.getItem("lastName")) {
      this.setState({
        lastName: localStorage.getItem("lastName"),
        lastNameLoaded:true
      });
    }
    if(localStorage.getItem("email")) {
      this.setState({
        email: localStorage.getItem("email"),
        emailLoaded:true
      });
    }
  }

  stopLoading = () => {
    this.setState({
      doneLoading: true
    });
  };
  
  handleToggleClick() {
    this.setState(state => ({
      changePassword: !state.changePassword
    }));
  }

  saveChanges() {
    const schema = Joi.object({
      username: Joi.string()
        .pattern(new RegExp('^(?=.{3,32}$)[a-zA-Z0-9\-._]+$'))
        .error(new Error('Username must be between 3 and 32 characters. Valid characters include letters, numbers, underscores, dashes, and periods.')),
      email: Joi.string().email({ tlds: {allow: false}, minDomainSegments: 2})
        .max(320)
        .error(new Error('Invalid email format.')),
      firstname: Joi.string()
        .min(1).max(256)
        .error(new Error('Invalid first name format.')),
      lastname: Joi.string()
        .allow(' ').max(256)
        .error(new Error('Invalid last name format.'))
    });

    var userValid = schema.validate({username: this.state.userName});
    var emailValid = schema.validate({email: this.state.email});
    var firstNameValid = schema.validate({firstname: this.state.fireName});
    var lastNameValid = schema.validate({lastname: this.state.lasName});

    console.log(process.env.REACT_APP_BACKEND_URL);
    console.log(this.props.id);
    // fetch(process.env.REACT_APP_BACKEND_URL + "/users/me", {
    //   method: "POST"
    // })
  }

  render() {
    if(!this.state.doneLoading){
      return ( 
        <MDBContainer className="page">
          <LoadingWheel/>
          <button className="button" onClick={this.stopLoading}>End Loading</button>
        </MDBContainer>
      );
    } else {
      return (
        <MDBContainer className="page">
          <MDBContainer className="box">
            <h1>Account Settings</h1>
            <MDBContainer>
              <MDBRow className="AccountInfo-accountInputs">
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="firstnameText">First Name:</label>
                  <input placeholder={this.state.firstName} defaultValue={this.state.firstNameLoaded ? this.state.firstName : undefined }className="form-control textBox" id="firstnameText" />
                </MDBCol>
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="lastnameText">Last Name:</label>
                  <input placeholder={this.state.lastName} defaultValue={this.state.lastNameLoaded ? this.state.lastName : undefined } className="form-control textBox" id="lastnameText" />
                </MDBCol>
              </MDBRow>
  
              <MDBRow className="AccountInfo-accountInputs">
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="usernametext">Username:</label>
                  <input value={this.state.userName} className="form-control textBox" id="usernametext" readOnly />
                </MDBCol>
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="emailText">Email:</label>
                  <input placeholder={this.state.email} defaultValue={this.state.emailLoaded ? this.state.email : undefined } className="form-control textBox" id="emailText" />
                </MDBCol>
              </MDBRow>
  
              <MDBRow className="AccountInfo-accountInputs">
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="institution">Institution:</label>
                  <input placeholder="RPI" className="form-control textBox" id="institution" readOnly />
                </MDBCol>
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="passwordChange">Password:</label>
                  <p id="AccountInfo-passwordChange" onClick={this.changePassword}>{this.state.changePassword ? "Cancel password change" : "Click to change password"}</p>
                </MDBCol>              
              </MDBRow>
  
              <MDBContainer id="AccountInfo-changePasswordInputs" style={this.state.changePassword ? {display: "flex"} : {display: "none"}}>
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="newPasswordText">New password:</label>
                  <input type="password" placeholder="••••••••••••" className="form-control textBox" id="newPasswordText"/>
                </MDBCol>
                <MDBCol md="6" className="AccountInfo-mdbcol-6">
                  <label htmlFor="confirmNewPassword">Confirm new password:</label>
                  <input type="password" placeholder="••••••••••••" className="form-control textBox" id="confirmNewPassword"/>
                </MDBCol>
              </MDBContainer>
            </MDBContainer>
  
            { /* TODO: Update this to have a backend call instead of a "to", plus some result popup */ }
            <Link id="AccountInfo-saveChanges" >
              <button onClick={this.saveChanges()} className="button">Save Changes</button>
            </Link>
          </MDBContainer>
        </MDBContainer>
      );
    }
  }
}

export default withRouter(AccountInfo);
