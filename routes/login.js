const express = require("express")

const router = express.Router()

router.get("/login", function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect("/secrets");
    } else {
      res.render("login");
    }
  });

module.exports = router