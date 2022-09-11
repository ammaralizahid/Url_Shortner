const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/userModel");
const ShrinkUrl = require("./models/urlshortModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const dotenv = require("dotenv");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const app = express();

const port = process.env.PORT || 3000;
dotenv.config();
// DB Connection
mongoose.connect(process.env.MONGO_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=> {
    console.log("DB connection successful.")
}).catch((err)=> {
    console.log(err)
});

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require("express-session")({
    secret: "Its Super Secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use( (req, res, next)=> {
    res.locals.currentUser = req.user;
    next();
});

// Routes
app.get("/", (req, res)=> {
    res.render("index")
});

app.get("/shrinkUrl", isLoggedIn, async(req, res)=> {
    const shrinkUrls = await ShrinkUrl.find();
    res.render("shrinkUrl", {shrinkUrls: shrinkUrls});
});

app.post("/shrinkUrls", async(req, res)=> {
    await ShrinkUrl.create({full: req.body.fullUrl});
    res.redirect("/shrinkUrl")
});

app.get("/:shrinkUrl", async(req, res)=> {
    const shrinkUrl = await ShrinkUrl.findOne({short: req.params.shrinkUrl});
    if(shrinkUrl === null) return res.sendStatus(404);
    shrinkUrl.clicks++;
    shrinkUrl.save();

    res.redirect(shrinkUrl.full)
});

app.get("/shortIt/signup", (req, res)=> {
    res.render("signup")
});

app.post("/shortIt/signup", (req, res)=> {
    req.body.email
    req.body.username
    req.body.password
    User.register(new User({username: req.body.username, email: req.body.email}), req.body.password, (err, user)=> {
        if(err) {
            console.log(err)
            res.render("signup")
        }
        passport.authenticate("local")(req, res, ()=> {
            res.redirect("/shrinkUrl")
        })
    })
});

app.get("/shortIt/login", (req, res)=> {
    res.render("login")
});

app.post("/shortIt/login", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/shortIt/login"
    }), (req, res)=> {
});

app.get("/shortIt/logout", (req, res)=> {
    req.logout();
    res.redirect("/shortIt/login")
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } 
    res.redirect("/shortIt/signup");
}

app.listen(port, ()=> {
    console.log(`Server started on port: ${port}`)
});