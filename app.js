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
    'mongodb+srv://shrrshazni:protechlakmns123@cluster0.rembern.mongodb.net/sessions';

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
        secret: 'He who remains.',
        resave: true,
        saveUninitialized: false,
        store: store
    })
);

//init passport
app.use(passport.initialize());
app.use(passport.session());

//init mongoose
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(
        'mongodb+srv://shrrshazni:protechlakmns123@cluster0.rembern.mongodb.net/portal'
    );
}

// SCHEMA INITIALIZATION

//USER
const userSchema = new mongoose.Schema({
    fullname: String,
    password: String,
    username: String,
    email: String,
    phone: String,
    profile: String,
    age: {type : Number},
    gender: String,
    education: String,
    position: String,
    grade: String,
    role: String,
    dateEmployed: { type: Date }
});

//mongoose passport-local
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(new LocalStrategy({
    usernameField: 'username', // Adjust the field based on your form
    passwordField: 'password', // Adjust the field based on your form
}, (username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) { // Implement a method to check the password
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    });
});

// CHECK AUTH USER
// const isAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.redirect('/landing'); // Redirect to the login page if not authenticated
// };

app.get('/', async function (req, res) {
    res.render('testing');
});

app.get('/landing', async function (req, res) {
    res.render('landing');
});

// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
