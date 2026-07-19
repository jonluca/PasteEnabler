import type { PlasmoCSConfig } from "plasmo"

import { listen } from "@plasmohq/messaging/message"
import { Storage } from "@plasmohq/storage"

type EventType = keyof WindowEventMap

const storage = new Storage()

class InteractionEnabler {
  private active = false
  private cleanupTasks: Array<() => void> = []
  private syncVersion = 0
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

  private stopEventPropagation = (event: Event) => {
    event.stopPropagation()
  }

  private enableEvent(type: EventType): void {
    window.addEventListener(type, this.stopEventPropagation, { capture: true })
    this.cleanupTasks.push(() =>
      window.removeEventListener(type, this.stopEventPropagation, {
        capture: true
      })
    )
  }

  private setAttribute(
    element: HTMLElement,
    name: string,
    value: string | null
  ): void {
    const originalValue = element.getAttribute(name)
    this.cleanupTasks.push(() => {
      if (originalValue === null) {
        element.removeAttribute(name)
      } else {
        element.setAttribute(name, originalValue)
      }
    })

    if (value === null) {
      element.removeAttribute(name)
    } else {
      element.setAttribute(name, value)
    }
  }

  private setStyle(
    element: HTMLElement,
    property: string,
    value: string
  ): void {
    const originalValue = element.style.getPropertyValue(property)
    const originalPriority = element.style.getPropertyPriority(property)
    this.cleanupTasks.push(() => {
      if (originalValue) {
        element.style.setProperty(property, originalValue, originalPriority)
      } else {
        element.style.removeProperty(property)
      }
    })
    element.style.setProperty(property, value, "important")
  }

  private enableAutocomplete(): void {
    document.querySelectorAll<HTMLElement>("[autocomplete]").forEach((elem) => {
      this.setAttribute(elem, "autocomplete", "on")
    })
  }

  private enableDragging(): void {
    document.querySelectorAll<HTMLElement>("[draggable]").forEach((elem) => {
      this.setAttribute(elem, "draggable", "auto")
    })
  }

  private enableTextSelection(): void {
    const elements = document.documentElement.getElementsByTagName("*")
    Array.from(elements).forEach((elem) => {
      if (elem instanceof HTMLElement) {
        this.setStyle(elem, "user-select", "text")
        this.setStyle(elem, "-webkit-user-select", "text")
        this.setStyle(elem, "-moz-user-select", "text")
        this.setStyle(elem, "-ms-user-select", "text")
      }
    })
  }

  private handleCopy = (event: ClipboardEvent) => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      event.clipboardData?.setData("text/plain", selection.toString())
    }
  }

  private enableClipboardAPI(): void {
    document.addEventListener("copy", this.handleCopy)
    this.cleanupTasks.push(() =>
      document.removeEventListener("copy", this.handleCopy)
    )
  }

  private enableInputFeatures(): void {
    // Enable common input features that might be disabled
    document
      .querySelectorAll<HTMLInputElement>("input, textarea")
      .forEach((input) => {
        this.setAttribute(input, "spellcheck", "true")
        this.setAttribute(input, "readonly", null)
        this.setAttribute(input, "disabled", null)
      })
  }

  async enable(): Promise<void> {
    const version = ++this.syncVersion
    const disabled = await storage.get<boolean>("disabled")
    if (version !== this.syncVersion) {
      return
    }
    if (disabled) {
      this.disable()
      return
    }

    if (this.active) {
      return
    }

    this.active = true

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
    if (!this.active) {
      return
    }

    for (const cleanup of this.cleanupTasks.reverse()) {
      cleanup()
    }
    this.cleanupTasks = []
    this.active = false
  }
}

// Usage
const enabler = new InteractionEnabler()
void enabler.enable()

// Export for use in modules
export { InteractionEnabler }
export const config: PlasmoCSConfig = {
  run_at: "document_start"
}

listen(async () => {
  console.log("Running enabler")
  await enabler.enable()
})
