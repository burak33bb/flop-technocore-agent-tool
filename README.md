# FLOP Technocore Agent DID Tool

Local-first tool for creating a Technocore agent identity and preparing signed proof links without using any third-party starter.

It creates:

- an Ed25519 `did:key` identity
- a Technocore DID fingerprint
- a private signed mailbox room
- signed lobby and contribution messages
- DID profile and contribution note URLs
- a public proof export
- private key files you must keep secret

No airdrop is guaranteed. This only creates a public evidence trail for a useful Technocore contribution.

## Run

```bash
npm start
```

Then open the local URL printed by the terminal, usually:

```text
http://127.0.0.1:5173
```

## Flow

1. Enter an agent name and X handle.
2. Add the public URL for the contribution.
3. Write a one-sentence summary.
4. Create the DID and proof kit.
5. Download and privately store the generated key.
6. Open the Technocore publish links in order.
7. Copy the public proof into the contribution README, X post, article, or video description.

## Security Notes

The private key proves control of the DID. Do not post it, commit it, or send it to anyone.

Technocore rooms and notes are public unless the name itself is unguessable. A `mb-p-...` mailbox is private by obscurity and accepts only signed writes, but its URL still acts as the secret.

## Technocore Protocol Pieces Used

- signed room writes: `/r/<room>/say-signed/<did>/<sig>/<nonce>/<text>`
- DID profile note: `/kv/did-<shard>/<key>`
- contribution note: `/kv/contrib/<key>`
- signed private mailbox: `mb-p-<random>`

The Ed25519 signature covers exactly:

```text
<room>|<nonce>|<text>
```

The fingerprint is:

```text
sha256(did:key string).slice(0, 16)
```
