// require('dotenv').config(); // https://www.npmjs.com/package/dotenv
const express = require('express')
var https = require('https');
var fs    = require('fs');
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const path = require("path")
var xss = require("xss")

// ----------------------------------------------------------------
// TODO: https://stackoverflow.com/questions/56744208/fs-readfilesync-cannot-read-file-passing-path-variable-in-nodejs#comment118494792_56744208
// TODO: Update note in .env.example
// const keyPath = process.env.SSL_KEY_FILE.substring(2);
// const crtPath = process.env.SSL_CRT_FILE.substring(2);
const keyPath = "keys/xip.io.key";
const crtPath = "keys/xip.io.crt";
console.log({ keyPath, crtPath });

var options = { // https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/ and https://programmerblog.net/nodejs-https-server/
	key: fs.readFileSync(keyPath), // https://serversforhackers.com/c/self-signed-ssl-certificates https://github.com/ryancwalsh/xip.io-cert https://www.freecodecamp.org/news/how-to-set-up-https-locally-with-create-react-app/
	cert: fs.readFileSync(crtPath)
};
console.log({ options });


var server = https.createServer(options, app)
console.log({ server });

var io = require('socket.io')(server)

app.use(cors()) // https://stackoverflow.com/a/19743442/470749
app.use(bodyParser.json())

if(process.env.NODE_ENV==='production'){
	app.use(express.static(__dirname+"/build"))
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname+"/build/index.html"))
	})
}
const port = process.env.PORT || 4001;
console.log({ port });
app.set('port', port);

let sanitizeString = (str) => {
	return xss(str)
}

let connections = {}
let messages = {}
let timeOnline = {}

io.on('connection', (socket) => {

	socket.on('join-call', (path) => {
		console.log('join-call', {socket, path});
		if(connections[path] === undefined){
			connections[path] = []
		}
		connections[path].push(socket.id)

		timeOnline[socket.id] = new Date()

		for(let a = 0; a < connections[path].length; ++a){
			io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
		}

		if(messages[path] !== undefined){
			for(let a = 0; a < messages[path].length; ++a){
				io.to(socket.id).emit("chat-message", messages[path][a]['data'], 
					messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
			}
		}

		console.log(path, connections[path])
	})

	socket.on('signal', (toId, message) => {
		// console.log('signal', { toId, message, socket});
		io.to(toId).emit('signal', socket.id, message)
	})

	socket.on('chat-message', (data, sender) => {
		data = sanitizeString(data)
		sender = sanitizeString(sender)

		var key
		var ok = false
		for (const [k, v] of Object.entries(connections)) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k
					ok = true
				}
			}
		}

		if(ok === true){
			if(messages[key] === undefined){
				messages[key] = []
			}
			messages[key].push({"sender": sender, "data": data, "socket-id-sender": socket.id})
			console.log("message", key, ":", sender, data)

			for(let a = 0; a < connections[key].length; ++a){
				io.to(connections[key][a]).emit("chat-message", data, sender, socket.id)
			}
		}
	})

	socket.on('disconnect', () => {
		console.log('disconnect');
		var diffTime = Math.abs(timeOnline[socket.id] - new Date())
		var key
		for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k

					for(let a = 0; a < connections[key].length; ++a){
						io.to(connections[key][a]).emit("user-left", socket.id)
					}
			
					var index = connections[key].indexOf(socket.id)
					connections[key].splice(index, 1)

					console.log(key, socket.id, Math.ceil(diffTime / 1000))

					if(connections[key].length === 0){
						delete connections[key]
					}
				}
			}
		}
	})
})

server.listen(port, () => {
	console.log("listening on", port)
})