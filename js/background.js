/**
 * Registers the onclick handler for the Chrome Extension icon, injects the content script into a sandboxed chrome extension environment
 */
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(null, {
    file: "js/content_script.js"
  });
});
