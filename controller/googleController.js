import {
  fetchGoogleHTML,
  checkGoogleCaptcha,
  parseGoogleResults,
  isEnableTestShowHTML,
  validationBodyCheck,
  parseGoogleResultsDocument,
} from "../utils/helper.js";

export const fetchGoogle = async (req, res) => {
  try {
    const errVal = validationBodyCheck(req.body);

    if (errVal) {
      return res.status(400).json({ error: errVal });
    }
    const { query, start = 0, cookie } = req.body;

    // // update to use get for quick testing
    // const { query, start = 0, cookie } = req.query;

    const html = await fetchGoogleHTML(query, start, cookie);

    if (isEnableTestShowHTML()) {
      res.set("Content-Type", "text/html");
      res.send(html);
    }

    if (checkGoogleCaptcha(html)) {
      return res.status(429).json({
        error: "Heads up! Google on patrol. Deploy a new cookie to continue!",
      });
    }

    let resultDocs = [];
    const resultsGeneral = parseGoogleResults(html);
    if (resultsGeneral.length === 0) {
      resultDocs = parseGoogleResultsDocument(html);
    }

    const mergeResult = [...resultsGeneral, ...resultDocs];
    const uniqueResults = Array.from(
      new Map(mergeResult.map((r) => [r.link, r])).values()
    );

    res.json({
      query,
      start,
      results: uniqueResults,
      count: uniqueResults.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
