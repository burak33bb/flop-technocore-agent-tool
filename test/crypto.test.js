import assert from "node:assert/strict";
import { generateKeyPairSync, sign, verify } from "node:crypto";
import { base64url, didFromPublicKey, fingerprintForDid } from "../lib/technocore.js";

const pair = generateKeyPairSync("ed25519");
const did = didFromPublicKey(pair.publicKey);
const fingerprint = fingerprintForDid(did);
const payload = Buffer.from("lobby|123456789|hello technocore", "utf8");
const sig = sign(null, payload, pair.privateKey);

assert.match(did, /^did:key:z6Mk/);
assert.equal(fingerprint.length, 16);
assert.equal(base64url(sig).length, 86);
assert.equal(verify(null, payload, pair.publicKey, sig), true);

console.log("crypto tests passed");
