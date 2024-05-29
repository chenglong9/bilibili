document.addEventListener('DOMContentLoaded', () => {
  const feedDiv = document.getElementById('feed');
  const refreshButton = document.getElementById('refreshButton');

  refreshButton.addEventListener('click', () => {
    if (chrome.cookies) {
      chrome.cookies.getAll({ domain: ".bilibili.com" }, (cookies) => {
        let cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
        let csrfToken = cookies.find(cookie => cookie.name == 'bili_jct')?.value;
        fetchBilibiliFeedAndUpdateUI(cookieString, csrfToken);
      });
    } else {
      console.error("Cookies API not available");
    }
  });

  function fetchBilibiliFeedAndUpdateUI(cookieString, csrfToken) {
    fetch("https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video", {
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieString
      }
    })
      .then(response => response.json())
      .then(data => {
        chrome.storage.local.set({ bilibiliFeed: data, csrfToken: csrfToken }, () => {
          updateFeedUI(data, cookieString, csrfToken);
        });
      })
      .catch(error => console.error("Error fetching Bilibili feed:", error));
  }

  function updateFeedUI(data, cookieString, csrfToken) {
    feedDiv.innerHTML = '';  // Clear the current feed
    if (data && data.data && data.data.items) {
      data.data.items.forEach(item => {
        if (item?.modules?.module_dynamic?.major?.archive === undefined) {
          return;
        }
        const aid = item.modules.module_dynamic.major.archive.aid;
        let itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
          <b>${item.modules.module_dynamic.major.archive.title}</b>
          <p style = 'margin-bottom: 2px;font-size: 11px;'>${item.modules.module_author.name} ${item.modules.module_author.pub_time} <button class="watch-later-button" data-aid="${aid}" type="button">放入待看</button></p>
        `;
        feedDiv.appendChild(itemDiv);
      });

      document.querySelectorAll('.watch-later-button').forEach(button => {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const aid = button.getAttribute('data-aid');
          addToWatchLater(aid, cookieString, csrfToken);
        });
      });
    } else {
      feedDiv.textContent = 'No data available or failed to fetch the feed.';
    }
  }

  function addToWatchLater(aid, cookieString, csrfToken) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.bilibili.com/x/v2/history/toview/add', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          alert("成功")
        }
      }
    }

    const body = `aid=${aid}&jsonp=jsonp&csrf=${csrfToken}`;
    xhr.send(body);
  }

  // Load the feed initially
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('bilibiliFeed', (result) => {
      if (result.bilibiliFeed) {
        updateFeedUI(result.bilibiliFeed,result.csrfToken);
      } else {
        refreshButton.click();  // Fetch data if not available
      }
    });
  } else {
    console.error("Storage API not available");
  }
});
