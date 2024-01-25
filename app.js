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
const { v4: uuidv4 } = require('uuid');
const { send } = require('process');

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
    collection: 'sessions',
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
        store: store,
        cookie: {
            maxAge: 1 * 60 * 60 * 1000 // Default session duration, will be updated below
        }
    })
);

//init passport
app.use(passport.initialize());
app.use(passport.session());

// DATABASE INITIALIZATION

// Users Database
const userDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/user'
);

// Leave Database
const leaveDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/leave'
);

// File Database
const fileDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/file'
);

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
    grade: { type: Number, default: 5 },
    classification: { type: String, enum: ['permanent', 'contract', 'intern', 'trainee'], default: 'trainee' },
    marital: { type: String, enum: ['single', 'married', 'divorced', 'widowed', 'separated'], default: 'single' },
    isChiefExec: { type: Boolean, default: false },
    isDeputyChiefExec: { type: Boolean, default: false },
    isHeadOfDepartment: { type: Boolean, default: false },
    isHeadOfSection: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isOfficer: { type: Boolean, default: false },
    dateEmployed: { type: Date },
    birthdate: { type: Date }
});

// USER LEAVE
const annual = {
    balance: { type: Number, default: 0 },
    approved: { type: Number, default: 0 }
}
const userLeaveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    annual: annual,
    sick: { type: Number, default: 14 },
    emergency: { type: Number, default: 0 },
    paternity: { type: Number, default: 3 },
    marriage: { type: Number, default: 3 },
    bereavement: { type: Number, default: 3 },
    unpaid: { type: Number, default: 0 },
    hajj: { type: Number, default: 40 },
    special: { type: Number, default: 0 },
});

// NOTIFICATIONS
const notificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: { type: String, required: true },
    type: { type: String },
    url: { type: String },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

// ACTIVITY
const activitySchema = new mongoose.Schema({
    date: String,
    items: []
});

// USER'S INFORMATION
const infoSchema = new mongoose.Schema({
    username: String,
    status: String
});

// LEAVE

const leaveDate = {
    start: { type: Date },
    return: { type: Date }
};

const approvalSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied', 'submitted'], default: 'pending' },
    comment: String,
    timestamp: { type: Date },
    estimated: { type: Date }
});

const leaveSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    grade: { type: String, required: true },
    fullname: String,
    department: String,
    section: String,
    type: String,
    date: leaveDate,
    purpose: String,
    status: { type: String, enum: ['pending', 'approved', 'denied', 'submitted'], default: 'pending' },
    comment: String,
    timestamp: { type: Date, default: Date.now },
    approvals: [approvalSchema]
});

// FILE
const FileSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    path: String,
    date: { type: Date },
    type: String
});

//mongoose passport-local
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = userDatabase.model('User', userSchema);
const Activity = userDatabase.model('Activity', activitySchema);
const Info = userDatabase.model('Info', infoSchema);
const UserLeave = userDatabase.model('Leave', userLeaveSchema);
const Notification = userDatabase.model('Notification', notificationSchema);
const Leave = leaveDatabase.model('Leave', leaveSchema);
const File = fileDatabase.model('File', FileSchema);

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

// EMAIL TRANSPORTER
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shrrshazni@gmail.com',
        pass: 'hzjlhfyspfyynndw'
    }
});

// BASIC USER PART

// HOME
app.get('/', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        res.render('home', {
            user: user,
            notifications: notifications,
            // toast
            show: '',
            alert: ''
        });
    }
});

