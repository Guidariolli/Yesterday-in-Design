const RSS_SOURCES = [
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
  },
  {
    name: "Nielsen Norman Group",
    url: "https://www.nngroup.com/feed/rss/",
  },
  {
    name: "A List Apart",
    url: "https://alistapart.com/main/feed/",
  },
  {
    name: "UX Collective",
    url: "https://uxdesign.cc/feed",
  },
  {
    name: "Webdesigner Depot",
    url: "https://www.webdesignerdepot.com/feed/",
  },
];

const PROXY_URL = "https://api.allorigins.win/raw?url=";
const CACHE_KEY = "design-news-rss-cache";
const CACHE_TTL_MS = 30 * 60 * 1000;

const featuredTitle = document.getElementById("featured-title");
const featuredSource = document.getElementById("featured-source");
const featuredMeta = document.getElementById("featured-meta");
const featuredLink = document.getElementById("featured-link");
const loadingText = document.getElementById("loading-text");
const newsList = document.getElementById("news-list");

const MAX_ITEMS = 20;
const MAX_ITEMS_PER_FEED = 10;

const getYesterdayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const isYesterday = (date) => {
  if (!date) return false;
  const { start, end } = getYesterdayRange();
  return date >= start && date <= end;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const normalizeItem = (item, sourceName) => {
  const title = item.querySelector("title")?.textContent?.trim();
  const link = item.querySelector("link")?.textContent?.trim();
  const pubDate =
    item.querySelector("pubDate")?.textContent ||
    item.querySelector("updated")?.textContent;
  const date = parseDate(pubDate);

  if (!title || !link) return null;

  return {
    title,
    link,
    source: sourceName,
    date,
  };
};

const renderFeatured = (item) => {
  featuredTitle.textContent = item.title;
  featuredSource.textContent = item.date
    ? `${item.source} · ${formatDate(item.date)}`
    : item.source;
  featuredMeta.textContent = "Destaque";
  featuredLink.href = item.link;
  if (loadingText) loadingText.textContent = "";
};

const createNewsCard = (item) => {
  const article = document.createElement("article");
  article.className = "card";
  article.style.display = "grid";
  article.style.gap = "var(--space-4)";

  const meta = document.createElement("span");
  meta.className = "text text-sm";
  meta.textContent = item.date
    ? `${item.source} · ${formatDate(item.date)}`
    : item.source;

  const title = document.createElement("h3");
  title.className = "heading-4";
  title.textContent = item.title;

  const link = document.createElement("a");
  link.className = "link";
  link.href = item.link;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Continuar lendo";

  article.append(meta, title, link);
  return article;
};

const renderNews = (items) => {
  newsList.innerHTML = "";
  items.forEach((item) => {
    newsList.appendChild(createNewsCard(item));
  });
};

const saveCache = (items) => {
  const payload = {
    savedAt: Date.now(),
    items,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

const loadCache = () => {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed?.items)) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.items
      .map((item) => ({
        ...item,
        date: item.date ? new Date(item.date) : null,
      }))
      .filter((item) => isYesterday(item.date));
  } catch (error) {
    return null;
  }
};

const fetchFeed = async ({ name, url }) => {
  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
    if (!response.ok) return [];
    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    const items = Array.from(xml.querySelectorAll("item"))
      .map((item) => normalizeItem(item, name))
      .filter(Boolean)
      .slice(0, MAX_ITEMS_PER_FEED);
    return items;
  } catch (error) {
    return [];
  }
};

const loadFeeds = async () => {
  const cachedItems = loadCache();
  if (cachedItems?.length) {
    renderFeatured(cachedItems[0]);
    renderNews(cachedItems.slice(1, MAX_ITEMS));
  }

  featuredMeta.textContent = "Atualizando...";
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed));
  const items = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => isYesterday(item.date));

  items.sort((a, b) => {
    const dateA = a.date ? a.date.getTime() : 0;
    const dateB = b.date ? b.date.getTime() : 0;
    return dateB - dateA;
  });

  const topItems = items.slice(0, MAX_ITEMS);

  if (topItems.length === 0) {
    featuredTitle.textContent =
      "Sem noticias agora. Tente novamente mais tarde.";
    featuredSource.textContent = "";
    featuredMeta.textContent = "Destaque";
    featuredLink.href = "#";
    if (loadingText) loadingText.textContent = "";
    renderNews([]);
    return;
  }

  renderFeatured(topItems[0]);
  renderNews(topItems.slice(1));
  saveCache(topItems);
};

loadFeeds();
