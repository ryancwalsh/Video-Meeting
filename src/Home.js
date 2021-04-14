import React, { Component } from 'react';
import { Input, Button } from '@material-ui/core';
import { guid } from './utils/rand';
import "./Home.css"

const randomMeetingCode = 'demo'; // TODO: guid();

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
					<form onSubmit={this.createNewMeeting} style={{
					background: "white",  padding: "20px", margin: "10px", textAlign: "center"
				}}>
						<Button variant="contained" color="primary" style={{ margin: "20px" }} type="submit">Create New Meeting</Button>
					</form>
					<p>or</p>
					<form onSubmit={this.join} style={{
					background: "white", padding: "20px", margin: "10px", textAlign: "center"
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