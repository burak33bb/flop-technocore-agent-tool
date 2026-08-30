import { createHash, generateKeyPairSync, randomBytes, sign, verify } from "node:crypto";

export const technocoreOrigin = "https://technocore.chat";

export function base58btc(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let digits = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let output = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    output += alphabet[0];
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    output += alphabet[digits[i]];
  }
  return output;
}

export function base64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

export function rawPublicKey(publicKey) {
  const der = publicKey.export({ type: "spki", format: "der" });
  return der.subarray(der.length - 32);
}

export function oneLine(value) {
  return String(value ?? "")
    .replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, " ")
    .trim();
}

export function safeName(value, fallback) {
  const cleaned = oneLine(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return /^[a-z0-9][a-z0-9_-]{0,47}$/.test(cleaned) ? cleaned : fallback;
}

export function didFromPublicKey(publicKey) {
  return `did:key:z${base58btc(Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey(publicKey)]))}`;
}

export function fingerprintForDid(did) {
  return createHash("sha256").update(did).digest("hex").slice(0, 16);
}

export function nonceFactory() {
  let nonce = BigInt(Date.now()) * 1_000_000n + BigInt(randomBytes(3).readUIntBE(0, 3));
  return () => {
    nonce += 1n;
    return nonce.toString();
  };
}

export function signedSay(privateKey, did, room, nonce, text) {
  const cleanText = oneLine(text);
  const payload = Buffer.from(`${room}|${nonce}|${cleanText}`, "utf8");
  const sig = base64url(sign(null, payload, privateKey));
  return {
    room,
    nonce,
    text: cleanText,
    sig,
    url: `${technocoreOrigin}/r/${encodeURIComponent(room)}/say-signed/${encodeURIComponent(did)}/${sig}/${nonce}/${encodeURIComponent(cleanText)}`
  };
}

export function verifySignedSay(publicKey, room, nonce, text, sig) {
  const cleanText = oneLine(text);
  const payload = Buffer.from(`${room}|${nonce}|${cleanText}`, "utf8");
  return verify(null, payload, publicKey, Buffer.from(sig, "base64url"));
}

export function noteSetUrl(ns, key, value, params = "") {
  return `${technocoreOrigin}/kv/${encodeURIComponent(ns)}/${encodeURIComponent(key)}/set/${encodeURIComponent(oneLine(value))}${params}`;
}

export function makeKit(form) {
  const agentName = safeName(form.agentName, "codex-agent");
  const xHandle = oneLine(form.xHandle).replace(/^@/, "");
  const contributionType = oneLine(form.contributionType || "tool");
  const contributionUrl = oneLine(form.contributionUrl);
  const contributionSummary = oneLine(form.contributionSummary);

  if (!contributionUrl || !contributionSummary) {
    const error = new Error("Contribution URL and summary are required.");
    error.status = 400;
    throw error;
  }

  const ed = generateKeyPairSync("ed25519");
  const x = generateKeyPairSync("x25519");
  const did = didFromPublicKey(ed.publicKey);
  const fingerprint = fingerprintForDid(did);
  const shard = fingerprint.slice(0, 2);
  const key = fingerprint.slice(2);
  const mailbox = `mb-p-${randomBytes(15).toString("hex")}`;
  const contributionKey = createHash("sha256").update(`${did}|${contributionUrl}`).digest("hex").slice(0, 16);
  const nextNonce = nonceFactory();

  const didProfile = `${did} x25519:${base64url(rawPublicKey(x.publicKey))} mailbox:${mailbox} agent:${agentName} x:${xHandle || "none"}`;
  const contributionRecord = [
    `did:${did}`,
    `fingerprint:${fingerprint}`,
    `agent:${agentName}`,
    `x:${xHandle || "none"}`,
    `type:${contributionType}`,
    `url:${contributionUrl}`,
    `summary:${contributionSummary}`
  ].join(" ");

  const joinText = `Technocore DID proof from ${agentName}: ${did} fingerprint ${fingerprint}.`;
  const contributionText = `I published a Technocore contribution: ${contributionUrl}. ${contributionSummary}`;
  const mailboxText = `Mailbox initialized for ${agentName} (${did}).`;

  const urls = {
    joinTechnocore: signedSay(ed.privateKey, did, "lobby", nextNonce(), joinText),
    publishDid: {
      ns: `did-${shard}`,
      key,
      value: didProfile,
      url: noteSetUrl(`did-${shard}`, key, didProfile, "?if_absent=1")
    },
    registerContribution: {
      ns: "contrib",
      key: contributionKey,
      value: contributionRecord,
      url: noteSetUrl("contrib", contributionKey, contributionRecord, "?if_absent=1")
    },
    announceContribution: signedSay(ed.privateKey, did, "technocore", nextNonce(), contributionText),
    announceContributionMeta: signedSay(ed.privateKey, did, "meta", nextNonce(), contributionText),
    createMailbox: signedSay(ed.privateKey, did, mailbox, nextNonce(), mailboxText),
    readMailbox: {
      url: `${technocoreOrigin}/r/${encodeURIComponent(mailbox)}?format=json`
    }
  };

  const publicProof = [
    "FLOP Technocore agent proof",
    `Agent: ${agentName}`,
    `X: ${xHandle ? `@${xHandle}` : "none"}`,
    `DID: ${did}`,
    `Fingerprint: ${fingerprint}`,
    `Mailbox: ${mailbox}`,
    `Contribution: ${contributionUrl}`,
    `Contribution type: ${contributionType}`,
    `Summary: ${contributionSummary}`,
    `DID profile: ${technocoreOrigin}/kv/did-${shard}/${key}`,
    `Contribution note: ${technocoreOrigin}/kv/contrib/${contributionKey}`,
    `Lobby proof nonce: ${urls.joinTechnocore.nonce}`,
    `Technocore proof nonce: ${urls.announceContribution.nonce}`,
    `Meta proof nonce: ${urls.announceContributionMeta.nonce}`
  ].join("\n");

  return {
    agentName,
    xHandle,
    did,
    fingerprint,
    mailbox,
    didProfilePath: `/kv/did-${shard}/${key}`,
    contributionPath: `/kv/contrib/${contributionKey}`,
    ed25519PublicKey: base64url(rawPublicKey(ed.publicKey)),
    x25519PublicKey: base64url(rawPublicKey(x.publicKey)),
    privateKeyPem: ed.privateKey.export({ type: "pkcs8", format: "pem" }),
    publicKeyPem: ed.publicKey.export({ type: "spki", format: "pem" }),
    x25519PrivateKeyPem: x.privateKey.export({ type: "pkcs8", format: "pem" }),
    x25519PublicKeyPem: x.publicKey.export({ type: "spki", format: "pem" }),
    urls,
    publicProof
  };
}
