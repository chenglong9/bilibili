chrome.runtime.onInstalled.addListener(() => {
  console.log("Bilibili Feed Viewer installed.");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("chrome.action.onClicked.addListener");
  chrome.cookies.getAll({ domain: ".bilibili.com" }, (cookies) => {
    let cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
    let csrfToken = cookies.find(cookie => cookie.name == 'bili_jct')?.value;
    fetchBilibiliFeed(cookieString, csrfToken);
  });
});

function fetchBilibiliFeed(cookieString, csrfToken) {
  fetch("https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video", {
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieString
    }
  })
    .then(response => response.json())
    .then(data => {
      chrome.storage.local.set({ bilibiliFeed: data, csrfToken: csrfToken });
    })
    .catch(error => console.error("Error fetching Bilibili feed:", error));
}
