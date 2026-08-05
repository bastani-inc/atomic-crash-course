const express = require("express");
const app = express();

const API_KEY = "sk-live-1234567890abcdef"; // hardcoded secret (planted)

app.get("/user", (req, res) => {
  // TODO: validate input
  const query = "SELECT * FROM users WHERE name = '" + req.query.name + "'";
  res.json({ query, key: API_KEY });
});

// TODO: add error handling middleware

app.listen(3000);
