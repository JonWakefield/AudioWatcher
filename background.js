chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
})


let audioTabId; // type: str (maybe int idk)
let tabsWithAudio; // type: Set 
let whiteListTabs; // type: Set

// 
chrome.storage.local.get(["audioTabId"], async function (result) {
    audioTabId = result.audioTabId;
    console.log("Current Audio Tab: ", audioTabId)
})


chrome.storage.local.get(["whiteListTabs"], async function (result) {
    whiteListTabs = new Set(result.whiteListTabs);
    console.log("WL tabs retrieved: ", whiteListTabs);
})

chrome.storage.local.get(["tabsWithAudio"], async function (result) {
    tabsWithAudio = new Set(result.tabsWithAudio);
    console.log("Current tabs with audiio: ", tabsWithAudio);
})

async function updateTab(newTabId) {
    audioTabId = newTabId;
    // update persistant storage
    chrome.storage.local.set({ audioTabId: newTabId}).then(() => {
        console.log("Updated audio tab id to ", newTabId);
    })

    // reset tabs with audio
    tabsWithAudio = new Set(); // reset audio tabs
    chrome.storage.local.set({ tabsWithAudio: Array.from(tabsWithAudio)}).then(() => {
        console.log("Tabs with audio set: ", tabsWithAudio);
    })
}

function addWLTab(tabId) {
    whiteListTabs.add(tabId);
    if (tabsWithAudio.has(tabId)) {
        checkIfEmpty(tabId);
    }
    chrome.storage.local.set({ whiteListTabs: Array.from(whiteListTabs)}).then(() => {
        console.log("white list tabs added: ", whiteListTabs)
    })
}
function removeWLTab(tabId) {
    whiteListTabs.delete(tabId);
    chrome.storage.local.set({ whiteListTabs: Array.from(whiteListTabs)}).then(() => {
        console.log("white list tabs added: ", whiteListTabs)
    })
}

function checkIfEmpty(tabId) {
    tabsWithAudio.delete(tabId);
    if (tabsWithAudio.size === 0) {
        toggleMuteState(audioTabId, false)
    }
    chrome.storage.local.set({ tabsWithAudio: Array.from(tabsWithAudio)}).then(() => {
        console.log("Tabs with audio set: ", tabsWithAudio);
    })
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


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!audioTabId) {
        return;
    }

    // console.log("Update Tab Info: ", tab);
    if (tab.audible === true && tabId != audioTabId && !whiteListTabs.has(tabId)) {
        tabsWithAudio.add(tabId);
        toggleMuteState(audioTabId, true);
        chrome.storage.local.set({tabsWithAudio: Array.from(tabsWithAudio)}).then(() => {
            console.log("tabs with audio set: ", tabsWithAudio);
        })
    }
    if (tab.audible === false && tabsWithAudio.has(tabId)) {
        checkIfEmpty(tabId)
    }
})

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    try {
        if(tabsWithAudio.has(tabId)) {
            checkIfEmpty(tabId);
        }
    } catch (err) {
        console.error("Error On tab Removal: ", err)
        tabsWithAudio = new Set();
    }
    if (whiteListTabs.has(tabId)) {
        removeWLTab(tabId);
    }
})


async function toggleMuteState(tabId, muted) {
    try {
        await chrome.tabs.update(tabId, {muted});
    } catch (err) {
        console.error("Error: ", err);
    }
}