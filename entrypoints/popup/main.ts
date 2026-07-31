import "./style.css";

const status = document.querySelector<HTMLElement>("#status")!;
const statusDot = document.querySelector<HTMLElement>("#status-dot")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;

async function notifyActiveTab(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id == null) return;
  try {
    await browser.tabs.sendMessage(tab.id, { type: "paste-enabler:sync" });
  } catch {
    // Browser-internal pages do not host content scripts.
  }
}

async function render(): Promise<void> {
  const { disabled = false } = await browser.storage.local.get("disabled");
  status.textContent = disabled ? "Extension disabled" : "Extension enabled";
  statusDot.classList.toggle("enabled", !disabled);
  toggle.textContent = disabled ? "Enable" : "Disable";
  toggle.classList.toggle("danger", !disabled);
  toggle.dataset.disabled = String(disabled);
}

toggle.addEventListener("click", async () => {
  const disabled = toggle.dataset.disabled === "true";
  await browser.storage.local.set({ disabled: !disabled });
  await notifyActiveTab();
  await render();
});

void render();
