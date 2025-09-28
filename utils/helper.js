import fetch from "node-fetch";
import "dotenv/config";
import * as cheerio from "cheerio";

const GOOGLE_COOKIE = process.env.GOOGLE_COOKIE;

export async function fetchGoogleHTML(query, start = 0) {
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,id;q=0.8",
    "cache-control": "no-cache",
    cookie: GOOGLE_COOKIE,
    pragma: "no-cache",
    priority: "u=0, i",
    "sec-ch-ua": '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    "sec-ch-ua-arch": "x86",
    "sec-ch-ua-bitness": "64",
    "sec-ch-ua-full-version-list":
      '"Brave";v="135.0.0.0", "Not-A.Brand";v="8.0.0.0", "Chromium";v="135.0.0.0"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": "Linux",
    "sec-ch-ua-platform-version": "6.8.0",
    "sec-ch-ua-wow64": "?0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  };

  const response = await fetch(
    `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&hl=id&start=${start}`,
    { headers }
  );

  const html = await response.text();
  return html;
}

export const testShowHTML = () => {
  return process.env.TEST_SHOW_HTML;
};

export const checkGoogleCaptcha = (html) => {
  if (!html) return false;
  return html.includes('<div id="recaptcha"');
};

export const parseGoogleResults = (html) => {
  const $ = cheerio.load(html);
  const results = [];

  $("#search a").each((i, el) => {
    const link = $(el).attr("href");
    const title = $(el).text().trim();

    const snippet = $(el).closest("div").text().replace(/\s+/g, " ").trim();

    if (
      link &&
      link.startsWith("http") &&
      title &&
      !link.includes("translate.google.com") &&
      !link.includes("google.com")
    ) {
      results.push({ title, link, snippet });
    }
  });

  const uniqueResults = Array.from(
    new Map(results.map((r) => [r.link, r])).values()
  );

  return uniqueResults;
};
