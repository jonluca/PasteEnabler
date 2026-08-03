const STYLE_ID = "paste-enabler-styles"
const EVENTS_TO_ENABLE = [
  "paste",
  "copy",
  "cut",
  "drop",
  "wheel",
  "mousewheel",
  "selectstart",
  "touchstart",
  "touchend",
  "dragstart",
  "dragend",
  "mousedown",
  "contextmenu"
] as const
const INLINE_BLOCKERS = [
  "onpaste",
  "oncopy",
  "oncut",
  "ondrop",
  "oncontextmenu",
  "onselectstart"
] as const

class InteractionEnabler {
  private controller?: AbortController
  private observer?: MutationObserver

  enable(): void {
    if (this.controller) return
    this.controller = new AbortController()

    for (const eventName of EVENTS_TO_ENABLE) {
      window.addEventListener(eventName, (event) => event.stopPropagation(), {
        capture: true,
        signal: this.controller.signal
      })
    }

    this.ensureSelectionStyle()
    this.applyFeatures(document)
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.target instanceof Element)
          this.applyElementFeatures(mutation.target)
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) this.applyFeatures(node)
        }
      }
    })
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "autocomplete",
        "disabled",
        "draggable",
        "readonly",
        ...INLINE_BLOCKERS
      ],
      childList: true,
      subtree: true
    })
  }

  disable(): void {
    this.controller?.abort()
    this.controller = undefined
    this.observer?.disconnect()
    this.observer = undefined
    document.getElementById(STYLE_ID)?.remove()
  }

  private ensureSelectionStyle(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent =
      "* { user-select: text !important; -webkit-user-select: text !important; }"
    ;(document.head ?? document.documentElement).append(style)
  }

  private applyFeatures(root: ParentNode): void {
    if (root instanceof Element) this.applyElementFeatures(root)
    for (const element of root.querySelectorAll<HTMLElement>("*"))
      this.applyElementFeatures(element)
  }

  private applyElementFeatures(element: Element): void {
    if (element.hasAttribute("autocomplete"))
      element.setAttribute("autocomplete", "on")
    if (element.hasAttribute("draggable"))
      element.setAttribute("draggable", "auto")
    for (const blocker of INLINE_BLOCKERS) element.removeAttribute(blocker)

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.spellcheck = true
      element.readOnly = false
      element.disabled = false
    }
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  main() {
    const enabler = new InteractionEnabler()

    const sync = async () => {
      const { disabled = false } = await browser.storage.local.get("disabled")
      if (disabled) enabler.disable()
      else enabler.enable()
    }

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.disabled) void sync()
    })
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "paste-enabler:sync") void sync()
    })
    void sync()
  }
})
