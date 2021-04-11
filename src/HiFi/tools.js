/**
 * 
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 
 * @param {number} factor 
 * @param {number} minInput 
 * @param {number} maxInput 
 * @param {number} minOutput 
 * @param {number} maxOutput 
 * @returns {number}
 */
function linearScale(factor, minInput, maxInput, minOutput, maxOutput) {
    const boundFactor = clamp(factor, minInput, maxInput);
    const scaled = minOutput + (maxOutput - minOutput) * (boundFactor - minInput) / (maxInput - minInput);
    return scaled;
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
    for (let i = 0; i < possiblePositions.length; i += 1) {
        const pos = possiblePositions[i];
        if (pos.x < xMin) {
            xMin = pos.x;
        }
        if (pos.x > xMax) {
            xMax = pos.x;
        }
        if (pos.y < yMin) {
            yMin = pos.y;
        }
        if (pos.y > yMax) {
            yMax = pos.y;
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
 * @param {Map} providedUserIDsToVideoElementsMap
 * @param {array} userConfigurations
 */
export function updateStylePositions(spaceContainer, currentParticipantProvidedUserIds, positionConfiguration,
    numParticipants, providedUserIDsToVideoElementsMap, userConfigurations) {
    let eachVideoStyle = userConfigurations[numParticipants].eachVideoStyle;
    const containerHeight = spaceContainer.offsetHeight;
    const containerWidth = spaceContainer.offsetWidth;
    // const hashedIDsToVideoElements = spaceContainer.querySelector('video');
    const { xMin, xMax, yMin, yMax } = getBounded(positionConfiguration);

    providedUserIDsToVideoElementsMap.forEach((element, key, map) => {
        let idx = currentParticipantProvidedUserIds.indexOf(key);
        let position = positionConfiguration.positions[idx];
        console.log({ idx, position });

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

export function moveVideo(userId, videoWrapperDiv) {
    const unattachedVideos = document.getElementById('unattached-videos');
    const existingVideo = unattachedVideos.querySelector(`video[data-userid="${userId}"]`);
    console.log({ unattachedVideos, existingVideo });
    if (existingVideo) {
        videoWrapperDiv.appendChild(existingVideo);
    }
}
