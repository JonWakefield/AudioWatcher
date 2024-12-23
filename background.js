let audioTabId = false;
let tabsWithAudio = {}

let whiteListTabs = new Set();

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
})

function updateTab(newTabId) {
    audioTabId = newTabId;
    tabsWithAudio = {}; // reset audio tabs
}

function addWLTab(tabId) {
    // console.log("Adding tab to whitelist", tabId)
    whiteListTabs.add(tabId);
    if (tabId in tabsWithAudio) {
        checkIfEmpty(tabId);
    }
}
function removeWLTab(tabId) {
    // console.log("removing tab to whitelist ", tabId)
    whiteListTabs.delete(tabId);
}

function checkIfEmpty(tabId) {
    delete tabsWithAudio[tabId];
    if (Object.keys(tabsWithAudio).length === 0) {
        toggleMuteState(audioTabId, false)
    }
    logNewStorage();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateAudioTab") {
        let data = message.data;
        let tabId = data.tabId;
        if (data.type === "updateTab") {
            updateTab(tabId);
        } else if (data.type === "addWL") {
            addWLTab(tabId)
        } else if (data.type === "removeWL") {
            removeWLTab(tabId)
        }
        sendResponse({ message: "Successfully Recieved TabId"});
    }
})

function logNewStorage() {
    // FUNCTION USED FOR DEBUGGING
    // console.log(`The current tabs with audio are ${Object.entries(tabsWithAudio)}`)
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!audioTabId) {
        return;
    }
    // console.log("Update Tab Info: ", tab);
    if (tab.audible === true && tabId != audioTabId && !whiteListTabs.has(tabId)) {
        tabsWithAudio[tabId] = true;
        logNewStorage();
        toggleMuteState(audioTabId, true);
    }
    if (tab.audible === false && tabId in tabsWithAudio) {
        checkIfEmpty(tabId)
    }
})

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if(tabId in tabsWithAudio) {
        checkIfEmpty(tabId);
    }
})


async function toggleMuteState(tabId, muted) {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, {muted});
    // console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`)
}