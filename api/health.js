export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    app: "TI-LEX-AL",
    time: new Date().toISOString()
  });
}