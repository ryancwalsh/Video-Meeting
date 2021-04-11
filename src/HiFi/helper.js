// import { HighFidelityAudio } from 'hifi-spatial-audio'; // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/main/experiments/nodejs/videochat-twilio/views/index.ejs
// import { Point3D, HiFiCommunicator } from "hifi-spatial-audio";
import { getNumRowsAndCols, getVirtualSpaceDimensions, clamp, linearScale } from './tools';
// import { SignJWT } from 'jose/jwt/sign';
// import { SignJWT } from 'jose/dist/browser/jwt/sign';

// const { SignJWT } = require('jose/dist/node/cjs/jwt/sign'); // Used to create a JWT associated with your Space.
const KJUR = require('jsrsasign');

// This is your "App ID" as obtained from the High Fidelity Audio API Developer Console.
const APP_ID = process.env.REACT_APP_HI_FI_APP_ID;

// This is your "Space ID" as obtained from the High Fidelity Audio API Developer Console.
const SPACE_ID = process.env.REACT_APP_HI_FI_SPACE_ID;
console.log({ SPACE_ID });

// This is the "App Secret" as obtained from the High Fidelity Audio API Developer Console.
const APP_SECRET = process.env.REACT_APP_HI_FI_APP_SECRET;

const HighFidelityAudio = window.HighFidelityAudio;

