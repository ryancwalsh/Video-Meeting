// import { HighFidelityAudio } from 'hifi-spatial-audio'; // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/main/experiments/nodejs/videochat-twilio/views/index.ejs
// import { Point3D, HiFiCommunicator } from "hifi-spatial-audio";
import { updateStylePositions, moveVideo } from './tools';
import { userConfigurations, FORWARD_ORIENTATION, zeroPoint } from './configurations';
import { getJwt } from './jwt';

const HighFidelityAudio = window.HighFidelityAudio;

let hifiCommunicator;
let myProvidedUserId;
let currentParticipantProvidedUserIds = [];
let providedUserIDsToVideoElementsMap = new Map();
let isMuted = false;

/**
 * 
 * @param {element} spaceContainer
 */
function updatePositions(spaceContainer) {
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
    
    let positionConfiguration = userConfigurations[numParticipants - 1];
    let myPosition = positionConfiguration.positions[myIndex];
    let myOrientation = positionConfiguration.orientations[myIndex];
    const myVector = {
        position: myPosition,
        orientationEuler: myOrientation, // new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
    };
    console.log('myVector', JSON.stringify(myVector, null, 2), { positionConfiguration });
    const userDataUpdated = hifiCommunicator.updateUserDataAndTransmit(myVector);
    console.log('updateUserDataAndTransmit', userDataUpdated);
    updateStylePositions(spaceContainer, currentParticipantProvidedUserIds, positionConfiguration,
        numParticipants, providedUserIDsToVideoElementsMap, userConfigurations);
}

/**
 * 
 * @param {string} userId
 * @param {element} spaceContainer 
 */
function participantConnected(userId, spaceContainer) {
    console.log('Participant connected', userId);
    const username = userId.split('_')[0]; // TODO: Handle cases where users provide a username with one or more underscores.
    const videoWrapperDiv = document.createElement('div');
    videoWrapperDiv.setAttribute('data-userid', userId);
    videoWrapperDiv.classList.add('positioned-participant');
    videoWrapperDiv.appendChild(document.createTextNode(username));
    document.getElementById('main').appendChild(videoWrapperDiv);
    moveVideo(userId, videoWrapperDiv);
    providedUserIDsToVideoElementsMap.set(userId, spaceContainer.appendChild(videoWrapperDiv));
    console.log({ providedUserIDsToVideoElementsMap });
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