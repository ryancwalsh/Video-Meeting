import React, { Component } from 'react'
import io from 'socket.io-client'
import faker from "faker"
import { guid } from './utils/rand';

import {IconButton, Badge, Input, Button} from '@material-ui/core'
import VideocamIcon from '@material-ui/icons/Videocam'
import VideocamOffIcon from '@material-ui/icons/VideocamOff'
import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
import VolumeUpIcon from '@material-ui/icons/VolumeUp' // https://fonts.google.com/icons?selected=Material+Icons&icon.query=speaker
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import ScreenShareIcon from '@material-ui/icons/ScreenShare'
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare'
import CallEndIcon from '@material-ui/icons/CallEnd'
import ChatIcon from '@material-ui/icons/Chat'

import { connectToHiFi, toggleMicInputMute, participantConnected } from './HiFi/helper';

import { message } from 'antd'
import 'antd/dist/antd.css'

import { Row } from 'reactstrap'
import Modal from 'react-bootstrap/Modal'
import 'bootstrap/dist/css/bootstrap.css'
import "./Video.css"

const socketUrl = process.env.REACT_APP_SOCKET_URL; // https://stackoverflow.com/a/56668716/470749

console.log({ socketUrl });

var connections = {}
const peerConnectionConfig = {
	'iceServers': [ // https://stackoverflow.com/a/20134888/470749
		// { 'urls': 'stun:stun.services.mozilla.com' },
		{ 'urls': 'stun:stun.l.google.com:19302' },
	]
}
var socket = null
var socketId = null

const randomUsername = faker.name.firstName(); // https://www.npmjs.com/package/faker // TODO: Use value from cookie instead if present.

const { mediaDevices } = navigator;
console.log({ navigator, mediaDevices });
class Video extends Component {
	constructor(props) {
		super(props)

		this.localVideoref = React.createRef()

		this.videoAvailable = false
		this.audioAvailable = false

		this.state = {
			video: false,
			mic: false,
			speakers: true,
			screen: false,
			showModal: false,
			screenAvailable: false,
			messages: [],
			message: "",
			newmessages: 0,
			askForUsername: true,
			username: '', 
		}
		connections = {}

		this.getPermissions()
	}

	getPermissions = async () => {
		try{
			await mediaDevices.getUserMedia({ video: true })
				.then(() => this.videoAvailable = true)
				.catch(() => this.videoAvailable = false)

			await mediaDevices.getUserMedia({ audio: true })
				.then(() => this.audioAvailable = true)
				.catch(() => this.audioAvailable = false)

			if (mediaDevices.getDisplayMedia) {
				this.setState({ screenAvailable: true })
			} else {
				this.setState({ screenAvailable: false })
			}

			if (this.videoAvailable || this.audioAvailable) {
				mediaDevices.getUserMedia({ video: this.videoAvailable, audio: this.audioAvailable })
					.then((stream) => {
						window.localStream = stream
						this.localVideoref.current.srcObject = stream
					})
					.then((stream) => {})
					.catch((e) => console.error(e))
			}
		} catch(e) { console.error(e) }
	}

	getMedia = () => {
		this.setState({
			video: this.videoAvailable,
			mic: this.audioAvailable
		}, () => {
			this.getUserMedia()
			this.connectToSocketServer()
		})
	}

	getUserMedia = () => {
		if ((this.state.video && this.videoAvailable) || (this.state.mic && this.audioAvailable)) {
			const audio = false; // Make it always `false` regardless of mute state because audio will be handled via HiFi API.
			mediaDevices.getUserMedia({ video: this.state.video, audio })
				.then(this.getUserMediaSuccess)
				.then((stream) => {})
				.catch((e) => console.error(e))
		} else {
			try {
				let tracks = this.localVideoref.current.srcObject.getTracks()
				tracks.forEach(track => track.stop())
			} catch (e) {}
		}
	}

