chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
})


let audioTabId; // type: str (maybe int idk)
let tabsWithAudio; // type: Set 
let whiteListTabs; // type: Set

chrome.storage.local.get(["audioTabId"], async function (result) {
    audioTabId = result.audioTabId;
    // console.log("Current Audio Tab: ", audioTabId)
})


chrome.storage.local.get(["whiteListTabs"], async function (result) {
    whiteListTabs = new Set(result.whiteListTabs);
    // console.log("WL tabs retrieved: ", whiteListTabs);
})

chrome.storage.local.get(["tabsWithAudio"], async function (result) {
    tabsWithAudio = new Set(result.tabsWithAudio);
    // console.log("Current tabs with audiio: ", tabsWithAudio);
})

async function updateTab(newTabId) {
    audioTabId = newTabId;
    // update persistant storage
    chrome.storage.local.set({ audioTabId: newTabId})

    // unmute tab if its muted
    chrome.tabs.get(newTabId, (tab) => {tab.mutedInfo.muted = false;})

    // reset tabs with audio
    tabsWithAudio = new Set(); // reset audio tabs
    chrome.storage.local.set({ tabsWithAudio: Array.from(tabsWithAudio)})
}

function addWLTab(tabId) {
    whiteListTabs.add(tabId);
    if (tabsWithAudio.has(tabId)) {
        checkIfEmpty(tabId);
    }
    chrome.storage.local.set({ whiteListTabs: Array.from(whiteListTabs)})
}
function removeWLTab(tabId) {
    whiteListTabs.delete(tabId);
    chrome.storage.local.set({ whiteListTabs: Array.from(whiteListTabs)})
}

function checkIfEmpty(tabId) {
    tabsWithAudio.delete(tabId);
    if (tabsWithAudio.size === 0) {
        changeMuteState(audioTabId, false)
    }
    // chrome.storage.local.set({ tabsWithAudio: Array.from(tabsWithAudio)}).then(() => {
    //     console.log("Tabs with audio set: ", tabsWithAudio);
    // })
    chrome.storage.local.set({ tabsWithAudio: Array.from(tabsWithAudio)})
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let data = message.data;
    let tabId = data.tabId;
    if (message.type === "updateTab") {
        updateTab(tabId);
    } else if (message.type === "addWL") {
        addWLTab(tabId)
    } else if (message.type === "removeWL") {
        removeWLTab(tabId)
    } else if (message.type === "toggleMute") {
        let muted = toggleMuteState(audioTabId);
    }
    sendResponse({ message: "Successfully Recieved TabId"});
})



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!audioTabId) {
        return;
    }

    try { 
        if (tab.audible === true && tabId != audioTabId && !whiteListTabs.has(tabId)) {
            tabsWithAudio.add(tabId);
            changeMuteState(audioTabId, true);
            chrome.storage.local.set({tabsWithAudio: Array.from(tabsWithAudio)})
        }
        if (tab.audible === false && tabsWithAudio.has(tabId)) {
            checkIfEmpty(tabId)
        }
    } catch (err) {
        console.log(err);
    }
})

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    try {
        if(tabsWithAudio.has(tabId)) {
            checkIfEmpty(tabId);
        }
    } catch (err) {
        console.log("Error On tab Removal: ", err)
        tabsWithAudio = new Set();
    }
    try {
        if (whiteListTabs.has(tabId)) {
            removeWLTab(tabId);
        }
    } catch (err) {
        console.log("Error On tab Removal: ", err)
    }
})


async function changeMuteState(tabId, muted) {
    try {
        await chrome.tabs.update(tabId, {muted});
    } catch (err) {
        console.log(err);
    }
}

async function toggleMuteState(tabId) {
    const tab = await chrome.tabs.get(tabId)
    let muted = !tab.mutedInfo.muted
    changeMuteState(tabId, muted);
    return muted
}