let hifiCommunicator;
let myProvidedUserId;
let currentParticipantProvidedUserIds = [];
let providedUserIDsToVideoElementsMap = new Map();
let isMuted = false;
const zeroPoint = {
    x: 0,
    y: 0,
    z: 0
};
const FORWARD_ORIENTATION = {
    pitchDegrees: 0,
    yawDegrees: 0,
    rollDegrees: 0
};

 let userConfigurations = [ // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/f0fa461/experiments/web/videochat-tokbox/index.html#L75
     null,
     {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "100%", "height": "100%" },
    },
    {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": -0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 180, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "100%", "height": "50%" },
    },
    {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": -0.35, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.35, "y": -0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 180, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 315, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 45, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "50%", "height": "50%" },
    },
    {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": -0.5, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.5, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.5, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": -0.5, "y": 0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 315, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 45, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 135, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 225, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "50%", "height": "50%" },
    },
    {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": -0.75, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.75, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": -0.75, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": -0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 225, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 180, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 135, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 315, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "33%", "height": "33%" },
    },
    {
        "positions": [
            new HighFidelityAudio.Point3D({ "x": -0.75, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.75, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": -0.75, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": -0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0.75, "y": -0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 225, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 180, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 135, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 315, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 45, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "33%", "height": "33%" },
    },
]

/**
 * 
 * @param {object} virtualSpaceDimensions 
 * @param {number} numRows 
 * @param {number} numCols 
 * @returns {array}
 */
function getPossiblePositions(virtualSpaceDimensions, numRows, numCols) {
    // TODO: Clean up and document
    const possiblePositions = [];
    for (let i = -virtualSpaceDimensions.x / 2; i < virtualSpaceDimensions.x / 2; i += virtualSpaceDimensions.x / numCols) {
        for (let j = -virtualSpaceDimensions.y / 2; j < virtualSpaceDimensions.y / 2; j += virtualSpaceDimensions.y / numRows) {
            const coord = {
                "x": i + virtualSpaceDimensions.x / numCols / 2,
                "y": j + virtualSpaceDimensions.y / numRows / 2,
                "z": 0
            };
            possiblePositions.push(new HighFidelityAudio.Point3D(coord));
        }
    }
    return possiblePositions;
}

/**
 * 
 * @param {object} positionConfiguration 
 * @returns {object}
 */
function getBounded(positionConfiguration) {
    let possiblePositions = positionConfiguration.positions;
    let xMin = 9999;
    let xMax = -9999;
    let yMin = 9999;
    let yMax = -9999;
    for (let i = 0; i < possiblePositions.length; i++) {
        if (possiblePositions[i].x < xMin) {
            xMin = possiblePositions[i].x;
        }
        if (possiblePositions[i].x > xMax) {
            xMax = possiblePositions[i].x;
        }
        if (possiblePositions[i].y < yMin) {
            yMin = possiblePositions[i].y;
        }
        if (possiblePositions[i].y > yMax) {
            yMax = possiblePositions[i].y;
        }
    }
    console.log('getBounded', { xMin, xMax, yMin, yMax });
    return { xMin, xMax, yMin, yMax };
}

/**
 * 
 * @param {element} spaceContainer 
 * @param {array} currentParticipantProvidedUserIds
 * @param {object} positionConfiguration 
 * @param {number} numParticipants
 */
function updateStylePositions(spaceContainer, currentParticipantProvidedUserIds, positionConfiguration, numParticipants) {
    let eachVideoStyle = userConfigurations[numParticipants - 1].eachVideoStyle;
    const containerHeight = spaceContainer.offsetHeight;
    const containerWidth = spaceContainer.offsetWidth;
    // const hashedIDsToVideoElements = spaceContainer.querySelector('video');
    const { xMin, xMax, yMin, yMax } = getBounded(positionConfiguration);

    providedUserIDsToVideoElementsMap.forEach((element, key, map) => {
        let idx = currentParticipantProvidedUserIds.indexOf(key);
        let position = positionConfiguration.positions[idx];

        element.style.width = eachVideoStyle.width;
        element.style.height = eachVideoStyle.height;

        // `-1` term because we want higher `position.y` values to yield a video towards the top of the browser window
        let topOffset = linearScale(-1 * position.y, yMin, yMax, 0, containerHeight) - (element.offsetHeight / 2);
        topOffset = clamp(topOffset, 0, containerHeight - element.offsetHeight);
        if (numParticipants > 1) {
            element.style.top = `${topOffset}px`;
        } else {
            element.style.top = "0";
        }

        let leftOffset = linearScale(position.x, xMin, xMax, 0, containerWidth) - (element.offsetWidth / 2);
        leftOffset = clamp(leftOffset, 0, containerWidth - element.offsetWidth);
        if (numParticipants > 1) {
            element.style.left = `${leftOffset}px`;
        } else {
            element.style.left = "0";
        }
    });
}

/**
 * 
 * @param {element} spaceContainer
 */
function updatePositions(spaceContainer) {
    // const containerWidth = spaceContainer.offsetWidth;
    // const containerHeight = spaceContainer.offsetHeight;
    if (!hifiCommunicator) {
        return;
    }
    let numParticipants = currentParticipantProvidedUserIds.length;
    if (!numParticipants) {
        return;
    }
    currentParticipantProvidedUserIds.sort();
    console.log(`updatePositions ${numParticipants} participants.`, currentParticipantProvidedUserIds);
    let myIndex = currentParticipantProvidedUserIds.indexOf(myProvidedUserId);
    if (myIndex === -1) {
        console.error(`Couldn't find \`myProvidedUserID\` ${myProvidedUserId} in \`currentParticipantProvidedUserIDs\`!`, currentParticipantProvidedUserIds);
        return;
    }
    // const { numRows, numCols } = getNumRowsAndCols(numParticipants, containerWidth, containerHeight);
    
    // let virtualSpaceDimensions = getVirtualSpaceDimensions(numRows, numCols); // in meters
    // const possiblePositions = getPossiblePositions(virtualSpaceDimensions, numRows, numCols);
    
    // let myPosition = possiblePositions[myIndex];
    // console.log(`${possiblePositions.length} possible positions: ${JSON.stringify(possiblePositions, null, 2)}`);
    
    let positionConfiguration = userConfigurations[numParticipants];
    let myPosition = positionConfiguration.positions[myIndex];
    let myOrientation = positionConfiguration.orientations[myIndex];
    const myVector = {
        position: myPosition,
        orientationEuler: myOrientation, // new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
    };
    console.log('myVector', JSON.stringify(myVector, null, 2));
    const userDataUpdated = hifiCommunicator.updateUserDataAndTransmit(myVector);
    console.log('updateUserDataAndTransmit', userDataUpdated);
    updateStylePositions(spaceContainer, currentParticipantProvidedUserIds, positionConfiguration, numParticipants);
}

function moveVideo(userId, videoWrapperDiv) {
    const unattachedVideos = document.getElementById('unattached-videos');
    const existingVideo = unattachedVideos.querySelector(`video[data-userId="${userId}"]`);
    console.log({ unattachedVideos, existingVideo });
    if (existingVideo) {
        // document.querySelector(`#main [data-userId="${userId}"]`);
        videoWrapperDiv.appendChild(existingVideo);
    }
}

/**
 * 
 * @param {string} userId
 * @param {element} spaceContainer 
 */
export function participantConnected(userId, spaceContainer) {
    console.log('Participant connected', userId);
    const div = document.createElement('div');
    div.id = `userId-${userId}`;
    div.setAttribute('data-username', userId);
    div.classList.add('positioned-participant');
    // participant.on('trackAdded', track => {
    //     if (track.kind === 'data') {
    //         track.on('message', data => {
    //             console.log("Message from track:" + data);
    //         });
    //     }
    // });
    // participant.on('trackSubscribed', track => trackSubscribed(div, track));
    // participant.on('trackUnsubscribed', trackUnsubscribed);
    // participant.tracks.forEach(publication => {
    //     if (publication.isSubscribed) {
    //         trackSubscribed(div, publication.track);
    //     }
    // });
    providedUserIDsToVideoElementsMap.set(userId, spaceContainer.appendChild(div));
    console.log({ providedUserIDsToVideoElementsMap });
    updatePositions(spaceContainer);
}

// /**
//  * 
//  * @param {string} userId
//  * @param {element} spaceContainer 
//  */
// export function participantConnected(userId, spaceContainer) {
//     console.log('Participant connected', userId);
//     const videoWrapperDiv = document.createElement('div');
//     videoWrapperDiv.id = `userId-${userId}`;
//     videoWrapperDiv.setAttribute('data-userId', userId);
//     videoWrapperDiv.classList.add('positioned-participant');
//     videoWrapperDiv.appendChild(document.createTextNode(userId));
//     document.getElementById('main').appendChild(videoWrapperDiv);
//     moveVideo(userId, videoWrapperDiv);
//     providedUserIDsToVideoElementsMap.set(userId, spaceContainer.appendChild(videoWrapperDiv));
//     console.log({ providedUserIDsToVideoElementsMap });
//     updatePositions(spaceContainer);
// }

/**
 * 
 * @param {array} receivedHiFiAudioAPIDataArray 
 * @param {element} spaceContainer 
 */
function onNewHiFiUserDataReceived(receivedHiFiAudioAPIDataArray, spaceContainer) {
    console.log('onNewHiFiUserDataReceived receivedHiFiAudioAPIDataArray', receivedHiFiAudioAPIDataArray);
    let newUserReceived = false;
    for (let i = 0; i < receivedHiFiAudioAPIDataArray.length; i += 1) {
        let currentProvidedVisitID = receivedHiFiAudioAPIDataArray[i].providedUserID;
        // Or we could use hashedVisitID https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/f0fa461/experiments/web/videochat-tokbox/index.html#L302
        if (currentParticipantProvidedUserIds.indexOf(currentProvidedVisitID) === -1) {
            console.log(`New HiFi User! Provided ID: ${currentProvidedVisitID}`);
            currentParticipantProvidedUserIds.push(currentProvidedVisitID);
            participantConnected(currentProvidedVisitID, spaceContainer);
        }
    }

    if (newUserReceived) {
        updatePositions(spaceContainer);
    }
}

/**
 * 
 * @param {string} uniqueUserId Set this string to an arbitrary value. Its value should be unique across all clients connecting to a given Space so that other clients can identify this one.
 * @returns {SignJWT}
 */
function getJwt(uniqueUserId) {
    // https://www.highfidelity.com/api/guides/misc/getAJWT
    // TODO: This must be handled via backend instead! https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/5acfe236505303d9dfb918db7c29c8a71c96f9ea/examples/web/dots/index.js#L79
    // TODO: Uninstall jsrsasign and jsrsasign-util
    console.log({ uniqueUserId });
    try {
        const claims = {
            "user_id": uniqueUserId, // (Optional) A "User ID" string defined by your application that can be used to identify a particular user's connection
            "app_id": APP_ID,
            "space_id": SPACE_ID,
            "admin": false
        };
        // console.log({ claims });
        const oHeader = {alg: 'HS256', typ: 'JWT'};
        const tNow = KJUR.jws.IntDate.get('now');
        const tEnd = KJUR.jws.IntDate.get('now + 1day');
        claims.nbf = tNow;
        claims.iat = tNow;
        claims.exp = tEnd;
        const sHeader = JSON.stringify(oHeader);
        const sPayload = JSON.stringify(claims);
        const jwt = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, APP_SECRET);
        // const jwt = await new SignJWT(claims) // https://github.com/panva/jose/blob/main/docs/classes/jwt_sign.signjwt.md#class-signjwt
        //     .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        //     // .setIssuedAt()
        //     // .setIssuer('urn:example:issuer')
        //     // .setAudience('urn:example:audience')
        //     // .setExpirationTime('2h')
        //     .sign(APP_SECRET);
        console.log({ jwt });
        return jwt;
    } catch (error) {
        console.error(`Couldn't create JWT! Error: ${error}`);
        return;
    }
}