	getUserMediaSuccess = (stream) => {
		try {
			window.localStream.getTracks().forEach(track => track.stop())
		} catch(e) { console.error(e) }

		window.localStream = stream
		this.localVideoref.current.srcObject = stream

		for (let id in connections) {
			if (id === socketId) continue

			connections[id].addStream(window.localStream)

			connections[id].createOffer().then((description) => {
				connections[id].setLocalDescription(description)
					.then(() => {
						socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
					})
					.catch(e => console.error(e))
			})
		}

		stream.getTracks().forEach(track => track.onended = () => {
			// TODO: Reduce duplication with other section like this.
			this.setState({
				video: false,
				mic: false,
			}, () => {
				try {
					let tracks = this.localVideoref.current.srcObject.getTracks()
					tracks.forEach(track => track.stop())
				} catch(e) { console.error(e) }

				let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
				window.localStream = blackSilence()
				this.localVideoref.current.srcObject = window.localStream

				for (let id in connections) {
					connections[id].addStream(window.localStream)

					connections[id].createOffer().then((description) => {
						connections[id].setLocalDescription(description)
							.then(() => {
								socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
							})
							.catch(e => console.error(e))
					})
				}
			})
		})
	}

	getDisplayMedia = () => {
		if (this.state.screen) {
			if (mediaDevices.getDisplayMedia) {
				mediaDevices.getDisplayMedia({ video: true, audio: true })
					.then(this.getDislayMediaSuccess)
					.then((stream) => {})
					.catch((e) => console.error(e))
			}
		}
	}

	getDislayMediaSuccess = (stream) => {
		try {
			window.localStream.getTracks().forEach(track => track.stop())
		} catch(e) { console.error(e) }

		window.localStream = stream
		this.localVideoref.current.srcObject = stream

		for (let id in connections) {
			if (id === socketId) continue

			connections[id].addStream(window.localStream)

			connections[id].createOffer().then((description) => {
				connections[id].setLocalDescription(description)
					.then(() => {
						socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
					})
					.catch(e => console.error(e))
			})
		}

		stream.getTracks().forEach(track => track.onended = () => {
			// TODO: Reduce duplication with other section like this.
			console.log({ track });
			this.setState({
				screen: false,
			}, () => {
				try {
					let tracks = this.localVideoref.current.srcObject.getTracks()
					tracks.forEach(track => track.stop())
				} catch(e) { console.error(e) }

				let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
				window.localStream = blackSilence()
				this.localVideoref.current.srcObject = window.localStream

				this.getUserMedia()
			})
		})
	}

	gotMessageFromServer = (fromId, message) => {
		console.log('gotMessageFromServer', { fromId, message });
		var signal = JSON.parse(message)

		if (fromId !== socketId) {
			if (signal.sdp) {
				connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
					if (signal.sdp.type === 'offer') {
						connections[fromId].createAnswer().then((description) => {
							connections[fromId].setLocalDescription(description).then(() => {
								socket.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
							}).catch(e => console.error(e))
						}).catch(e => console.error(e))
					}
				}).catch(e => console.error(e))
			}

