/* global chrome */
import { detectPlatform, detectSite } from './core.js'

Promise.resolve().then(async () => {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id || detectSite(tab.url)?.floatingEntry)
      continue
    if (!detectPlatform(tab.url) && !detectSite(tab.url) && !/^https?:\/\/(?:syncblog\.cn|localhost|127\.0\.0\.1)(?:[:/]|$)/.test(tab.url || ''))
      continue
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
        document.querySelectorAll('ai-distribution-master').forEach(element => element.remove())
      } })
    }
    catch { /* Closed tabs or revoked site access do not block extension startup. */ }
  }
}).catch(console.error)
