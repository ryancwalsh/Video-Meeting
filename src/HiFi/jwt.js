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

/**
 * 
 * @param {string} uniqueUserId Set this string to an arbitrary value. Its value should be unique across all clients connecting to a given Space so that other clients can identify this one.
 * @returns {SignJWT}
 */
export function getJwt(uniqueUserId) {
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