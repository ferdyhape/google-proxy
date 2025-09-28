import fetch from "node-fetch";
import "dotenv/config";
import * as cheerio from "cheerio";

/**
 * Fetch Google HTML dengan headers tetap seperti asli
 */
export async function fetchGoogleHTML(query, start = 0, cookie) {
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,id;q=0.8",
    "cache-control": "no-cache",
    cookie: cookie,
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

  const url = `https://www.google.com/search?q=${encodeURIComponent(
    query
  )}&hl=id&start=${start}`;

  const response = await fetch(url, { headers });
  return response.text();
}

/**
 * Test mode untuk menampilkan HTML
 */
export const isEnableTestShowHTML = () => false;

/**
 * Cek apakah Google meminta captcha
 */
export const checkGoogleCaptcha = (html) => {
  if (!html) return false;
  return html.includes('<div id="recaptcha"');
};

/**
 * Validasi body request
 */
export const validateGoogleBody = ({ query, start, cookie }) => {
  const errors = [];
  if (!query) errors.push("Query is required");
  if (!cookie) errors.push("Cookie is required");
  if (start === undefined || start === null)
    errors.push("Start param is required");
  return errors.length ? errors : null;
};

/**
 * Normalisasi href Google ke link sebenarnya
 */
const normalizeHref = (href) => {
  if (!href) return null;
  href = href.trim();
  if (href.startsWith("/url?") || href.startsWith("/url?q=")) {
    try {
      const qpart = href.split("/url?")[1] || href.split("/url?q=")[1];
      const params = new URLSearchParams(qpart);
      return decodeURIComponent(params.get("q") || params.get("url"));
    } catch {
      return null;
    }
  }
  if (href.startsWith("http")) return href;
  return null;
};

/**
 * Parsing Google results (gabungan kedua fungsi sebelumnya)
 */
export const parseGoogleResultsUnified = (html) => {
  const $ = cheerio.load(html);
  const results = [];

  $("#search")
    .find("[data-rpos], a")
    .each((_, el) => {
      const block = $(el).closest("[data-rpos]") || $(el);
      let anchor = block.find("a").has("h3").first();
      if (!anchor.length) anchor = block.find("a[href]").first();
      if (!anchor.length) return;

      const link = normalizeHref(anchor.attr("href"));
      if (!link) return;

      // Filter domain Google helper
      try {
        const host = new URL(link).hostname.toLowerCase();
        if (
          host.includes("translate.google.com") ||
          host.includes("webcache.googleusercontent.com") ||
          host.includes("accounts.google.com") ||
          host.includes("policies.google.com") ||
          ((host === "www.google.com" || host === "google.com") &&
            new URL(link).pathname.startsWith("/search"))
        )
          return;
      } catch {}

      const title =
        anchor.find("h3").text().replace(/\s+/g, " ").trim() ||
        anchor.text().replace(/\s+/g, " ").trim();
      if (!title) return;

      let snippet = "";
      const candidate = block
        .find("div,span,p")
        .filter((i, node) => {
          const $node = $(node);
          if ($node.find("h3").length > 0) return false;
          if ($node.find("a").length > 0) return false;
          const t = $node.text().replace(/\s+/g, " ").trim();
          return t && t.length > 20 && t.indexOf(title) === -1;
        })
        .first();

      if (candidate && candidate.length)
        snippet = candidate.text().replace(/\s+/g, " ").trim();
      if (!snippet) {
        const blockText = block.text().replace(/\s+/g, " ").trim();
        const anchorText = anchor.text().replace(/\s+/g, " ").trim();
        snippet = blockText
          .replace(anchorText, "")
          .replace(title, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      if (snippet.length > 400) snippet = snippet.slice(0, 400).trim() + "…";

      let displayLink = "";
      const cite = block.find("cite").first();
      displayLink =
        cite && cite.length
          ? cite.text().replace(/\s+/g, " ").trim()
          : new URL(link).hostname;

      results.push({ title, link, snippet, displayLink });
    });

  // Deduplicate by link
  return Array.from(new Map(results.map((r) => [r.link, r])).values());
};
