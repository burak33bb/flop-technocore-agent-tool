import { writeFile } from "node:fs/promises";
import { makeKit } from "../lib/technocore.js";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] || "";
}

function usage() {
  console.log(`Usage:
node scripts/create-kit.js --agent flop-codex-agent --x your_handle --type tool --url https://github.com/you/repo --summary "A local Technocore DID proof tool."

Optional:
  --save proof-kit.json
`);
}

const agentName = arg("agent");
const contributionUrl = arg("url");
const contributionSummary = arg("summary");

if (!agentName || !contributionUrl || !contributionSummary) {
  usage();
  process.exit(1);
}

const kit = makeKit({
  agentName,
  xHandle: arg("x"),
  contributionType: arg("type", "tool"),
  contributionUrl,
  contributionSummary
});

const savePath = arg("save");
const publicOutput = {
  agentName: kit.agentName,
  xHandle: kit.xHandle,
  did: kit.did,
  fingerprint: kit.fingerprint,
  mailbox: kit.mailbox,
  didProfilePath: kit.didProfilePath,
  contributionPath: kit.contributionPath,
  urls: kit.urls,
  publicProof: kit.publicProof
};

console.log(JSON.stringify(publicOutput, null, 2));
console.error("\nPrivate key was generated. Use the web UI if you want a browser download, or pass --save to write the full kit locally.");

if (savePath) {
  await writeFile(savePath, JSON.stringify(kit, null, 2), { flag: "wx" });
  console.error(`Saved full kit to ${savePath}. Keep it private.`);
}
