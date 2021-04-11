const HighFidelityAudio = window.HighFidelityAudio;
export const zeroPoint = { // https://docs.highfidelity.com/js/latest/classes/classes_hifiaudioapidata.point3d.html
    x: 0, //-x is left; +x is right
    y: 0, //-y is out of the screen towards the user; +y is into the screen
    z: 0 // -z is down; +z is up
};
export const FORWARD_ORIENTATION = {
    pitchDegrees: 0,
    yawDegrees: 0,
    rollDegrees: 0
};

export const userConfigurations = [ // https://github.com/highfidelity/Spatial-Audio-API-Examples/blob/f0fa461/experiments/web/videochat-tokbox/index.html#L75
    {
        "positions": [
            new HighFidelityAudio.Point3D(zeroPoint),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
        ],
        "eachVideoStyle": { "width": "100%", "height": "100%" },
    },
    { // index 1 means there is 1 other participant (2 total participants)
        "positions": [
            new HighFidelityAudio.Point3D({ "x": 0, "y": 0.5, "z": 0 }),
            new HighFidelityAudio.Point3D({ "x": 0, "y": -0.5, "z": 0 }),
        ],
        "orientations": [
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 180, "rollDegrees": 0 }),
            new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
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
            new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
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
            new HighFidelityAudio.OrientationEuler3D(FORWARD_ORIENTATION),
            new HighFidelityAudio.OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 45, "rollDegrees": 0 }),
        ],
        "eachVideoStyle": { "width": "33%", "height": "33%" },
    },
];