// LANDINGPAGE
app.get('/landing', async function (req, res) {
    const numCircles = 4;
    const circles = Array.from({ length: numCircles }, () => ({
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 60) + 20,
        size: Math.floor(Math.random() * 100) + 50 // Random size between 50 and 150 pixels
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
        if (
            !req.body.fullname ||
            !req.body.username ||
            !req.body.email ||
            !req.body.password
        ) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const newUser = new User({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            nric: req.body.nric,
            phone: req.body.phone,
            profile: '',
            age: 0,
            address: '',
            birthdate: '',
            department: '',
            section: '',
            gender: '',
            grade: 0,
            position: '',
            education: '',
            marital: 'single',
            classification: 'permanent',
            isChiefExec: false,
            isDeputyChiefExec: false,
            isHeadOfDepartment: false,
            isHeadOfSection: false,
            isAdmin: false
        });

        User.register(newUser, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect('/sign-up');
            } else {
                const newUserLeave = new UserLeave({
                    user: user._id,
                    annual: { balance: 14, approved: 0 },
                    sick: 14,
                    emergency: 0,
                    paternity: 3,
                    marriage: 3,
                    bereavement: 3,
                    unpaid: 0,
                    hajj: 40,
                    special: 0,
                });
                newUserLeave.save();

                passport.authenticate('local')(req, res, function () {
                    res.redirect('/landing');
                });
            }
        });
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

        console.log(
            `Current Session maxAge: ${req.session.cookie.maxAge} milliseconds`
        );

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
                    validationUsername = 'is-valid';

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
                        validationPassword = 'is-invalid';

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
                    req.logIn(authenticatedUser, err => {
                        if (err) {
                            return next(err);
                        }
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
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const date = getDateFormat2();

    // calculate user's age
    const age = calculateAge(user.birthdate);

    const newData = {
        age: age
    };

    // update age
    const update = await User.updateOne(
        { username: username },
        { $set: newData }
    );

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
            notifications: notifications,
            activity: activity,
            info: info,
            today: date
        });
    }
});

// LEAVE

