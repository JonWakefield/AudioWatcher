
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
    console.log("Adding tab to whitelist", tabId)
    whiteListTabs.add(tabId);
    if (tabId in tabsWithAudio) {
        checkIfEmpty(tabId);
    }
}
function removeWLTab(tabId) {
    console.log("removing tab to whitelist ", tabId)
    whiteListTabs.delete(tabId);
}

function checkIfEmpty(tabId) {
    delete tabsWithAudio[tabId];
    if (Object.keys(tabsWithAudio).length === 0) {
        toggleMuteState(audioTabId, false)
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateAudioTab") {
        let data = message.data;
        let tabId = data.tabId;
        console.log("Received data: ", data)
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


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!audioTabId) {
        return;
    }
    // console.log(tab);
    if (tab.audible === true && tabId != audioTabId && !whiteListTabs.has(tabId)) {
        tabsWithAudio[tabId] = true;
        toggleMuteState(audioTabId, true);
        console.log("Tabs with audio: ", tabsWithAudio)
    }
    if (tab.audible === false && tabId in tabsWithAudio) {
        console.log("Audio Changed!")
        checkIfEmpty(tabId)
        console.log("Tabs with audio: ", tabsWithAudio)
    }
})

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if(tabId in tabsWithAudio) {
        delete tabsWithAudio[tabId];
        if (Object.keys(tabsWithAudio).length === 0) {
            toggleMuteState(audioTabId, false)
        }
    }
})


async function toggleMuteState(tabId, muted) {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, {muted});
    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`)
}