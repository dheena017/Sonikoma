import { Router } from "express";

const router = Router();

// Legacy backward-compatibility endpoint
router.post("/process-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res
      .status(400)
      .json({ status: "error", message: "Parameter 'url' is required." });
  }
  return res.json({
    status: "success",
    message: "Url processed successfully",
    payload: {
      url: url,
      title: "Processed Episode",
      panels_found: 5,
    },
  });
});

export default router;
