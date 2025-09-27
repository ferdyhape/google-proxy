// server-raw.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";

const GOOGLE_COOKIE = process.env.GOOGLE_COOKIE;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/api/raw-google", async (req, res) => {
  try {
    const query = req.query.q || "polinema";
    const start = parseInt(req.query.start || "0", 10); // gunakan start resmi Google

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
      )}&hl=id&start=${start}`, // pagination pakai start
      {
        headers,
      }
    );

    const html = await response.text();

    // kembalikan mentah tanpa parsing
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Google raw proxy running at http://localhost:${PORT}`);
});
