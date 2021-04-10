// import { HighFidelityAudio } from 'hifi-spatial-audio'; // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/main/experiments/nodejs/videochat-twilio/views/index.ejs
import { getNumRowsAndCols, getVirtualSpaceDimensions, clamp, linearScale } from './tools';

const HighFidelityAudio = window.HighFidelityAudio;

const jwt = process.env.REACT_APP_HI_FI_JWT;
console.log({ jwt });
let hifiCommunicator;
let myProvidedUserId;
let currentParticipantProvidedUserIds = [];
let providedUserIDsToVideoElementsMap = new Map();
const FORWARD_ORIENTATION = new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 });
    
function getPossiblePositions(virtualSpaceDimensions, numRows, numCols) {
    const possiblePositions = [];
    for (let i = -virtualSpaceDimensions.x / 2; i < virtualSpaceDimensions.x / 2; i += virtualSpaceDimensions.x / numCols) {
        for (let j = -virtualSpaceDimensions.y / 2; j < virtualSpaceDimensions.y / 2; j += virtualSpaceDimensions.y / numRows) {
            possiblePositions.push(new HighFidelityAudio.Point3D({ "x": i + virtualSpaceDimensions.x / numCols / 2, "y": j + virtualSpaceDimensions.y / numRows / 2, "z": 0 }));
        }
    }
    return possiblePositions;
}

function updatePositions(videoContainerWidth, videoContainerHeight) {
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
        console.error(`Couldn't find \`myProvidedUserID\` ${myProvidedUserId} in \`currentParticipantProvidedUserIDs\`!`);
        return;
    }
    const { numRows, numCols } = getNumRowsAndCols(numParticipants, videoContainerWidth, videoContainerHeight);
    
    let virtualSpaceDimensions = getVirtualSpaceDimensions();
    const possiblePositions = getPossiblePositions(virtualSpaceDimensions, numRows, numCols);
    
    let myPosition = possiblePositions[myIndex];
    console.log(`Possible positions:\n${JSON.stringify(possiblePositions, null, 4)}`);
    console.log(`Number of possible positions:\n${possiblePositions.length}`);
    console.log(`My position:\n${JSON.stringify(myPosition)}`);
    console.log(hifiCommunicator.updateUserDataAndTransmit({
        position: myPosition,
        orientationEuler: FORWARD_ORIENTATION,
    }));
    // let videoContainerWidth = videoContainer.offsetWidth;
    // let videoContainerHeight = videoContainer.offsetHeight;
    let eachVideoStyle = {
        "width": `${100 / numCols}%`,
        "height": `${100 / numRows}%`,
    };
    providedUserIDsToVideoElementsMap.forEach((value, key, map) => {
        let idx = currentParticipantProvidedUserIds.indexOf(key);
        if (idx === -1) {
            console.error(`Couldn't find \`providedUserID\` \`${key}\` in \`currentParticipantProvidedUserIDs\`!`);
            return;
        }
        let position = possiblePositions[idx];
        value.style.width = eachVideoStyle.width;
        value.style.height = eachVideoStyle.height;
        // `-1` term because we want higher `position.y` values to yield a video towards the top of the browser window
        let topOffset = linearScale(-1 * position.y, -virtualSpaceDimensions.y / 2, virtualSpaceDimensions.y / 2, 0, videoContainerHeight) - (value.offsetHeight / 2);
        topOffset = clamp(topOffset, 0, videoContainerHeight - value.offsetHeight);
        if (numParticipants > 1) {
            value.style.top = `${topOffset}px`;
        } else {
            value.style.top = "0";
        }
        let leftOffset = linearScale(position.x, -virtualSpaceDimensions.x / 2, virtualSpaceDimensions.x / 2, 0, videoContainerWidth) - (value.offsetWidth / 2);
        leftOffset = clamp(leftOffset, 0, videoContainerWidth - value.offsetWidth);
        if (numParticipants > 1) {
            value.style.left = `${leftOffset}px`;
        } else {
            value.style.left = "0";
        }
    });
}

