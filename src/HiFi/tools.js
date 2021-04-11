/**
 * 
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
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
export function linearScale(factor, minInput, maxInput, minOutput, maxOutput) {
    const boundFactor = clamp(factor, minInput, maxInput);
    const scaled = minOutput + (maxOutput - minOutput) * (boundFactor - minInput) / (maxInput - minInput);
    return scaled;
}

/**
 * 
 * @param {number} numParticipants 
 * @param {number} videoContainerWidth 
 * @param {number} videoContainerHeight 
 * @returns {object}
 */
export function getNumRowsAndCols(numParticipants, videoContainerWidth, videoContainerHeight) {
    // TODO: Make more dynamic, and make responsive to screen size.
    let numRows;
    let numCols;
    if (numParticipants === 1) {
        numRows = 1;
        numCols = 1;
    } else if (numParticipants === 2) {
        numRows = 1;
        numCols = 2; // left vs right ear
    } else if (numParticipants === 3 || numParticipants === 4) {
        numRows = 2;
        numCols = 2;
    } else if (numParticipants === 5 || numParticipants === 6) {
        numRows = 2;
        numCols = 3;
    } else if (numParticipants > 6) {
        numRows = Math.ceil(Math.sqrt(numParticipants));
        numCols = Math.ceil(Math.sqrt(numParticipants));
    }
    const numRowsAndCols = { numRows, numCols };
    console.log({ numRowsAndCols });
    return numRowsAndCols;
}

/**
 * 
 * @param {number} numRows 
 * @param {number} numCols
 * @returns {object}
 */
export function getVirtualSpaceDimensions(numRows, numCols) {
    const virtualCellWidth = 2; // in meters // TODO
    const virtualCellHeight = virtualCellWidth * 9/16; // in meters
    const virtualSpaceDimensions = {
        x: numRows * virtualCellWidth,
        y: numCols * virtualCellHeight,
    };
    console.log(`New virtual space dimensions (meters): ${JSON.stringify(virtualSpaceDimensions)}`);
    return virtualSpaceDimensions;
}