			if (signal.ice) {
				connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error(e))
			}
		}
	}

	getUniqueUserId = () => {
		return `${this.state.username.replace(' ', '_')}_${guid()}`;
	}

	connectToSocketServer = async () => {
		const uniqueUserId = this.getUniqueUserId();
		await connectToHiFi(document.getElementById('outputAudioEl'), document.getElementById('main'), uniqueUserId);
		socket = io.connect(socketUrl, { secure: true })

		socket.on('signal', this.gotMessageFromServer)

		socket.on('connect', () => {
			console.log('connect');
			socket.emit('join-call', window.location.href)
			socketId = socket.id

			socket.on('chat-message', this.addMessage)

			socket.on('user-left', (id) => {
				let video = document.querySelector(`[data-socket="${id}"]`)
				if (video !== null) {
					video.parentNode.removeChild(video)
				}
			})

			socket.on('user-joined', (id, clients) => {
				console.log('user-joined', { clients, connections });
				// participantConnected(id, document.getElementById('main')); // TODO: Figure out what to pass instead of "id"
				clients.forEach((socketListId) => {
					const connection = new RTCPeerConnection(peerConnectionConfig);
					connections[socketListId] = connection;
					// Wait for their ice candidate
					connection.onicecandidate = function (event) {
						if (event.candidate != null) {
							socket.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
						}
					}

					// Wait for their video stream
					connection.onaddstream = (event) => {
						console.log('onaddstream', { event });
						// TODO mute button, full screen button
						var searchVideo = document.querySelector(`[data-socket="${socketListId}"]`)
						if (searchVideo !== null) { // Without this check, it would be an empty square.
							searchVideo.srcObject = event.stream
						} else {
							const main = document.getElementById('main')
							// TODO const wrapper = document.querySelectorAll('[data-userId=]')
							let video = document.createElement('video')
							video.classList.add('other-participant');
							video.setAttribute('data-socket', socketListId)
							video.srcObject = event.stream
							video.autoplay = true
							video.playsinline = true

							main.appendChild(video)
							// TODO wrapper.appendChild(video)
						}
					}

					// Add the local video stream
					if (window.localStream !== undefined && window.localStream !== null) {
						connection.addStream(window.localStream)
					} else {
						// TODO: Reduce duplication with other section like this.
						let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
						window.localStream = blackSilence()
						connection.addStream(window.localStream)
					}
				})

				if (id === socketId) {
					for (let id2 in connections) {
						if (id2 === socketId) continue
						
						try {
							connections[id2].addStream(window.localStream)
						} catch(e) {}
			
						connections[id2].createOffer().then((description) => {
							connections[id2].setLocalDescription(description)
								.then(() => {
									socket.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
								})
								.catch(e => console.error(e))
						})
					}
				}
			})
		})
	}

	silence = () => {
		let ctx = new AudioContext()
		let oscillator = ctx.createOscillator()
		let dst = oscillator.connect(ctx.createMediaStreamDestination())
		oscillator.start()
		ctx.resume()
		return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
	}
	black = ({ width = 640, height = 480 } = {}) => {
		let canvas = Object.assign(document.createElement("canvas"), { width, height })
		canvas.getContext('2d').fillRect(0, 0, width, height)
		let stream = canvas.captureStream()
		return Object.assign(stream.getVideoTracks()[0], { enabled: false })
	}

	handleVideo = () => this.setState({ video: !this.state.video }, () => this.getUserMedia())
	toggleMicInputMute = () => this.setState({ mic: !this.state.mic }, () => toggleMicInputMute())
		
	toggleSpeakersOutputMute = () => this.setState({ speakers: !this.state.speakers }, () => {
		const outputAudioEl = document.getElementById('outputAudioEl');
		outputAudioEl.muted = !outputAudioEl.muted;
		console.log(`Set output mute status to \`${outputAudioEl.muted}\``);
		// toggleOutputMuteButton.innerHTML = `Toggle Output Mute (currently ${outputAudioEl.muted ? "muted" : "unmuted"})`;
	})

	handleScreen = () => this.setState({ screen: !this.state.screen }, () => this.getDisplayMedia())

	handleEndCall = () => {
		try {
			let tracks = this.localVideoref.current.srcObject.getTracks()
			tracks.forEach(track => track.stop())
		} catch (e) {}
		window.location.href = "/"
	}

	openChat = () => this.setState({ showModal: true, newmessages: 0 })
	closeChat = () => this.setState({ showModal: false })
	handleMessage = (e) => this.setState({ message: e.target.value })

	addMessage = (data, sender, socketIdSender) => {
		this.setState(prevState => ({
			messages: [...prevState.messages, { "sender": sender, "data": data }],
		}))
		if (socketIdSender !== socketId) {
			this.setState({ newmessages: this.state.newmessages + 1 })
		}
	}

	prepareToSaveUsernameToState = (username) => {
		if (!username) {
			username = randomUsername;
		}
		return { username };
	}

	handleUsername = (event) => {
		let username = event.target.value;
		const payload = this.prepareToSaveUsernameToState(username);
		this.setState(payload);
	}

	sendMessage = () => {
		socket.emit('chat-message', this.state.message, this.state.username)
		this.setState({ message: "", sender: this.state.username })
	}

	copyUrl = () => {
		let text = window.location.href
		if (!navigator.clipboard) {
			let textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				document.execCommand('copy')
				message.success("Link copied to clipboard!")
			} catch (err) {
				message.error("Failed to copy")
			}
			document.body.removeChild(textArea)
			return
		}
		navigator.clipboard.writeText(text).then(function () {
			message.success("Link copied to clipboard!")
		}, () => {
			message.error("Failed to copy")
		})
	}

	connect = () => {
		const payload = this.prepareToSaveUsernameToState(this.state.username);
		this.setState({ ...payload, askForUsername: false }, () => this.getMedia())
	}

	isChrome = function () {
		let userAgent = (navigator && (navigator.userAgent || '')).toLowerCase()
		let vendor = (navigator && (navigator.vendor || '')).toLowerCase()
		let matchChrome = /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null
		// let matchFirefox = userAgent.match(/(?:firefox|fxios)\/(\d+)/)
		// return matchChrome !== null || matchFirefox !== null
		return matchChrome !== null
	}

	render() {
		// if(this.isChrome() === false){
		// 	return (
		// 		<div style={{background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
		// 				textAlign: "center", margin: "auto", marginTop: "50px", justifyContent: "center"}}>
		// 			<h1>Sorry, this works only with Google Chrome</h1>
		// 		</div>
		// 	)
		// }
		return (
			<div>
				{this.state.askForUsername === true ?
					<div>
						<div style={{background: "white", width: "30%", height: "auto", padding: "20px", minWidth: "400px",
								textAlign: "center", margin: "auto", marginTop: "50px", justifyContent: "center"}}>
							<p style={{ margin: 0, fontWeight: "bold", paddingRight: "50px" }}>What is your name?</p>
							<form onSubmit={this.connect}>
								<Input placeholder={randomUsername} value={this.state.username} onChange={e => this.handleUsername(e)} />
								<Button variant="contained" color="primary" style={{ margin: "20px" }} type="submit">Connect</Button>
								<p>(If you don't provide your name, this random one will be used.)</p>
							</form>
						</div>

						<div style={{ justifyContent: "center", textAlign: "center" }}>
							Preview of your webcam:
							<video className="my-video-preview" ref={this.localVideoref} autoPlay muted></video>
						</div>
					</div>
					:
					<div>
						

						<Modal show={this.state.showModal} onHide={this.closeChat} style={{ zIndex: "999999" }}>
							<Modal.Header closeButton>
								<Modal.Title>Chat Room</Modal.Title>
							</Modal.Header>
							<Modal.Body style={{ overflow: "auto", overflowY: "auto", height: "400px", textAlign: "left" }} >
								{this.state.messages.length > 0 ? this.state.messages.map((item, index) => (
									<div key={index} style={{textAlign: "left"}}>
										<p style={{ wordBreak: "break-all" }}><b>{item.sender}</b>: {item.data}</p>
									</div>
								)) : <p>No message yet</p>}
							</Modal.Body>
							<Modal.Footer className="div-send-msg">
								<Input placeholder="Message" value={this.state.message} onChange={e => this.handleMessage(e)} />
								<Button variant="contained" color="primary" onClick={this.sendMessage}>Send</Button>
							</Modal.Footer>
						</Modal>

						<div className="container">
							<div style={{ paddingTop: "20px" }}>
								<Input value={window.location.href} disable="true" style={{ "width": '100%' }}></Input>
								<Button style={{backgroundColor: "#3f51b5",color: "whitesmoke",marginLeft: "20px",
									marginTop: "10px",width: "120px",fontSize: "10px"
								}} onClick={this.copyUrl}>Copy invite link</Button>
							</div>

							<Row className="flex-container" style={{ margin: 0, padding: 0 }}>
								
								<div id="main" className="other-participants">
									<video className="my-video" ref={this.localVideoref} autoPlay muted></video>
								</div>

								<div className="control-panel">
									<IconButton style={{ color: "#f44336" }} onClick={this.handleEndCall} title="Enable/disable call">
										<CallEndIcon />
									</IconButton>
									
									<IconButton onClick={this.handleVideo} title="Enable/disable camera">
										{(this.state.video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
									</IconButton>

									<IconButton onClick={this.toggleMicInputMute} title="Enable/disable microphone">
										{this.state.mic === true ? <MicIcon /> : <MicOffIcon />}
									</IconButton>

									<IconButton onClick={this.toggleSpeakersOutputMute} title="Enable/disable audio output through your speakers/headphones">
										{this.state.speakers === true ? <VolumeUpIcon /> : <VolumeOffIcon />}
									</IconButton>

									{this.state.screenAvailable === true ?
										<IconButton onClick={this.handleScreen} title="Enable/disable screenshare">
											{this.state.screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
										</IconButton>
										: null}

									<Badge badgeContent={this.state.newmessages} max={999} color="secondary" onClick={this.openChat} title="Open chat">
										<IconButton onClick={this.openChat}>
											<ChatIcon />
										</IconButton>
									</Badge>
									<audio autoPlay id="outputAudioEl"></audio>
								</div>
							</Row>
						</div>
					</div>
				}
			</div>
		)
	}
}

export default Video