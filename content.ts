import { Storage } from "@plasmohq/storage"

type CSSPropertyValue = string | null
type EventType = keyof WindowEventMap
type StylePropertyOptions = {
  important?: boolean
  override?: boolean
}

const storage = new Storage()
interface ElementStyleManager {
  addStyle(
    property: string,
    value: CSSPropertyValue,
    options?: StylePropertyOptions
  ): void
  removeStyle(property: string): void
}

class DOMElementStyleManager implements ElementStyleManager {
  constructor(private element: HTMLElement) {}

  addStyle(
    property: string,
    value: CSSPropertyValue,
    options: StylePropertyOptions = {}
  ): void {
    const { important = false, override = true } = options

    if (override) {
      this.removeStyle(property)
    }

    if (this.element.style.setProperty) {
      this.element.style.setProperty(
        property,
        value ?? "",
        important ? "important" : ""
      )
    } else {
      // Fallback for older browsers
      this.element.setAttribute(
        "style",
        `${this.element.style.cssText}${property}:${value}${important ? " !important" : ""};`
      )
    }
  }

  removeStyle(property: string): void {
    if (this.element.style.setProperty) {
      this.element.style.removeProperty(property)
    } else {
      // @ts-ignore
      this.element.style.removeAttribute(property)
    }
  }
}

class InteractionEnabler {
  private eventsToEnable: EventType[] = [
    "paste",
    "copy",
    "cut",
    "drop",
    "scroll",
    "wheel",
    // @ts-ignore
    "mousewheel",
    "selectstart",
    "touchstart",
    "touchend",
    "dragstart",
    "dragend",
    "mousedown",
    "contextmenu"
  ]

  private enableEvent(type: EventType): void {
    window.addEventListener(
      type,
      (event: Event) => {
        event.stopPropagation()
      },
      { capture: true }
    )
  }

  private enableAutocomplete(): void {
    document.querySelectorAll<HTMLElement>("[autocomplete]").forEach((elem) => {
      elem.setAttribute("autocomplete", "on")
    })
  }

  private enableDragging(): void {
    document.querySelectorAll<HTMLElement>("[draggable]").forEach((elem) => {
      elem.setAttribute("draggable", "auto")
    })
  }

  private enableTextSelection(): void {
    const elements = document.body.getElementsByTagName("*")
    Array.from(elements).forEach((elem) => {
      if (elem instanceof HTMLElement) {
        const styleManager = new DOMElementStyleManager(elem)
        styleManager.addStyle("user-select", "text", { important: true })

        // Also enable text selection for modern browsers
        styleManager.addStyle("-webkit-user-select", "text", {
          important: true
        })
        styleManager.addStyle("-moz-user-select", "text", { important: true })
        styleManager.addStyle("-ms-user-select", "text", { important: true })
      }
    })
  }

  private enableClipboardAPI(): void {
    // Enable clipboard API for modern browsers
    document.addEventListener("copy", (e: ClipboardEvent) => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        e.clipboardData?.setData("text/plain", selection.toString())
      }
    })
  }

  private enableInputFeatures(): void {
    // Enable common input features that might be disabled
    document
      .querySelectorAll<HTMLInputElement>("input, textarea")
      .forEach((input) => {
        input.setAttribute("spellcheck", "true")
        input.removeAttribute("readonly")
        input.removeAttribute("disabled")
      })
  }

  async enable(): Promise<void> {
    const disabled = await storage.get<boolean>("disabled")
    if (disabled) {
      return
    }

    // Enable all events
    this.eventsToEnable.forEach((eventType) => this.enableEvent(eventType))

    // Enable all features
    this.enableAutocomplete()
    this.enableDragging()
    this.enableTextSelection()
    this.enableClipboardAPI()
    this.enableInputFeatures()

    // Add mutation observer to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const styleManager = new DOMElementStyleManager(node)
            styleManager.addStyle("user-select", "text", { important: true })
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

// Usage
const enabler = new InteractionEnabler()
enabler.enable()

// Export for use in modules
export { InteractionEnabler }
