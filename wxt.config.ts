import { defineConfig } from "wxt"

export default defineConfig({
  manifestVersion: 3,
  targetBrowsers: ["chrome", "edge", "firefox", "safari"],
  manifest: ({ browser }) => ({
    name: "Paste enabler",
    description:
      "Re-enable paste, copy, selection, context menus, and common input features on restrictive sites.",
    version: "1.1.0",
    homepage_url: "https://github.com/jonluca/PasteEnabler",
    permissions: ["storage"],
    action: {
      default_title: "Paste enabler",
      default_icon: {
        16: "icon16.png",
        32: "icon32.png",
        48: "icon48.png",
        128: "icon128.png"
      }
    },
    icons: {
      16: "icon16.png",
      32: "icon32.png",
      48: "icon48.png",
      128: "icon128.png"
    },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "paste-enabler@jonlu.ca",
              strict_min_version: "140.0",
              data_collection_permissions: { required: ["none"] }
            },
            gecko_android: {
              strict_min_version: "142.0"
            }
          }
        }
      : {})
  })
})
