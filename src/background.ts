import { run } from "./hn";
import { hasSavedArticle } from "./omnivore";

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true });
  return tabs[0].url;
}

async function getStoryId(url: string) {
  if (!url) return null;

  const regex = /https:\/\/news.ycombinator.com\/item\?id=(\d+)/;
  const match = url.match(regex);

  return match ? Number(match[1]) : null;
}

const onClick = async () => {
  const storyURL = await getCurrentTabUrl();
  if (!storyURL) {
    return;
  }

  const storyId = await getStoryId(storyURL);
  if (!storyId || !storyURL) {
    chrome.notifications.create({
      type: "basic",
      message: "You need to be on a Hacker News story to use this extension",
      title: "Not on a Hacker News story",
      iconUrl: "../icon.png",
    });
    return;
  }

  const auth = await chrome.cookies.get({
    url: "https://omnivore.app/",
    name: "auth",
  });

  if (!auth) {
    chrome.notifications.create({
      type: "basic",
      message: "You need to be logged in to Omnivore to use this extension",
      title: "Not logged in to Omnivore",
      iconUrl: "../icon.png",
    });
    const omnivoreLoginURL = "https://omnivore.app/login";
    chrome.tabs.create({ url: omnivoreLoginURL });
    return;
  }

  chrome.action.setBadgeText({
    text: "...",
  });

  try {
    await run(storyId, auth.value);

    chrome.action.setBadgeText({
      text: "✔️",
    });
  } catch (e) {
    chrome.action.setBadgeText({
      text: "❌",
    });
  }
};

chrome.action.onClicked.addListener(onClick);

async function removeStatus() {
  chrome.action.setBadgeText({
    text: "",
  });
}

chrome.tabs.onHighlighted.addListener(async (e) => {
  const tab = await chrome.tabs.get(e.tabIds[0]);
  if (tab.url) {
    showBadgeIfSaved({ url: tab.url });
  }
});

chrome.webNavigation.onCommitted.addListener(showBadgeIfSaved);

async function showBadgeIfSaved({ url }: { url: string }) {
  const storyURL = url;
  if (!storyURL) {
    removeStatus();
    return;
  }

  const storyId = await getStoryId(storyURL);
  if (!storyId) {
    removeStatus();
    return;
  }

  const auth = await chrome.cookies.get({
    url: "https://omnivore.app/",
    name: "auth",
  });

  if (!auth) {
    removeStatus();
    return;
  }

  const searched = await hasSavedArticle(storyId.toString(), auth.value);
  if (searched) {
    chrome.action.setBadgeText({
      text: "✔️",
    });
  } else {
    removeStatus();
  }
}
