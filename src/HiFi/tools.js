export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
    
export function linearScale(factor, minInput, maxInput, minOutput, maxOutput) {
    factor = clamp(factor, minInput, maxInput);
    const scaled = minOutput + (maxOutput - minOutput) * (factor - minInput) / (maxInput - minInput);
    return scaled;
}

export function getNumRowsAndCols(numParticipants, videoContainerWidth, videoContainerHeight) {
    // TODO: Make more dynamic, and make responsive to screen size.
    let numRows;
    let numCols;
    if (numParticipants === 1) {
        numRows = 1;
        numCols = 1;
    } else if (numParticipants === 2) {
        numRows = 2;
        numCols = 1;
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

export function getVirtualSpaceDimensions(numRows, numCols) {
    const virtualSpaceDimensions = {
        "x": numRows / 2, // in meters
        "y": numCols / 2,
    };
    console.log(`New virtual space dimensions (meters): ${JSON.stringify(virtualSpaceDimensions)}`);
    return virtualSpaceDimensions;
}