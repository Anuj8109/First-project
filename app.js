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
const home = require("./routes/home");
const login = require("./routes/login");
const register = require("./routes/register");
const moment = require("moment-timezone");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// var m = moment().tz('Asia/Kolkata').format('HH:mm:ss DD-MM-YYYY');
// console.log(m);
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
  name: String,
  username: String,
  googleId: String,
  twitterId: String,
  provider: String,
  password: String,
});

const secretSchema = new mongoose.Schema({
  secret: String,
  date: String,
  key_id: String,
});

const Secret = mongoose.model("Secret", secretSchema);

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
//using routing in express
//app.use(home);

// app.get("/", function (req, res) {
//   res.render("home");
// });
app.get("/", function (req, res) {
  res.redirect("/secrets");
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
app.use(login);
app.use(register);

app.get("/secrets", function (req, res) {
  //console.log(req.isAuthenticated())
    Secret.find({}, function (err, secrets) {
      if (err) {
        res.send(err);
      } else {
        res.render("secrets2", {
          usersWithSecrets: secrets,
          type: "My Secrets",
          secretLength : (secrets.length)/2,
          user : req.isAuthenticated(),
          start: secrets.length - 1,
          current : 1,
          max : 2
        });
        // if (foundUser) {
        //   console.log(foundUser)
        //   res.render("secrets", { usersWithSecrets: secrets });
        // }
      }
    });
});

app.get('/secrets/:page',function(req,res){
  var p = req.params.page
  Secret.find({},function(err,secrets){
    if(err){
      res.send("DataBase problem")
    }else{
      res.render("secretPage",{
        usersWithSecrets: secrets,
        type: "My Secrets",
        secretLength : (secrets.length)/2,
        user : req.isAuthenticated(),
        start: secrets.length - 1 - p*2,
        current : p,
        max : 2
      })
    }
  })
})

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect("/");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit2");
  } else {
    res.redirect("/login");
  }
});

app.get("/your", function (req, res) {
  if (req.isAuthenticated()) {
    Secret.find({ key_id: req.user._id }, function (err, yourSecrets) {
      if (err) {
        console.log(err);
      } else {
        console.log(yourSecrets)
        res.render("secrets2", {
          usersWithSecrets: yourSecrets,
          type: "Public Secrets",
          user : req.isAuthenticated(),
          start: yourSecrets.length - 1,
          current : 1,
          secretLength : (yourSecrets.length)/2,
          max : yourSecrets.length
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/Public", function (req, res) {
  res.redirect("/secrets");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, name: req.body.name, active: false },
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
  const dateTime = moment().tz("Asia/Kolkata").format("HH:mm:ss DD-MM-YYYY");
  // console.log(dateTime);
  // console.log(req.user)
  //req.user give details of user login
  let NewSecret = new Secret({
    secret: submittedSecret,
    date: dateTime,
    key_id: req.user._id,
  });
  NewSecret.save(function () {
    res.redirect("/secrets");
  });
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

app.get("/delete/:id", function (req, res) {
  Secret.findByIdAndRemove(req.params.id, function (err, book) {
    if (err) {
      console.log(err);
    } else {
      //console.log(book)
      res.redirect("/your");
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
