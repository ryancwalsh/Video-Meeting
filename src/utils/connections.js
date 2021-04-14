import { createDraggableDiv } from './spatial';
import { getSilentBlackStream } from './video';

const peerConnectionConfig = {
    'iceServers': [ // https://stackoverflow.com/a/20134888/470749
        // { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};

export function someFuncA(socket, connections, mySocketId) {
    // TODO: What is this??
    for (let id2 in connections) {
        if (id2 === mySocketId) {
            continue;
        }
        
        try {
            connections[id2].addStream(window.localStream);
        } catch (error) {
            console.error(error);
        }

        connections[id2].createOffer().then((description) => {
            connections[id2].setLocalDescription(description).then(() => {
                socket.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
            }).catch(error => console.error(error));
        })
    }
}

export function createRTCPeerConnection(socketId, socket, connections, otherParticipantUsername) {
    // TODO: What is this??
    console.log('clients.forEach socketId', socketId);
    const connection = new RTCPeerConnection(peerConnectionConfig);
    // console.log({ connection });
    connections[socketId] = connection;
    // Wait for their ice candidate
    connection.onicecandidate = function (event) {
        if (event.candidate != null) {
            socket.emit('signal', socketId, JSON.stringify({ 'ice': event.candidate }))
        }
    }

    // Wait for their video stream
    connection.onaddstream = (event) => {
        console.log('onaddstream', { event });
        // const searchVideo = document.querySelector(`[data-socketid="${socketId}"]`)
        // if (searchVideo !== null) { // Without this check, it would be an empty square.
        //     searchVideo.srcObject = event.stream;
        // } else {
        createDraggableDiv(socketId, event.stream, otherParticipantUsername);
        // }
    }

    // Add the local video stream
    if (window.localStream === undefined || window.localStream === null) {
        window.localStream = getSilentBlackStream();
    }
    connection.addStream(window.localStream);
}
