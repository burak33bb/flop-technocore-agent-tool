import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] || "";
}

function usage() {
  console.log(`Usage:
node scripts/sign-repo-proof.js --kit burak-technocore-proof-kit.json --repo https://github.com/you/repo --commit <sha> --out repo-proof.public.json
`);
}

const kitPath = arg("kit");
const repo = arg("repo");
const commit = arg("commit");
const outPath = arg("out", "repo-proof.public.json");

if (!kitPath || !repo || !commit) {
  usage();
  process.exit(1);
}

const kit = JSON.parse(await readFile(kitPath, "utf8"));
const privateKey = createPrivateKey(kit.privateKeyPem);
const publicKey = createPublicKey(kit.publicKeyPem);
const canonical = `repo-proof-v1|${kit.did}|${repo}|${commit}`;
const signature = sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64url");
const verified = verify(null, Buffer.from(canonical, "utf8"), publicKey, Buffer.from(signature, "base64url"));

const proof = {
  type: "technocore-repo-proof-v1",
  did: kit.did,
  fingerprint: kit.fingerprint,
  repo,
  commit,
  canonical,
  signature,
  signatureFormat: "ed25519-base64url-unpadded",
  verified,
  publicKeyPem: kit.publicKeyPem,
  sha256: createHash("sha256").update(canonical).digest("hex")
};

await writeFile(outPath, `${JSON.stringify(proof, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify(proof, null, 2));

if (!verified) {
  console.error("Proof verification failed.");
  process.exit(2);
}