// REQUEST
app
    .get('/leave/request', isAuthenticated, async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        console.log(notifications);

        if (user) {
            res.render('leave-request', {
                user: user,
                uuid: uuidv4(),
                notifications: notifications,
                files: '',
                type: '',
                startDate: '',
                returnDate: '',
                purpose: '',
                // validation
                validationType: '',
                validationStartDate: '',
                validationReturnDate: '',
                validationPurpose: '',
                // toast
                show: '',
                alert: ''
            });
        }
    })
    .post('/leave/request/:uuid', isAuthenticated, async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        if (user) {
            const uuid = req.params.uuid;
            const type = req.body.type;
            const startDate = req.body.startDate;
            const returnDate = req.body.returnDate;
            const purpose = req.body.purpose;

            var validationType = '';
            var validationStartDate = '';
            var validationReturnDate = '';
            var validationPurpose = '';

            if (!type || type === '' || type === 'Select leave type') {
                validationType = 'is-invalid';
            } else {
                validationType = 'is-valid';
            }

            if (!startDate || startDate === '') {
                validationStartDate = 'is-invalid';
            } else {
                validationStartDate = 'is-valid';
            }

            if (!returnDate || returnDate === '') {
                validationReturnDate = 'is-invalid';
            } else {
                validationReturnDate = 'is-valid';
            }

            if (!purpose || purpose === '') {
                validationPurpose = 'is-invalid';
            } else {
                validationPurpose = 'is-valid';
            }

            if (
                validationType === 'is-valid' &&
                validationStartDate === 'is-valid' &&
                validationReturnDate === 'is-valid' &&
                validationPurpose === 'is-valid'
            ) {
                const existing = await Leave.findOne({ uuid: uuid });

                if (!existing) {
                    var leaveBalance = '';
                    var approvals = '';
                    var sendNoti = [];
                    var sendEmail = [];
                    const chiefExec = await User.findOne({ isChiefExec: true });
                    const depChiefExec = await User.findOne({ isDeputyChiefExec: true });
                    const headOfSection = await User.findOne({ isHeadOfSection: true, section: user.section });
                    const headOfDepartment = await User.findOne({ isHeadOfDepartment: true, department: user.department });
                    const adminHR = await User.findOne({ isAdmin: true, department: 'Human Resource' });
                    const userLeave = await UserLeave.findOne({ user: user._id });
                    const userGrade = user.grade;
                    // check amount days taken
                    const millisecondsPerDay = 24 * 60 * 60 * 1000;
                    const numberOfDays = Math.ceil((new Date(returnDate) - new Date(startDate)) / millisecondsPerDay);


                    const newDate = {
                        start: new Date(startDate),
                        return: new Date(returnDate)
                    };

                    if (type === "Annual Leave") {
                        leaveBalance = userLeave.annual.approved;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log('Sufficient annual leave balance for the requested duration');

                            if (user.isOfficer === true) {
                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            } else if (user.isHeadOfSection === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]

                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {

                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            }

                        } else {
                            console.log('Insufficient annual leave balance for the requested duration');

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // toast
                                show: 'show',
                                alert: 'Insufficient annual leave balance for the requested duration'
                            });
                        }

                    } else if (type === "Sick Leave") {
                        leaveBalance = userLeave.sick;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log('Sufficient leave balance and grade is above 30 for the requested duration');

                            if (user.isOfficer === true) {
                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            } else if (user.isHeadOfSection === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]

                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                ]
                            } else {

                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            }

                        } else {
                            console.log('Insufficient leave balance or grade is not above 30 for the requested duration');

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // toast
                                show: 'show',
                                alert: 'Insufficient annual leave balance or grade is not above 30 for the requested duration'
                            });
                        }
                    } else if (type === "Emergency Leave") {
                        if (user.isOfficer === true) {
                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            }
                        } else if (user.isHeadOfSection === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date(),
                                    estimated: ''
                                },
                                {
                                    recipient: headOfDepartment._id,
                                    role: 'Head of Department',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                            ]

                        } else if (user.isHeadOfDepartment === true) {
                            approvals = [
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            ]
                        } else {

                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            }
                        }
                    } else if (type === "Bereavement Leave" || type === "Marriage Leave") {
                        leaveBalance = 3;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log('Sufficient leave balance for the requested duration');

                            if (user.isOfficer === true) {
                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            } else if (user.isHeadOfSection === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]

                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {

                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            }

                        } else {
                            console.log('Insufficient leave balance or grade is not above 30 for the requested duration');

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // toast
                                show: 'show',
                                alert: 'Insufficient leave balance or grade is not above 30 for the requested duration'
                            });
                        }

                    } else if (type === "Study Leave") {
                        leaveBalance = 5;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log('Sufficient study leave balance for the requested duration');

                            if (user.isOfficer === true) {
                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            } else if (user.isHeadOfSection === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]

                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {

                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            }

                        } else {
                            console.log('Insufficient study leave balance for the requested duration');

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // toast
                                show: 'show',
                                alert: 'Insufficient study leave balance for the requested duration'
                            });
                        }

                    } else if (type === "Hajj Leave") {
                        leaveBalance = userLeave.hajj;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log('Sufficient hajj leave balance for the requested duration');

                            if (user.isOfficer === true) {
                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: depChiefExec._id,
                                            role: 'Deputy Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: chiefExec._id,
                                            role: 'Chief Executive Officer',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            } else if (user.isHeadOfSection === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]

                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {

                                if (headOfSection) {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfSection._id,
                                            role: 'Head of Section',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                } else {
                                    approvals = [
                                        {
                                            recipient: user._id,
                                            role: 'Staff',
                                            status: 'submitted',
                                            comment: 'Submitted leave request',
                                            timestamp: new Date(),
                                            estimated: ''
                                        },
                                        {
                                            recipient: headOfDepartment._id,
                                            role: 'Head of Department',
                                            status: 'pending',
                                            comment: 'Leave request needs approval',
                                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                        {
                                            recipient: adminHR._id,
                                            role: 'Human Resource',
                                            status: 'pending',
                                            comment: 'Leave request needs to be reviewed',
                                            estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                            timestamp: ''
                                        },
                                    ]
                                }
                            }

                        } else {
                            console.log('Insufficient hajj leave balance for the requested duration');

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // toast
                                show: 'show',
                                alert: 'Insufficient annual leave balance for the requested duration'
                            });
                        }

                    } else if (type === "Special Leave") {
                        if (user.isOfficer === true) {
                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                ]
                            }
                        } else if (user.isHeadOfSection === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date(),
                                },
                                {
                                    recipient: headOfDepartment._id,
                                    role: 'Head of Department',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                },
                                {
                                    recipient: depChiefExec._id,
                                    role: 'Deputy Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                                {
                                    recipient: chiefExec._id,
                                    role: 'Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                                {
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                            ]

                        } else if (user.isHeadOfDepartment === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date(),
                                },
                                {
                                    recipient: depChiefExec._id,
                                    role: 'Deputy Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                                {
                                    recipient: chiefExec._id,
                                    role: 'Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                                {
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                },
                            ]
                        } else {

                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    },
                                ]
                            }
                        }
                    } else if (type === "Unpaid Leave") {
                        if (user.isOfficer === true) {
                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: depChiefExec._id,
                                        role: 'Deputy Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: chiefExec._id,
                                        role: 'Chief Executive Officer',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            }
                        } else if (user.isHeadOfSection === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date(),
                                    estimated: ''
                                },
                                {
                                    recipient: headOfDepartment._id,
                                    role: 'Head of Department',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: depChiefExec._id,
                                    role: 'Deputy Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: chiefExec._id,
                                    role: 'Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                            ]

                        } else if (user.isHeadOfDepartment === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date(),
                                    estimated: ''
                                },
                                {
                                    recipient: depChiefExec._id,
                                    role: 'Deputy Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: chiefExec._id,
                                    role: 'Chief Executive Officer',
                                    status: 'pending',
                                    comment: 'Leave request needs approval',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                                {
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                    timestamp: ''
                                },
                            ]
                        } else {

                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfSection._id,
                                        role: 'Head of Section',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date(),
                                        estimated: ''
                                    },
                                    {
                                        recipient: headOfDepartment._id,
                                        role: 'Head of Department',
                                        status: 'pending',
                                        comment: 'Leave request needs approval',
                                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                    {
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    },
                                ]
                            }
                        }
                    }

                    if (approvals === '') {
                        console.log("Leave balance not sufficient!");
                    } else {
                        // set user id to be send
                        for (const approval of approvals) {
                            const recipientId = approval.recipient;

                            // Add the recipientId to the sendNoti array if not already present
                            if (!sendNoti.includes(recipientId)) {
                                sendNoti.push(recipientId);
                            }

                            // Fetch the user by recipient ID
                            const email = await User.findById(recipientId);

                            // Check if the user is found and has an email
                            if (email && user.email) {
                                // Add the user's email to sendEmail
                                sendEmail.push(email.email);
                            }
                        }
                    }

                    const leave = new Leave({
                        uuid: uuid,
                        username: user.username,
                        fullname: user.fullname,
                        department: user.department,
                        section: user.section,
                        grade: user.grade,
                        type: type,
                        date: newDate,
                        status: 'submitted',
                        purpose: purpose,
                        approvals: approvals
                    });

                    Leave.create(leave);
                    console.log('Leave submission has been completed');

                    // notifications save has been turn off
                    if (sendNoti.length > 0) {
                        for (const recipientId of sendNoti) {
                            const newNotification = new Notification({
                                sender: user._id,
                                recipient: new mongoose.Types.ObjectId(recipientId),
                                type: 'Leave',
                                url: '/leave/details/' + uuid,
                                message: 'Leave request needs approval.'
                            });

                            // newNotification.save();
                        }

                        console.log("Done send notifications!");
                    }

                    // turn off the email notications
                    // send email to the recipient
                    // let mailOptions = {
                    //     from: 'shrrshazni@gmail.com',
                    //     to: sendEmail,
                    //     subject: 'lakmnsportal - Approval Leave Request',
                    //     html: `
                    //       <html>
                    //         <head>
                    //           <style>
                    //             body {
                    //               font-family: 'Arial', sans-serif;
                    //               background-color: #f4f4f4;
                    //               color: #333;
                    //             }
                    //             p {
                    //               margin-bottom: 20px;
                    //             }
                    //             a {
                    //               color: #3498db;
                    //             }
                    //           </style>
                    //         </head>
                    //         <body>
                    //           <h1>Leave Request</h1>
                    //           <p>${user.fullname} has requested ${type} from, ${startDate} until ${returnDate}</p>
                    //           <p>Please do check your notification at <a href="http://localhost:5002/">lakmnsportal</a></p>
                    //         </body>
                    //       </html>
                    //     `
                    // };

                    // transporter.sendMail(mailOptions, (error, info) => {
                    //     if (error) {
                    //         return console.log(error);
                    //     }
                    //     console.log('Message %s sent: %s', info.messageId, info.response);
                    // });

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        // toast
                        show: 'show',
                        alert: 'Successfully a submit leave request'
                    });
                }
            } else {
                const files = await File.find({ uuid: uuid });

                res.render('leave-request', {
                    user: user,
                    notifications: notifications,
                    uuid: uuid,
                    files: files,
                    type: type,
                    startDate: startDate,
                    returnDate: returnDate,
                    purpose: purpose,
                    // validation
                    validationType: validationType,
                    validationStartDate: validationStartDate,
                    validationReturnDate: validationReturnDate,
                    validationPurpose: validationPurpose,
                    // toast
                    show: 'show',
                    alert: 'Error: Invalid input in the form. Please check your entries.'
                });
            }
        }
    });

