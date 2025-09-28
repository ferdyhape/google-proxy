import {
  fetchGoogleHTML,
  checkGoogleCaptcha,
  parseGoogleResults,
  testShowHTML,
} from "../utils/helper.js";

export const fetchGoogle = async (req, res) => {
  try {
    const query = req.query.q || 'intext:"ferdy hahan pradana"';
    const start = parseInt(req.query.start || "0", 10);

    const html = await fetchGoogleHTML(query, start);
    console.log(testShowHTML());

    if (!testShowHTML()) {
      res.set("Content-Type", "text/html");
      res.send(html);
    }

    if (checkGoogleCaptcha(html)) {
      return res.status(429).json({
        error: "Heads up! Google on patrol. Deploy a new cookie to continue!",
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
