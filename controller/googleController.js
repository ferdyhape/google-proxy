import {
  fetchGoogleHTML,
  checkGoogleCaptcha,
  parseGoogleResults,
  isEnableTestShowHTML,
} from "../utils/helper.js";

export const fetchGoogle = async (req, res) => {
  try {
    const { query = 'intext:"polinema"', start = 0, cookie } = req.body;

    const html = await fetchGoogleHTML(query, start, cookie);
    console.log(isEnableTestShowHTML());

    if (!isEnableTestShowHTML()) {
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
