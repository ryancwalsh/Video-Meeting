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

