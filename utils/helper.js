import fetch from "node-fetch";
import "dotenv/config";
import * as cheerio from "cheerio";

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

  const response = await fetch(
    `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&hl=id&start=${start}`,
    { headers }
  );

  const html = await response.text();
  return html;
}

export const isEnableTestShowHTML = () => {
  // return true // for testing
  // return true;
  return false;
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

export const parseGoogleResultsDocument = (html) => {
  const $ = cheerio.load(html);
  const results = [];

  const normalizeHref = (href) => {
    if (!href) return null;
    href = href.trim();

    // Google's redirect pattern: /url?q=<real>&...
    if (href.startsWith("/url?") || href.startsWith("/url?q=")) {
      try {
        const qpart = href.split("/url?")[1] || href.split("/url?q=")[1];
        const params = new URLSearchParams(qpart);
        const q = params.get("q") || params.get("url");
        if (q) return decodeURIComponent(q);
      } catch (e) {
        return null;
      }
    }

    // absolute http(s)
    if (href.startsWith("http://") || href.startsWith("https://")) return href;

    return null;
  };

  // Iterate over structural result containers (data-rpos is present in sample HTML)
  $("#search")
    .find("[data-rpos]")
    .each((_, el) => {
      const block = $(el);

      // Prefer anchor that contains an <h3> (typical result link/title)
      let anchor = block
        .find("a")
        .filter((i, a) => $(a).find("h3").length > 0)
        .first();

      // fallback: first anchor with href
      if (!anchor || !anchor.length) {
        anchor = block.find("a[href]").first();
      }
      if (!anchor || !anchor.length) return;

      const rawHref = anchor.attr("href");
      const link = normalizeHref(rawHref);
      if (!link) return;

      // filter out obvious google helper hosts
      try {
        const u = new URL(link);
        const host = u.hostname.toLowerCase();
        if (
          host.includes("translate.google.com") ||
          host.includes("webcache.googleusercontent.com") ||
          host.includes("accounts.google.com") ||
          host.includes("policies.google.com")
        ) {
          return;
        }
        // avoid google search landing links
        if (
          (host === "www.google.com" || host === "google.com") &&
          u.pathname.startsWith("/search")
        ) {
          return;
        }
      } catch (e) {
        // ignore parse errors and continue
      }

      // Title: h3 text under the chosen anchor if present, else anchor text trimmed
      const title =
        anchor.find("h3").first().text().replace(/\s+/g, " ").trim() ||
        anchor.text().replace(/\s+/g, " ").trim();
      if (!title) return;

      // displayLink: try <cite> within block, else hostname
      let displayLink = "";
      const cite = block.find("cite").first();
      if (cite && cite.length) {
        displayLink = cite.text().replace(/\s+/g, " ").trim();
      } else {
        try {
          displayLink = new URL(link).hostname;
        } catch (e) {
          displayLink = link;
        }
      }

      // Snippet heuristics:
      // 1) Prefer descendant div/span/p blocks that look like descriptive snippets (length > 20),
      //    and which do NOT contain anchors (to avoid duplicating title/link UI).
      // 2) Fallback: container text minus the anchor visible text and title.
      // 3) Trim and limit length.
      let snippet = "";

      const candidate = block
        .find("div,span,p")
        .filter((i, node) => {
          const $node = $(node);
          // ignore nodes that contain the title or an anchor (these are usually UI or link wrappers)
          if ($node.find("h3").length > 0) return false;
          if ($node.find("a").length > 0) return false;
          const t = $node.text().replace(/\s+/g, " ").trim();
          return t && t.length > 20 && t.indexOf(title) === -1;
        })
        .first();

      if (candidate && candidate.length) {
        snippet = candidate.text().replace(/\s+/g, " ").trim();
      }

      if (!snippet) {
        // fallback: whole block text minus anchor text and title
        const blockText = block.text().replace(/\s+/g, " ").trim();
        const anchorText = anchor.text().replace(/\s+/g, " ").trim();
        snippet = blockText
          .replace(anchorText, "")
          .replace(title, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      // final safety: cut overly long snippets
      if (snippet && snippet.length > 400) {
        snippet = snippet.slice(0, 400).trim() + "…";
      }

      results.push({
        title,
        link,
        snippet,
        displayLink,
      });
    });

  // Deduplicate by link (keep first seen)
  const unique = Array.from(new Map(results.map((r) => [r.link, r])).values());
  return unique;
};

export const validationBodyCheck = (body) => {
  const { query, start = 0, cookie } = body;
  if (!query) {
    return "Query is required";
  }

  if (!cookie) {
    return "Cookie is required";
  }

  if (start === undefined || start === null) {
    return "Start param is required";
  }
};
