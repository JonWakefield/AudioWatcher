let activeTabTitle = document.getElementById("currentTabtitle");
let activeTabIcon = document.getElementById("tabIcon");

let storageKeys = {
    titleKey: "activeTabTitle",
    iconKey: "activeTabIcon",
    tabId: "activeTabID",
    audioTabId: "audioTabId"
}

let msgTypes = {
    update: "updateTab",
    add: "addWL",
    remove: "removeWL",
    toggle: "toggleMute",
}

function updateTitle(title) {
    activeTabTitle.textContent = title
    localStorage.setItem(storageKeys.titleKey, title)
}

function updateIcon(iconUrl) {
    activeTabIcon.src = iconUrl;
    localStorage.setItem(storageKeys.iconKey, iconUrl)
}

function updateTabId(tabId) {
    localStorage.setItem(storageKeys.tabId, tabId)
}

function sendMsg(type) {
    chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            const activeTab = tabs[0]
            const tabId = activeTab.id;
            const title = activeTab.title;
            const iconUrl = activeTab.favIconUrl;
            let data = {
                tabId: tabId,
            }
            chrome.runtime.sendMessage({type: type, data: data}, (response) => {
                console.log("Response ", response)
            })
            if (type == msgTypes.update) {
                updateTitle(title);
                updateIcon(iconUrl);
                updateTabId(tabId);
            }
        }
    })
}

function queryAllTabs(tabId, title, icon) {
    chrome.tabs.query({}, function (tabs) {
        for(const tab of tabs) {
            if (tab.id === tabId) {
                if(title) {
                    updateTitle(title);
                }
                if (icon) {
                    updateIcon(icon);
                }
            }
        }
    })
}

function getAudioTabId(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.audioTabId);
            }
        })    
    })
}

async function getTabMuteState(tabId) {
    const tab = await chrome.tabs.get(tabId)
    let muted = tab.mutedInfo.muted
    return muted
}

function loadContent() {

    // get data from local storage if exists:
    let title = localStorage.getItem(storageKeys.titleKey);
    let icon = localStorage.getItem(storageKeys.iconKey);
    let tabId = localStorage.getItem(storageKeys.tabId);
    queryAllTabs(tabId, title, icon);

    let toggleMuteButton = document.getElementById("toggleMute")
    
    document.getElementById("setAudioTabButton").addEventListener("click", () => {
        sendMsg(msgTypes.update)
    })
    
    document.getElementById("addToWhiteList").addEventListener("click", () => {
        sendMsg(msgTypes.add)
    })
    
    document.getElementById("removeFromWhiteList").addEventListener("click", () => {
        sendMsg(msgTypes.remove)
    })  

    toggleMuteButton.addEventListener("click", async () => {
        sendMsg(msgTypes.toggle)
        try {
            let audioTabId = await getAudioTabId([storageKeys.audioTabId]);
            let muteState = await getTabMuteState(audioTabId);
            let text = muteState ? "Mute" : "Unmute";
            toggleMuteButton.textContent = text;
        } catch (err) {
            console.log("Error fetching from storage. ", err)
        }
    })

}



document.addEventListener('DOMContentLoaded', (event) => {
    loadContent();
})