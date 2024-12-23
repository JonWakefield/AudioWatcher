
let activeTabTitle = document.getElementById("currentTabtitle");
let activeTabIcon = document.getElementById("tabIcon");

let storageKeys = {
    titleKey: "activeTabTitle",
    iconKey: "activeTabIcon",
    tabId: "activeTabID",
}

let msgTypes = {
    update: "updateTab",
    add: "addWL",
    remove: "removeWL",
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

function sendTabId(type) {
    chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            const activeTab = tabs[0]
            const tabId = activeTab.id;
            const title = activeTab.title;
            const iconUrl = activeTab.favIconUrl;
            console.log("tab: ", tabs[0]);
            console.log("Sending Tab ID: ", tabId);
            let data = {
                tabId: tabId,
                type: type
            }
            chrome.runtime.sendMessage({type: "updateAudioTab", data: data}, (response) => {
                console.log("response: ", response.message);
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
            if (tab.id == tabId) {
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


function loadContent() {

    // get data from local storage if exists:
    let title = localStorage.getItem(storageKeys.titleKey);
    let icon = localStorage.getItem(storageKeys.iconKey);
    let tabId = localStorage.getItem(storageKeys.tabId);
    queryAllTabs(tabId, title, icon);
    

    document.getElementById("setAudioTabButton").addEventListener("click", () => {
        sendTabId(msgTypes.update)
    })
    
    document.getElementById("addToWhiteList").addEventListener("click", () => {
        sendTabId(msgTypes.add)
    })
    
    document.getElementById("removeFromWhiteList").addEventListener("click", () => {
        sendTabId(msgTypes.remove)
    })  

}



document.addEventListener('DOMContentLoaded', (event) => {
    loadContent();
})