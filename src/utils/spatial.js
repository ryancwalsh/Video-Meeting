// Create an AudioContext
let audioContext = new AudioContext();

// Create a (first-order Ambisonic) Resonance Audio scene and pass it the AudioContext.
// Initialize scene and create Source(s).
let scene = new window.ResonanceAudio(audioContext, {
	ambisonicOrder: 1,
});
// Connect the scene’s binaural output to stereo out.
scene.output.connect(audioContext.destination);
// By default, room dimensions are undefined (0m x 0m x 0m). https://resonance-audio.github.io/resonance-audio/develop/web/getting-started
const roomDimensions = {
  width: 25,
  height: 25,
  depth: 25,
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
scene.setRoomProperties(roomDimensions, roomMaterials);
scene.output.connect(audioContext.destination);
const soundSources = {};
let isMouseDown = false;
let left = 0;
const width = 500;
const colors = ['red', 'blue', 'green'];
let currentDiv;

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

function setSoundCoordinates(participantUserId, point) {
	const { x, y, z } = point;
	const soundSource = soundSources[participantUserId];
	soundSource.setPosition(x, y, z);
	console.log(soundSource, x, y, z);
}

function scaleCoordinates(point, roomDimensions) { // TODO
	const { x, y, z } = point;
	return {
		x: x / 100,
		y: y / 100,
		z
	}
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

export function createDraggableDiv(participantUserId, video) {
	const color = colors.pop();
	console.log('createDraggableDiv', color, video);
	const div = document.createElement("div");
	div.style.position = "absolute";
	div.style.left = `${left}px`;
	div.style.top = "0px";
	div.style.width = `${width}px`;
	div.style.background = color;
	div.setAttribute('data-participantUserId', participantUserId);
	left += width;

	document.getElementById('main').appendChild(div);
	div.append(video);
    div.append(participantUserId);
    
    const mediaElementSource = audioContext.createMediaStreamSource(video.srcObject);
    const soundSource = scene.createSource();
    soundSources[participantUserId] = soundSource;
    mediaElementSource.connect(soundSource.input);
    console.log('mediaElementSource', mediaElementSource);

	div.addEventListener('mousedown', function(event) {
		isMouseDown = true;
        const xy = getRestrictedPosition(div, event);
		div.setAttribute('data-offset', JSON.stringify(xy));
		currentDiv = div;
    }, true);
}

document.addEventListener('mouseup', function() {
    isMouseDown = false;
}, true);

document.addEventListener('mousemove', function (event) {
	event.preventDefault();
	if (isMouseDown && currentDiv) {
		const { x, y } = getXY(event, currentDiv.getAttribute('data-offset'));
		currentDiv.style.left = x + 'px';
		currentDiv.style.top = y + 'px';
		const participantUserId = currentDiv.getAttribute('data-participantUserId');
		const point = scaleCoordinates({ x, y, z: 1 }, roomDimensions);
		setSoundCoordinates(participantUserId, point);
    }
}, true);