const express = require("express")

const router = express.Router()

router.get("/login", function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect("/secrets");
    } else {
      res.render("login2");
    }
  });

module.exports = router