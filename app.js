//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const _ = require('lodash');
const { render } = require('ejs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);
const crypto = require('crypto');
const moment = require('moment');
const path = require('path');
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const mongoURI =
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/session';

const app = express();

app.use(fileUpload());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// mongoose session option
const store = new MongoDBSession({
    uri: mongoURI,
    collections: 'mySessions',
    stringify: false,
    autoRemove: 'interval',
    autoRemoveInterval: 1
});

//init session
app.use(
    session({
        secret: 'Our little secrets',
        resave: true,
        saveUninitialized: false,
        store: store
    })
);

//init passport
app.use(passport.initialize());
app.use(passport.session());

// DATABASE INITIALIZATION

// Users Database
const userDatabase = mongoose.createConnection('mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/user');

// SCHEMA INITIALIZATION

// FOR USER DATABASE

// USER
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    nric: { type: String, required: true, unique: true },
    phone: String,
    profile: String,
    age: { type: Number, min: 0 },
    address: String,
    gender: String,
    education: String,
    department: String,
    section: String,
    position: String,
    grade: String,
    role: String,
    status: String,
    dateEmployed: { type: Date, default: Date.now },
    birthdate: { type: Date }
});

// ACTIVITY
const activitySchema = new mongoose.Schema({
    date: String,
    items: []
});

// USER'S INFORMATION
const infoSchema = new mongoose.Schema({
    username: String,
    status: String,
});

//mongoose passport-local
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = userDatabase.model('User', userSchema);
const Activity = userDatabase.model('Activity', activitySchema);
const Info = userDatabase.model('Info', infoSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);

        if (!user) {
            done(null, false);
        } else {
            done(null, user);
        }
    } catch (err) {
        done(err, false);
    }
});

// CHECK AUTH USER
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/landing'); // Redirect to the login page if not authenticated
};

// BASIC USER PART

// HOME
app.get('/', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        res.render('home', {
            user: user
        });
    }
});

// LANDINGPAGE
app.get('/landing', async function (req, res) {
    const numCircles = 4;
    const circles = Array.from({ length: numCircles }, () => ({
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 60) + 20,
        size: Math.floor(Math.random() * 100) + 50, // Random size between 50 and 150 pixels
    }));

    res.render('landing-page', { circles });
});

// AUTH

