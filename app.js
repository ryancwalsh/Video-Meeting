require('dotenv').config(); // https://www.npmjs.com/package/dotenv
const express = require('express')
const https = require('https');
const http = require('http');
var fs = require('fs');
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const path = require("path")
var xss = require("xss")
const port = process.env.API_PORT || 4001;
// ----------------------------------------------------------------
let server;
const options = {};
if (process.env.HTTPS) {
	// TODO: https://stackoverflow.com/questions/56744208/fs-readfilesync-cannot-read-file-passing-path-variable-in-nodejs#comment118494792_56744208
	// TODO: Update note in .env.example
	// const keyPath = process.env.SSL_KEY_FILE.substring(2);
	// const crtPath = process.env.SSL_CRT_FILE.substring(2);
	const keyPath = "keys/xip.io.key";
	const crtPath = "keys/xip.io.crt";
	console.log({ keyPath, crtPath });

	// https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/ and https://programmerblog.net/nodejs-https-server/
	options.key = fs.readFileSync(keyPath); // https://serversforhackers.com/c/self-signed-ssl-certificates https://github.com/ryancwalsh/xip.io-cert https://www.freecodecamp.org/news/how-to-set-up-https-locally-with-create-react-app/
	options.cert = fs.readFileSync(crtPath);
	console.log({ options });
	server = https.createServer(options, app);
} else {
	// server = http.createServer(options, function (req, res) {  // If I run `./node_modules/.bin/lt -s groupchatapi -p 4001` in a separate terminal and then visit https://groupchatapi.loca.lt/, I see the correct page.
	//   res.writeHead(200);
	//   res.end("hello world " + Date());
	// });
	server = http.createServer(options, app);
}
console.log('HTTPS=', process.env.HTTPS, { server });

const io = require("socket.io")(server, {
	cors: { // https://socket.io/docs/v4/handling-cors/
		// Note: this also applies to localhost if your web application and your server are not served from the same port
		origin: "*", // TODO: Fix to tighten security!
		methods: ["GET", "POST"]
	}
});

app.use(cors()) // https://stackoverflow.com/a/19743442/470749
app.use(bodyParser.json())

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(__dirname + "/build"))
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname + "/build/index.html"))
	})
}

console.log({ port });
app.set('port', port);

let sanitizeString = (str) => {
	return xss(str)
}

let connections = {};
let messages = {};
let timeOnline = {};
const socketIdToUsernameObj = {}; // Using an object instead of Map since it seems that a Map can't be sent as a param via `emit`.

function joinedCall(socket, socketId, username, path) {
	socketIdToUsernameObj[socketId] = username; 
	console.log('joined-call', { socketId, username, path }, socketIdToUsernameObj);
	// socket.data.username = username; // https://socket.io/docs/v4/server-socket-instance/#Socket-data
	if (connections[path] === undefined) {
		connections[path] = []
	}
	connections[path].push(socket.id);
	timeOnline[socket.id] = new Date();

	connections[path].forEach(connection => {
		io.to(connection).emit("other-participant-joined", socket.id, connections[path], socketIdToUsernameObj);
	});

	if (messages[path] !== undefined) { // When a new participant joins, send all the messages that already existed in the room.
		messages[path].forEach(message => {
			io.to(socket.id).emit("chat-message", message['data'], message['sender'], message['socket-id-sender']);
		});
	}

	console.log(path, connections[path]);
}

function disconnect(socket) {
	delete socketIdToUsernameObj[socket.id];
	console.log('disconnect', socketIdToUsernameObj);
	var diffTime = Math.abs(timeOnline[socket.id] - new Date())
	var key
	for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
		for (let a = 0; a < v.length; ++a) {
			if (v[a] === socket.id) {
				key = k

				for (let a = 0; a < connections[key].length; ++a) {
					io.to(connections[key][a]).emit("user-left", socket.id)
				}

				var index = connections[key].indexOf(socket.id)
				connections[key].splice(index, 1)

				console.log(key, socket.id, Math.ceil(diffTime / 1000))

				if (connections[key].length === 0) {
					delete connections[key]
				}
			}
		}
	}
}

function sendChatMessage(socket, data, sender) {
	data = sanitizeString(data)
	sender = sanitizeString(sender)

	var key;
	var ok = false;
	for (const [k, v] of Object.entries(connections)) {
		for (let a = 0; a < v.length; ++a) {
			if (v[a] === socket.id) {
				key = k
				ok = true
			}
		}
	}

	if (ok === true) {
		if (messages[key] === undefined) {
			messages[key] = []
		}
		messages[key].push({ "sender": sender, "data": data, "socket-id-sender": socket.id });
		console.log("message", key, ":", sender, data);

		for (let a = 0; a < connections[key].length; ++a) {
			io.to(connections[key][a]).emit("chat-message", data, sender, socket.id)
		}
	}
}

io.on('connection', (socket) => {

	socket.on('joined-call', (socketId, username, path) => joinedCall(socket, socketId, username, path));

	socket.on('signal', (toId, message) => {
		// console.log('signal', { toId, message, socket});
		io.to(toId).emit('signal', socket.id, message)
	})

	socket.on('chat-message', (data, sender) => sendChatMessage(socket, data, sender));

	socket.on('disconnect', () => disconnect(socket));
})

server.listen(port, () => {
	console.log("listening on", port)
});