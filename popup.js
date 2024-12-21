

function sendTabId(type) {
    chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            const tabId = tabs[0].id;
            console.log("Sending Tab ID: ", tabId);
            let data = {
                tabId: tabId,
                type: type
            }
            chrome.runtime.sendMessage({type: "updateAudioTab", data: data}, (response) => {
                console.log("response: ", response.message);
            })
        }
    })
}

document.getElementById("setAudioTabButton").addEventListener("click", () => {
    sendTabId("updateTab")
})

document.getElementById("addToWhiteList").addEventListener("click", () => {
    sendTabId("addWL")
})

document.getElementById("removeFromWhiteList").addEventListener("click", () => {
    sendTabId("removeWL")
})