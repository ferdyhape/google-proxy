import {
  fetchGoogleHTML,
  checkGoogleCaptcha,
  parseGoogleResults,
} from "../utils/helper.js";

export const fetchGoogle1 = async (req, res) => {
  try {
    const query = req.query.q || 'intext:"polinema"';
    const start = parseInt(req.query.start || "0", 10);

    const html = await fetchGoogleHTML(query, start);

    if (checkGoogleCaptcha(html)) {
      return res.status(429).json({
        error:
          "Whoops, Google detected something unusual. Copy the cookie again!",
      });
    }

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const fetchGoogle = async (req, res) => {
  try {
    const query = req.query.q || 'intext:"ferdy hahan pradana"';
    const start = parseInt(req.query.start || "0", 10);

    const html = await fetchGoogleHTML(query, start);

    if (checkGoogleCaptcha(html)) {
      return res.status(429).json({
        error:
          "Whoops, Google detected something unusual. Copy the cookie again!",
      });
    }

    const results = parseGoogleResults(html);

    res.json({
      query,
      start,
      results,
      count: results.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
