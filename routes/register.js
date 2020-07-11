const express = require("express");

const router = express.Router();

router.get("/register", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("register");
  }
});

module.exports = router;