// HISTORY
app.get('/leave/history', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        const leave = await Leave.find({ username: user.username });

        res.render('leave-history', {
            user: user,
            notifications: notifications,
            leave: leave
        });
    }
});

// DETAILS
app.get('/leave/details/:uuid', async function (req, res) {
    const uuid = req.params.uuid;
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        const leave = await Leave.findOne({ uuid: uuid });
        const approvals = leave.approvals;

        res.render('leave-details', {
            user: user,
            notifications: notifications,
            leave: leave,
            approvals: approvals
        });
    }
});

// NOTIFICATIONS
app.get('/markAsRead/:id', isAuthenticated, async function (req, res) {
    const id = req.params.id;
    console.log(id);

    const update = await Notification.findByIdAndUpdate(
        { _id: id },
        { read: true },
        { new: true }
    );

    if (update) {
        res.redirect(update.url);
    } else {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');
        res.render('home', {
            user: user,
            notifications: notifications,
            // toast
            show: 'show',
            alert: 'Failed to mark the notifications'
        });
    }
});

app.get('/markAllAsRead', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const update = await Notification.updateMany(
        { recipient: user._id },
        { read: true },
        { new: true }
    );

    if (update) {
        res.redirect('/');
    } else {
        res.render('home', {
            user: user,
            notifications: notifications,
            // toast
            show: 'show',
            alert: 'Failed to mark the notifications'
        });
    }
});

