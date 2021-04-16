const soundSources = {};
let isMouseDown = false;
let left = 0;
const width = 500;
const colors = ['red', 'blue', 'green'];
export const draggable = 'draggable';
let currentDiv;
const audioSources = [
	'samples/1.wav',
	'samples/2.wav',
];

// By default, room dimensions are undefined (0m x 0m x 0m). https://resonance-audio.github.io/resonance-audio/develop/web/getting-started
const roomDimensions = {
  width: 5,
  height: 5,
  depth: 5,
};

// Room materials have different acoustic reflectivity.
const roomMaterials = {
  // Room wall materials. https://resonance-audio.github.io/resonance-audio/develop/web/getting-started
  left: 'transparent',
  right: 'transparent',
  front: 'transparent',
  back: 'transparent',
  down: 'transparent', // Room floor
  up: 'transparent', // Room ceiling
};

// Create an AudioContext
let audioContext = new AudioContext();

// Create a (first-order Ambisonic) Resonance Audio scene and pass it the AudioContext.
// Initialize scene and create Source(s).
let scene = new window.ResonanceAudio(audioContext, {
	ambisonicOrder: 1,
});

// scene.setRoomProperties(roomDimensions, roomMaterials);
// Connect the scene’s binaural output to stereo out.
scene.output.connect(audioContext.destination);

function getXY (event, offsetJson) {
	const mousePosition = {
		x : event.clientX,
		y : event.clientY
	};
    const offset = JSON.parse(offsetJson);
	return {
		x: mousePosition.x + offset.x,
		y: mousePosition.y + offset.y
	}
}

function setSoundCoordinates(socketId, point, participantUsername) {
	const { x, y, z } = point;
    const soundSource = soundSources[socketId];
    try {
        soundSource.setPosition(x, y, z); // https://github.com/resonance-audio/resonance-audio-web-sdk/blob/c69e41dae836aea5b41cf4e9e51efcd96e5d0bb6/src/source.js#L178
    } catch (error) {
        console.error('setSoundCoordinates', socketId, point, participantUsername, error);
    }
	console.log(participantUsername, x, y, z, socketId, soundSource);
}

function scaleCoordinates(currentDiv, roomDimensions, container) {
    const videoCenter = getCenterCoordinates(currentDiv);
    const containerCenter = getCenterCoordinates(container);
    const xDiff = videoCenter.x - containerCenter.x;
    const yDiff = videoCenter.y - containerCenter.y;
    const x = +(xDiff / containerCenter.x * roomDimensions.width).toFixed(2);
    const y = +(yDiff / containerCenter.y * roomDimensions.height * -1).toFixed(2);
    const result = {
        x,
        y,
        z: 1
    };
    // console.log({ videoCenter, containerCenter }, x, y);
    return result;
}

/**
 * @see https://stackoverflow.com/questions/8027875/how-to-find-the-elements-x-center-coordinates-and-related-window-offset/46921780#comment95027215_46921780
 * 
 * @param {element} element 
 * @returns {object}
 */
function getCenterCoordinates (element) {
    const x = element.offsetLeft + element.offsetWidth / 2;
    const y = element.offsetTop + element.offsetHeight / 2;
    return { x, y };
}

function getRestrictedPosition(div, event) {
    let x = div.offsetLeft - event.clientX;
    let y = div.offsetTop - event.clientY;
    return { x, y };
    if (x < 0) { // https://stackoverflow.com/a/25933582/470749
        x = 0;
    }
    if (y < 0) {
        y = 0;
    }
    // TODO if (x + eWi > cWi) {
    //     x = cWi - eWi;
    // }
    // if (y + eHe > cHe) {
    //     y = cHe - eHe;
    // }
    return { x, y };
}

function createVideo(socketId, stream, participantUsername) {
    const video = document.createElement('video');
    video.classList.add('other-participant');
    video.setAttribute('data-socketid', socketId);
    video.setAttribute('data-username', participantUsername);
    video.srcObject = stream;
    video.autoplay = true;
    video.playsinline = true;
    return video;
}

function getWrapper(socketId, participantUsername) {
    const color = colors.pop();
    const div = document.createElement("div");
	div.style.position = "absolute";
	div.style.left = `${left}px`;
	div.style.top = "0px";
	div.style.width = `${width}px`;
    div.style.background = color;
    div.classList.add(draggable);
    div.setAttribute('data-participantUsername', participantUsername);
    div.setAttribute('data-socketid', socketId);
    left += width;
    return div;
}

function updateCoordinatesBasedOnPositionWithinContainer(div){
    const socketId = div.getAttribute('data-socketid');
    const participantUsername = div.getAttribute('data-participantUsername');
    const container = document.getElementById('main');
    const point = scaleCoordinates(div, roomDimensions, container);
    setSoundCoordinates(socketId, point, participantUsername);
}

export function createDraggableDiv(socketId, stream, participantUsername) {
    console.log('createDraggableDiv', socketId, participantUsername);
    const video = createVideo(socketId, stream, participantUsername);
    const div = getWrapper(socketId, participantUsername);

    document.getElementById('main').appendChild(div);
    div.append(video);
    const usernameDiv = document.createElement("div");
    usernameDiv.classList.add('username');
    usernameDiv.append(participantUsername);
    div.append(usernameDiv);
    
    const soundSource = scene.createSource();
    soundSources[socketId] = soundSource;
    const streamClone = stream.clone();
    video.muted = true;
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(streamClone); // https://github.com/resonance-audio/resonance-audio-web-sdk/issues/34
    mediaStreamAudioSourceNode.connect(soundSource.input);
    updateCoordinatesBasedOnPositionWithinContainer(div);
}

document.addEventListener('mousedown', function(event) {
    console.log('mousedown', event.target, event);
    const div = event.target.closest(`.${draggable}`);
    if (div) {
        currentDiv = div;
        isMouseDown = true;
        console.log('mousedown', currentDiv.style.background, currentDiv.getAttribute('data-participantUsername'), event);
        const xy = getRestrictedPosition(currentDiv, event);
        currentDiv.setAttribute('data-offset', JSON.stringify(xy));
    }
}, true);

document.addEventListener('mouseup', function() {
    isMouseDown = false;
}, true);

document.addEventListener('mousemove', function (event) {
	event.preventDefault();
	if (isMouseDown && currentDiv) {
		const { x, y } = getXY(event, currentDiv.getAttribute('data-offset'));
		currentDiv.style.left = x + 'px';
        currentDiv.style.top = y + 'px';
        updateCoordinatesBasedOnPositionWithinContainer(currentDiv);
    }
}, true);