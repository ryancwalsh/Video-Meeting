import React, { Component } from 'react';
import { Input, Button } from '@material-ui/core';
import "./Home.css"

const randomMeetingCode = Math.random().toString(36).substring(2, 10); // TODO: Ensure that these are all readable characters.

class Home extends Component {
  	constructor (props) {
		super(props)
		this.state = {
			url: ''
		}
	}

	handleChange = (event) => this.setState({ url: event.target.value })

	createNewMeeting = (event) => {
		event.preventDefault();
		const url = randomMeetingCode;
		console.log({ randomMeetingCode, event });
		window.location.href = `/${url}`;		
	}

	join = (event) => {
		event.preventDefault();
		if (this.state.url !== "") {
			const url = this.state.url.split("/")
			window.location.href = `/${url[url.length-1]}`
		}
	}

	render() {
		return (
			<div className="container2">
								
				<div>
					<h1 style={{ fontSize: "45px" }}>Video Meeting</h1>
					
				</div>

				<div>
					<form onSubmit={this.createNewMeeting} style={{
					background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
					textAlign: "center", margin: "auto", marginTop: "100px"
				}}>
						<Button variant="contained" color="primary" style={{ margin: "20px" }} type="submit">Create New Meeting</Button>
					</form>
					<p>or</p>
					<form onSubmit={this.join} style={{
					background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
					textAlign: "center", margin: "auto", marginTop: "100px"
					}}>
						<p>Join an existing meeting by providing its ID here:</p>
						<Input placeholder={randomMeetingCode} onChange={event => this.handleChange(event)} required />
						<Button variant="contained" color="primary" style={{ margin: "20px" }} type="submit">Join</Button>
					</form>
				</div>
			</div>
		)
	}
}

export default Home;