import {
  fetchGoogleHTML,
  checkGoogleCaptcha,
  parseGoogleResultsUnified,
  isEnableTestShowHTML,
  validateGoogleBody,
} from "../utils/helper.js";

export const fetchGoogle = async (req, res) => {
  try {
    const errors = validateGoogleBody(req.body);
    if (errors) return res.status(400).json({ error: errors });

    const { query, start = 0, cookie } = req.body;
    const html = await fetchGoogleHTML(query, start, cookie);

    if (isEnableTestShowHTML()) {
      return res.type("html").send(html);
    }

    if (checkGoogleCaptcha(html)) {
      return res.status(429).json({
        error: "Heads up! Google on patrol. Deploy a new cookie to continue!",
      });
    }

    const results = parseGoogleResultsUnified(html);

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
