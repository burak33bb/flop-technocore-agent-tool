const form = document.querySelector("#kit-form");
const result = document.querySelector("#result");
const template = document.querySelector("#result-template");

const linkLabels = [
  ["joinTechnocore", "1. Join Technocore"],
  ["publishDid", "2. Publish DID"],
  ["registerContribution", "3. Register Contribution"],
  ["announceContribution", "4. Announce Contribution"],
  ["announceContributionMeta", "4b. Announce Meta"],
  ["createMailbox", "5. Create Signed Mailbox"],
  ["readMailbox", "Mailbox Oku"]
];

let activeKit = null;

function download(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyField(field) {
  const node = result.querySelector(`[data-field="${field}"]`);
  await navigator.clipboard.writeText(node.value || node.textContent);
}

function renderKit(kit) {
  activeKit = kit;
  result.classList.remove("empty");
  result.replaceChildren(document.importNode(template.content, true));

  result.querySelector('[data-field="did"]').textContent = kit.did;
  result.querySelector('[data-field="fingerprint"]').textContent = kit.fingerprint;
  result.querySelector('[data-field="mailbox"]').textContent = kit.mailbox;
  result.querySelector('[data-field="publicProof"]').value = kit.publicProof;
  result.querySelector('[data-field="privateKeyPem"]').value = [
    kit.privateKeyPem,
    kit.publicKeyPem,
    kit.x25519PrivateKeyPem,
    kit.x25519PublicKeyPem
  ].join("\n");

  const links = result.querySelector("[data-links]");
  for (const [key, label] of linkLabels) {
    const href = kit.urls[key].url;
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = label;
    links.append(anchor);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Oluşturuluyor...";

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/create-kit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Kit oluşturulamadı.");
    renderKit(data);
  } catch (error) {
    result.classList.remove("empty");
    result.innerHTML = `<h2>Proof kit</h2><p class="error">${error.message}</p>`;
  } finally {
    button.disabled = false;
    button.textContent = "DID ve proof kit oluştur";
  }
});

result.addEventListener("click", async (event) => {
  const copy = event.target.closest("[data-copy]");
  const save = event.target.closest("[data-download]");

  if (copy) {
    await copyField(copy.dataset.copy);
    copy.textContent = "Kopyalandı";
    setTimeout(() => {
      copy.textContent = "Public proof kopyala";
    }, 1200);
  }

  if (save && activeKit) {
    download(
      `${activeKit.agentName || "technocore"}-identity.pem`,
      [activeKit.privateKeyPem, activeKit.publicKeyPem, activeKit.x25519PrivateKeyPem, activeKit.x25519PublicKeyPem].join("\n")
    );
  }
});