// FILES

// UPLOAD
app.post('/upload-files', isAuthenticated, async (reqFiles, resFiles) => {
    if (!reqFiles.files || Object.keys(reqFiles.files).length === 0) {
        console.log('There is no files selected');
    } else {
        console.log('There are files try to be uploaded');

        const uuid = reqFiles.body.uuid;

        // No file with the report ID found, proceed with file upload
        for (const file of Object.values(reqFiles.files)) {
            const upload = __dirname + '/public/uploads/' + file.name;
            const pathUpload = '/uploads/' + file.name;
            const today = new Date();
            const type = path.extname(file.name);

            file.mv(upload, err => {
                if (err) {
                    console.log(err);
                }

                // Save file information to the MongoDB
                const newFile = new File({
                    uuid: uuid,
                    name: file.name,
                    path: pathUpload,
                    date: today,
                    type: type
                });

                newFile.save();
            });
        }

        console.log('Done upload files!');
    }
});

// DELETE
app.get('/delete/files/:id', async function (reqDel, resDel) {
    const _id = reqDel.params.id;

    const deleted = await File.findOneAndDelete({ _id: _id });

    if (deleted) {
        console.log('File selected is deleted!');
    } else {
        console.log('There must be something wrong in deleting the files!');
    }
});

// FECTH API

app.post('/status-update', isAuthenticated, async (req, res) => {
    const user = req.user.username;
    const status = req.body.status;

    const update = await Info.findOneAndUpdate(
        { username: user },
        { $set: { status: status } },
        { upsert: true, new: true, useFindAndModify: false }
    );

    if (update) {
        console.log('Status update accomplished! ');
        res.redirect('/');
    } else {
        console.log('Status update failed!');
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
};

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
};

// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