/**
 * 
 * @param {element} outputAudioEl 
 * @param {element} spaceContainer 
 * @param {string} uniqueUsername 
 * @returns 
 */
export async function connectToHiFi(outputAudioEl, spaceContainer, uniqueUsername) {
    // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/main/experiments/nodejs/videochat-twilio/views/index.ejs
    // Disable the Connect button after the user clicks it so we don't double-connect.
    // connectDisconnectButton.disabled = true;
    // connectDisconnectButton.innerHTML = `Connecting...`;
    // toggleInputMuteButton.disabled = true;
    // Get the audio media stream associated with the user's default audio input device.
    let audioMediaStream;
    try {
        audioMediaStream = await navigator.mediaDevices.getUserMedia({ audio: HighFidelityAudio.getBestAudioConstraints(), video: false });
    } catch (error) {
        console.error('connectToHiFi', error);
        return;
    }
    // Set up the initial data for our user (who will be standing at the origin, facing "forward").
    let initialHiFiAudioAPIData = new HighFidelityAudio.HiFiAudioAPIData({
        position: new HighFidelityAudio.Point3D(zeroPoint),
        orientationEuler: new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION)
    });
    HighFidelityAudio.HiFiLogger.setHiFiLogLevel(HighFidelityAudio.HiFiLogLevel.Debug);
    hifiCommunicator = new HighFidelityAudio.HiFiCommunicator({ // Set up our `HiFiCommunicator` object, supplying our media stream and initial user data.
        initialHiFiAudioAPIData: initialHiFiAudioAPIData
    });
    await hifiCommunicator.setInputAudioMediaStream(audioMediaStream);
    currentParticipantProvidedUserIds = [];
    providedUserIDsToVideoElementsMap.clear();
    try {
        const jwt = getJwt(uniqueUsername);
        // const jwt = process.env.REACT_APP_HI_FI_JWT;
        console.log({ jwt });
        let response = await hifiCommunicator.connectToHiFiAudioAPIServer(jwt); // Connect to the HiFi Audio API server!
        myProvidedUserId = response.audionetInitResponse.user_id;
        currentParticipantProvidedUserIds.push(myProvidedUserId);
        console.log({ myProvidedUserId, currentParticipantProvidedUserIds, response });
    } catch (error) {
        console.error(`Error connecting to High Fidelity:`, error);
        // connectDisconnectButton.disabled = false;
        // toggleInputMuteButton.disabled = true;
        // connectDisconnectButton.innerHTML = `Connection error. Retry?`;
        return;
    }
    // Show the user that we're connected by changing the text on the button.
    // connectDisconnectButton.removeEventListener("click", connectToHiFiAndVideoService);
    // connectDisconnectButton.addEventListener("click", disconnectFromHiFiAndVideoService);
    // connectDisconnectButton.innerHTML = `Disconnect`;
    // connectDisconnectButton.disabled = false;
    // toggleInputMuteButton.disabled = false;
    outputAudioEl.srcObject = hifiCommunicator.getOutputAudioMediaStream(); // Set the `srcObject` on our `audio` DOM element to the final, mixed audio stream from the High Fidelity Audio API Server.
    outputAudioEl.play(); // We explicitly call `play()` here because certain browsers won't play the newly-set stream automatically.
    // Set up a new User Data Subscription to get User Data updates from the server.
    let newUserDataSubscription = new HighFidelityAudio.UserDataSubscription({
        // Setting `providedUserID` to `null` (or omitting it) means we will get data updates from **all** connected Users, including ourselves.
        "providedUserID": null,
        // There are other components we could subscribe to here, but we're only subscribing to Volume data updates.
        "components": [
            HighFidelityAudio.AvailableUserDataSubscriptionComponents.Position,
            HighFidelityAudio.AvailableUserDataSubscriptionComponents.OrientationEuler
        ],
        "callback": (receivedHiFiAudioAPIDataArray) => onNewHiFiUserDataReceived(receivedHiFiAudioAPIDataArray, spaceContainer)
    });
    // Actually add the newly-constructed Data Subscription to the list of our Data Subscriptions on our `HiFiCommunicator`.
    hifiCommunicator.addUserDataSubscription(newUserDataSubscription);
}

export async function toggleMicInputMute() {
    if (!hifiCommunicator) {
        return;
    }
    if (await hifiCommunicator.setInputAudioMuted(!isMuted)) {
        isMuted = !isMuted;
        // toggleInputMuteButton.innerHTML = `Toggle Mute (currently ${isMuted ? "muted" : "unmuted"})`;
    }
}

export function disconnectFromHiFi() {
    // TODO: Figure out when/where to call this.
    console.log(`Disconnecting from High Fidelity Audio API Servers...`);
    // connectDisconnectButton.removeEventListener("click", disconnectFromHiFiAndVideoService);
    // connectDisconnectButton.addEventListener("click", connectToHiFiAndVideoService);
    // connectDisconnectButton.disabled = false;
    // connectDisconnectButton.innerHTML = `Connect`;
    // toggleInputMuteButton.disabled = true;
    // isMuted = false;
    if (hifiCommunicator) {
        hifiCommunicator.disconnectFromHiFiAudioAPIServer();
    }
    hifiCommunicator = null;
}