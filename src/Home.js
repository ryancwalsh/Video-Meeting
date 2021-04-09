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

	join = (event) => {
		event.preventDefault();
		if (this.state.url !== "") {
			const url = this.state.url.split("/")
			window.location.href = `/${url[url.length-1]}`
		} else {
			const url = randomMeetingCode;
			console.log({ randomMeetingCode, event });
			window.location.href = `/${url}`;
		}
	}

	render() {
		return (
			<div className="container2">
								
				<div>
					<h1 style={{ fontSize: "45px" }}>Video Meeting</h1>
					
				</div>

				<div style={{
					background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
					textAlign: "center", margin: "auto", marginTop: "100px"
				}}>
					<p style={{ margin: 0, fontWeight: "bold", paddingRight: "50px" }}>Start or join a meeting:</p>
					<p>Optionally provide a meeting ID (to join an existing meeting), or proceeding will start a new meeting.</p>
					<form onSubmit={this.join}>
						<Input placeholder={randomMeetingCode} onChange={event => this.handleChange(event)} />
						<Button variant="contained" color="primary" style={{ margin: "20px" }} type="submit">Go</Button>
					</form>
				</div>
			</div>
		)
	}
}

export default Home;