import type { PlasmoCSConfig } from "plasmo"

import { listen } from "@plasmohq/messaging/message"
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
  private enabled = false
  private shouldEnable = false
  private cleanup: Array<() => void> = []
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
    const handler = (event: Event) => {
      event.stopPropagation()
    }
    window.addEventListener(type, handler, { capture: true })
    this.cleanup.push(() =>
      window.removeEventListener(type, handler, { capture: true })
    )
  }

  private changeAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
  ): void {
    const original = element.getAttribute(name)
    if (value === null) {
      element.removeAttribute(name)
    } else {
      element.setAttribute(name, value)
    }
    this.cleanup.push(() => {
      if (original === null) {
        element.removeAttribute(name)
      } else {
        element.setAttribute(name, original)
      }
    })
  }

  private changeStyle(
    element: HTMLElement,
    property: string,
    value: string
  ): void {
    const originalValue = element.style.getPropertyValue(property)
    const originalPriority = element.style.getPropertyPriority(property)
    const styleManager = new DOMElementStyleManager(element)
    styleManager.addStyle(property, value, { important: true })
    this.cleanup.push(() => {
      if (originalValue) {
        element.style.setProperty(property, originalValue, originalPriority)
      } else {
        element.style.removeProperty(property)
      }
    })
  }

  private enableAutocomplete(): void {
    document.querySelectorAll<HTMLElement>("[autocomplete]").forEach((elem) => {
      this.changeAttribute(elem, "autocomplete", "on")
    })
  }

  private enableDragging(): void {
    document.querySelectorAll<HTMLElement>("[draggable]").forEach((elem) => {
      this.changeAttribute(elem, "draggable", "auto")
    })
  }

  private enableTextSelection(): void {
    const elements = [
      document.body,
      ...Array.from(document.body.querySelectorAll("*"))
    ]
    elements.forEach((elem) => {
      if (!(elem instanceof HTMLElement)) return
      this.changeStyle(elem, "user-select", "text")
      this.changeStyle(elem, "-webkit-user-select", "text")
      this.changeStyle(elem, "-moz-user-select", "text")
      this.changeStyle(elem, "-ms-user-select", "text")
    })
  }

  private enableClipboardAPI(): void {
    // Enable clipboard API for modern browsers
    const handler = (e: ClipboardEvent) => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        e.clipboardData?.setData("text/plain", selection.toString())
      }
    }
    document.addEventListener("copy", handler)
    this.cleanup.push(() => document.removeEventListener("copy", handler))
  }

  private enableInputFeatures(): void {
    // Enable common input features that might be disabled
    document
      .querySelectorAll<HTMLInputElement>("input, textarea")
      .forEach((input) => {
        this.changeAttribute(input, "spellcheck", "true")
        this.changeAttribute(input, "readonly", null)
        this.changeAttribute(input, "disabled", null)
      })
  }

  async enable(): Promise<void> {
    this.shouldEnable = true
    if (!document.body) {
      await new Promise<void>((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), {
          once: true
        })
      })
    }
    if (!this.shouldEnable || this.enabled) return
    this.enabled = true

    // Enable all events
    this.eventsToEnable.forEach((eventType) => this.enableEvent(eventType))

    // Enable all features
    this.enableAutocomplete()
    this.enableDragging()
    this.enableTextSelection()
    this.enableClipboardAPI()
    this.enableInputFeatures()
  }

  disable(): void {
    this.shouldEnable = false
    if (!this.enabled) return
    this.enabled = false
    this.cleanup
      .splice(0)
      .reverse()
      .forEach((restore) => restore())
  }

  async syncFromStorage(): Promise<void> {
    const disabled = await storage.get<boolean>("disabled")
    if (disabled) {
      this.disable()
    } else {
      await this.enable()
    }
  }
}

// Usage
const enabler = new InteractionEnabler()
void enabler.syncFromStorage()

// Export for use in modules
export { InteractionEnabler }
export const config: PlasmoCSConfig = {
  run_at: "document_start"
}

listen(async () => {
  await enabler.syncFromStorage()
})
