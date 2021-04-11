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
 * @param {array} possiblePositions 
 * @param {object} virtualSpaceDimensions 
 * @param {number} numParticipants 
 * @param {number} numCols 
 * @param {number} numRows 
 * @param {number} containerHeight 
 * @param {number} containerWidth 
 */
function updateStylePositions(possiblePositions, virtualSpaceDimensions, numParticipants, numCols, numRows, containerHeight, containerWidth) {
    let eachVideoStyle = {
        "width": `${100 / numCols}%`,
        "height": `${100 / numRows}%`,
    };
    providedUserIDsToVideoElementsMap.forEach((value, key, map) => {
        // TODO: Clean up and document
        let idx = currentParticipantProvidedUserIds.indexOf(key);
        if (idx === -1) {
            console.error(`Couldn't find \`providedUserID\` \`${key}\` in \`currentParticipantProvidedUserIDs\`!`, currentParticipantProvidedUserIds);
            return;
        }
        let position = possiblePositions[idx];
        value.style.width = eachVideoStyle.width;
        value.style.height = eachVideoStyle.height;
        // `-1` term because we want higher `position.y` values to yield a video towards the top of the browser window
        let topOffset = linearScale(-1 * position.y, -virtualSpaceDimensions.y / 2, virtualSpaceDimensions.y / 2, 0, containerHeight) - (value.offsetHeight / 2);
        topOffset = clamp(topOffset, 0, containerHeight - value.offsetHeight);
        if (numParticipants > 1) {
            value.style.top = `${topOffset}px`;
        } else {
            value.style.top = "0";
        }
        let leftOffset = linearScale(position.x, -virtualSpaceDimensions.x / 2, virtualSpaceDimensions.x / 2, 0, containerWidth) - (value.offsetWidth / 2);
        leftOffset = clamp(leftOffset, 0, containerWidth - value.offsetWidth);
        if (numParticipants > 1) {
            value.style.left = `${leftOffset}px`;
        } else {
            value.style.left = "0";
        }
    });
}

/**
 * 
 * @param {element} spaceContainer
 */
function updatePositions(spaceContainer) {
    const containerWidth = spaceContainer.offsetWidth;
    const containerHeight = spaceContainer.offsetHeight;
    if (!hifiCommunicator) {
        return;
    }
    let numParticipants = currentParticipantProvidedUserIds.length;
    if (!numParticipants) {
        return;
    }
    currentParticipantProvidedUserIds.sort();
    console.log(`updatePositions ${numParticipants} participants.`);
    let myIndex = currentParticipantProvidedUserIds.indexOf(myProvidedUserId);
    if (myIndex === -1) {
        console.error(`Couldn't find \`myProvidedUserID\` ${myProvidedUserId} in \`currentParticipantProvidedUserIDs\`!`, currentParticipantProvidedUserIds);
        return;
    }
    const { numRows, numCols } = getNumRowsAndCols(numParticipants, containerWidth, containerHeight);
    
    let virtualSpaceDimensions = getVirtualSpaceDimensions(numRows, numCols); // in meters
    const possiblePositions = getPossiblePositions(virtualSpaceDimensions, numRows, numCols);
    
    let myPosition = possiblePositions[myIndex];
    console.log(`${possiblePositions.length} possible positions: ${JSON.stringify(possiblePositions, null, 2)}`);
    console.log(`My position: ${JSON.stringify(myPosition)}`);
    const userDataUpdated = hifiCommunicator.updateUserDataAndTransmit({
        position: myPosition,
        orientationEuler: new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
    });
    console.log('updateUserDataAndTransmit', userDataUpdated);
    // TODO updateStylePositions(possiblePositions, virtualSpaceDimensions, numParticipants, numCols, numRows, containerHeight, containerWidth);
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
    updatePositions(spaceContainer);
}

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