//SIGNUP
app
    .get('/sign-up', function (req, res) {
        res.render('sign-up');
    })
    .post('/sign-up', function (req, res) {
        // Check if the required fields are present in the request body
        if (!req.body.fullname || !req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const newUser = new User({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            nric: req.body.nric,
            phone: req.body.phone,
            profile: ''
        });

        User.register(
            newUser, req.body.password,
            function (err, user) {
                if (err) {
                    console.log(err);
                    res.redirect('/sign-up');
                } else {
                    passport.authenticate('local')(req, res, function () {
                        res.redirect('/landing');
                    });
                }
            }
        );
    });

// SIGNIN
app
    .get('/sign-in', async function (req, res) {
        res.render('sign-in', {
            // validation
            validationUsername: '',
            validationPassword: '',
            // input value
            username: '',
            password: '',
            // toast
            toastShow: '',
            toastMsg: ''
        });
    })
    .post('/sign-in', async function (req, res) {
        const username = req.body.username;
        const password = req.body.password;
        const rememberMe = req.body.rememberMe;

        // Set the session duration based on the 'rememberMe' checkbox
        const sessionDuration = rememberMe
            ? 7 * 24 * 60 * 60 * 1000
            : 1 * 60 * 60 * 1000;

        req.session.cookie.maxAge = sessionDuration;

        var validationUsername = '';
        var validationPassword = '';

        const passwordRegex = /^(?:\d+|[a-zA-Z0-9]{4,})/;

        const user = await User.findByUsername(username);
        var checkUser = '';

        if (!user) {
            checkUser = 'Not found';
        } else {
            checkUser = 'Found';
        }

        // validation username
        if (username === '' || checkUser === 'Not found') {
            validationUsername = 'is-invalid';
        } else {
            validationUsername = 'is-valid';
        }

        // validation username
        if (password === '' || passwordRegex.test(password) === 'false') {
            validationPassword = 'is-invalid';
        } else {
            validationPassword = 'is-valid';
        }

        if (
            validationUsername === 'is-valid' &&
            validationPassword === 'is-valid'
        ) {

            try {
                const user = await User.findOne({ username: username });

                if (!user) {

                    validationUsername = "is-valid";

                    return res.render('sign-in', {
                        // validation
                        validationUsername: validationUsername,
                        validationPassword: validationPassword,
                        // input value
                        username: username,
                        password: password,
                        toastShow: 'show',
                        toastMsg: 'Username not found'
                    });
                }

                // Use the authenticate method from passport-local-mongoose
                user.authenticate(password, (err, authenticatedUser) => {
                    if (err || !authenticatedUser) {

                        validationPassword = "is-invalid";

                        return res.render('sign-in', {
                            // validation
                            validationUsername: validationUsername,
                            validationPassword: validationPassword,
                            // input value
                            username: username,
                            password: password,
                            toastShow: 'show',
                            toastMsg: 'Incorrect password'
                        });
                    }

                    // Password is correct, log in the user
                    req.logIn(authenticatedUser, (err) => {
                        if (err) { return next(err); }
                        return res.redirect('/');
                    });
                });
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }

        } else {
            res.render('sign-in', {
                // validation
                validationUsername: validationUsername,
                validationPassword: validationPassword,
                // input value
                username: username,
                password: password,
                toastShow: 'show',
                toastMsg: 'There is an error, please do check your input'
            });
        }
    });

// SIGNOUT
app.get('/sign-out', async function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

// PROFILE
app.get('/profile', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    const date = getDateFormat2();

    // calculate user's age
    const age = calculateAge(user.birthdate);

    const newData = {
        age: age
    }

    // update age
    const update = await User.updateOne({ username: username }, { $set: newData });

    // check find user successful or not
    if (user && update) {
        // find activity
        const activity = await Activity.find({
            'items.username': user.username
        })
            .limit(7)
            .sort({ date: -1 });

        // find info
        const info = await Info.findOne({ username: user.username });

        res.render('profile', {
            user: user,
            activity: activity,
            info: info,
            today: date
        });
    } else {
        res.render('profile', {
            user: '',
            activity: '',
            info: '',
            today: date
        });
    }
});

// LEAVE

// CALENDAR
app.get('/leave/calendar', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        res.render('leave-calendar', {
            user: user
        });
    }
});

// REQUEST
app.get('/leave/request', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        res.render('leave-request', {
            user: user
        });
    }
});

// HISTORY
app.get('/leave/history', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        res.render('leave-history', {
            user: user
        });
    }
});

// FECTH API    

app.post('/status-update', isAuthenticated, async (req, res) => {
    const user = req.user.username;
    const status = req.body.status;

    const update = await Info.findOneAndUpdate(
        { username: user },
        { $set: { status: status } },
        { upsert: true, new: true, useFindAndModify: false });

    if (update) {
        console.log("Status update accomplished! ");
        res.redirect('/');
    } else {
        console.log("Status update failed!");
        res.redirect('/');
    }
});

// FUNCTIONS

// GET DATE TODAY IN STRING
getDateFormat2 = function () {
    const today = moment().utcOffset('+08:00');
    const formattedDate = today.format('D MMMM YYYY');

    return formattedDate;
};

getDateFormat1 = function () {
    const today = moment().utcOffset('+08:00');
    const formattedDate = today.format('DD/MM/YYYY');

    return formattedDate;
}

// GET CURRENT TIME IN STRING
getCurrentTime = function () {
    const currentTimeInUTC8 = moment().utcOffset('+08:00');
    const formattedTime = currentTimeInUTC8.format('HH:mm A');

    return formattedTime;
};

calculateAge = function (birthdate) {
    const today = moment().utcOffset('+08:00');
    const birthdateObj = moment(birthdate);

    let age = today.diff(birthdateObj, 'years');

    return age;
}


// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
