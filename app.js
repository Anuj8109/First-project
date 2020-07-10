require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://project-2:test-123@cluster0-r1wqh.mongodb.net/userDB",
  //"mongodb://localhost:27017/userDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: String,
  googleId: String,
  twitterId: String,
  provider: String,
  password: String,
});

const secretSchema = new mongoose.Schema({
  secret : String
})

const Secret = mongoose.model("Secret",secretSchema);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.CLIENT_ID_TWITTER,
      consumerSecret: process.env.CLIENT_SECRET_TWITTER,
      //callbackURL: "http://localhost:3000/auth/twitter/secrets"
      callbackURL: "https://itz-secret.herokuapp.com/auth/twitter/secrets",
    },
    function (token, tokenSecret, profile, cb) {
      //console.log(profile)
      User.findOrCreate(
        {
          twitterId: profile.id,
          provider: profile.provider,
          username: profile.screen_name,
          password: profile.id + profile.screen_name,
        },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "https://itz-secret.herokuapp.com/auth/google/secrets",
      //callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      //console.log(profile);
      User.findOrCreate(
        {
          googleId: profile.id,
          provider: profile.provider,
          username: profile.displayName,
          password: profile.id + profile.displayName,
        },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/secrets",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("login");
  }
});

app.get("/register", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("register");
  }
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    Secret.find({}, function (err, secrets) {
      if (err) {
        res.send(err);
      } else {
        res.render("secrets", { usersWithSecrets: secrets });
        // if (foundUser) {
        //   console.log(foundUser)
        //   res.render("secrets", { usersWithSecrets: secrets });
        // }
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect("/");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, active: false },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      res.send("<h1>Username or password is wrong</h1>");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  //req.user give details of user login
  let NewSecret = new Secret({
    secret : submittedSecret
  })
  NewSecret.save(function(){
    res.redirect('/secrets')
  })
  // User.findById(req.user.id, function (err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     foundUser.secret.push(submittedSecret);
  //     console.log(foundUser.secret)
  //     foundUser.save(function () {
  //       res.redirect("/secrets");
  //     });
  //     console.log(foundUser)
  //   }
  // });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
