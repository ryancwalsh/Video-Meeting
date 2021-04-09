import React, { Component } from 'react';
import { Input, Button } from '@material-ui/core';
import "./Home.css"

class Home extends Component {
  	constructor (props) {
		super(props)
		this.state = {
			url: ''
		}
	}

	handleChange = (e) => this.setState({ url: e.target.value })

	join = () => {
		if (this.state.url !== "") {
			const url = this.state.url.split("/")
			window.location.href = `/${url[url.length-1]}`
		} else {
			const url = Math.random().toString(36).substring(2, 7)
			window.location.href = `/${url}`
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
					<p>Choose a meeting name, which will be used as the path in the URL</p>
					<Input placeholder="Meeting nickname" onChange={e => this.handleChange(e)} />
					<Button variant="contained" color="primary" onClick={this.join} style={{ margin: "20px" }}>Go</Button>
				</div>
			</div>
		)
	}
}

export default Home;