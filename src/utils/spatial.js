const soundSources = {};
let isMouseDown = false;
let left = 0;
const width = 500;
const colors = ['red', 'blue', 'green'];
const draggable = 'draggable';
let currentDiv;

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

function setSoundCoordinates(participantUserId, point) {
	const { x, y, z } = point;
	const soundSource = soundSources[participantUserId]; // TODO: Fix the bug where participantUserId collides.
	soundSource.setPosition(x, y, z); // https://github.com/resonance-audio/resonance-audio-web-sdk/blob/c69e41dae836aea5b41cf4e9e51efcd96e5d0bb6/src/source.js#L178
	console.log(soundSource, x, y, z);
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
    console.log({ videoCenter, containerCenter }, x, y);
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

export function createDraggableDiv(participantUserId, video) {
	const color = colors.pop();
	console.log('createDraggableDiv', color, video);
	const div = document.createElement("div");
	div.style.position = "absolute";
	div.style.left = `${left}px`;
	div.style.top = "0px";
	div.style.width = `${width}px`;
    div.style.background = color;
    div.classList.add(draggable);
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
}

document.addEventListener('mousedown', function(event) {
    isMouseDown = true;
    // console.log('mousedown', event.target, event);
    if (event.target.classList.contains(draggable)) {
        currentDiv = event.target;
        console.log('mousedown', currentDiv.style.background, currentDiv.getAttribute('data-participantUserId'), event);
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
        const participantUserId = currentDiv.getAttribute('data-participantUserId');
        const container = document.getElementById('main');
		const point = scaleCoordinates(currentDiv, roomDimensions, container);
		setSoundCoordinates(participantUserId, point);
    }
}, true);