function onNewHiFiUserDataReceived(receivedHiFiAudioAPIDataArray, videoContainerWidth, videoContainerHeight) {
    let newUserReceived = false;
    for (let i = 0; i < receivedHiFiAudioAPIDataArray.length; i += 1) {
        let currentProvidedVisitID = receivedHiFiAudioAPIDataArray[i].providedUserID;
        if (currentParticipantProvidedUserIds.indexOf(currentProvidedVisitID) === -1) {
            console.log(`New HiFi User! Provided ID: ${currentProvidedVisitID}`);
            currentParticipantProvidedUserIds.push(currentProvidedVisitID);
        }
    }

    if (newUserReceived) {
        updatePositions(videoContainerWidth, videoContainerHeight);
    }
}

export async function connectToHiFi(outputAudioEl, videoContainer) {
    // TODO: Honor the mute button state.
    const videoContainerWidth = videoContainer.offsetWidth;
    const videoContainerHeight = videoContainer.offsetHeight;
    // Disable the Connect button after the user clicks it so we don't double-connect.
    // connectDisconnectButton.disabled = true;
    // connectDisconnectButton.innerHTML = `Connecting...`;
    // toggleInputMuteButton.disabled = true;
    // Get the audio media stream associated with the user's default audio input device.
    let audioMediaStream;
    try {
        audioMediaStream = await navigator.mediaDevices.getUserMedia({ audio: HighFidelityAudio.getBestAudioConstraints(), video: false });
    } catch (e) {
        return;
    }
    // Set up the initial data for our user.
    // They'll be standing at the origin, facing "forward".
    let initialHiFiAudioAPIData = new HighFidelityAudio.HiFiAudioAPIData({
        position: new HighFidelityAudio.Point3D({ "x": 0, "y": 0, "z": 0 }),
        orientationEuler: new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 }) // TODO: Can this be replaced with FORWARD_ORIENTATION?
    });
    HighFidelityAudio.HiFiLogger.setHiFiLogLevel(HighFidelityAudio.HiFiLogLevel.Debug);
    // Set up our `HiFiCommunicator` object, supplying our media stream and initial user data.
    hifiCommunicator = new HighFidelityAudio.HiFiCommunicator({
        initialHiFiAudioAPIData: initialHiFiAudioAPIData
    });
    await hifiCommunicator.setInputAudioMediaStream(audioMediaStream);
    currentParticipantProvidedUserIds = [];
    providedUserIDsToVideoElementsMap.clear();
    // Connect to the HiFi Audio API server!
    try {
        let response = await hifiCommunicator.connectToHiFiAudioAPIServer(jwt);
        myProvidedUserId = response.audionetInitResponse.user_id;
        currentParticipantProvidedUserIds.push(myProvidedUserId);
        console.log(`My Provided User ID: ${myProvidedUserId}`);
    } catch (e) {
        console.error(`Error connecting to High Fidelity:\n${e}`);
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
    // Set the `srcObject` on our `audio` DOM element to the final, mixed audio stream from the High Fidelity Audio API Server.
    outputAudioEl.srcObject = hifiCommunicator.getOutputAudioMediaStream();
    // We explicitly call `play()` here because certain browsers won't play the newly-set stream automatically.
    outputAudioEl.play();
    // Set up a new User Data Subscription to get User Data updates from the server.
    let newUserDataSubscription = new HighFidelityAudio.UserDataSubscription({
        // Setting `providedUserID` to `null` (or omitting it) means we will get data updates from **all** connected Users, including ourselves.
        "providedUserID": null,
        // There are other components we could subscribe to here, but we're only subscribing to Volume data updates.
        "components": [HighFidelityAudio.AvailableUserDataSubscriptionComponents.Position, HighFidelityAudio.AvailableUserDataSubscriptionComponents.OrientationEuler],
        "callback": (receivedHiFiAudioAPIDataArray) => onNewHiFiUserDataReceived(receivedHiFiAudioAPIDataArray, videoContainerWidth, videoContainerHeight)
    });
    // Actually add the newly-constructed Data Subscription to the list of our Data Subscriptions on our `HiFiCommunicator`.
    hifiCommunicator.addUserDataSubscription(newUserDataSubscription);
}