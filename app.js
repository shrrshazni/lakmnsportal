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
const fs = require('fs').promises;

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
            maxAge: 7 * 60 * 60 * 1000
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
    classification: {
        type: String,
        enum: ['permanent', 'contract', 'intern', 'trainee'],
        default: 'trainee'
    },
    marital: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
        default: 'single'
    },
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
const userLeaveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    annual: { type: Number, default: 14 },
    sick: { type: Number, default: 14 },
    emergency: { type: Number, default: 0 },
    paternity: { type: Number, default: 3 },
    marriage: { type: Number, default: 3 },
    bereavement: { type: Number, default: 3 },
    unpaid: { type: Number, default: 0 },
    hajj: { type: Number, default: 40 },
    special: { type: Number, default: 0 }
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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    title: { type: String },
    type: { type: String },
    description: { type: String }
});

// TASK
const taskSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    due: { type: Date },
    description: { type: String },
    status: {
        type: String,
        enum: ['process', 'urgent', 'done', 'cancelled'],
        default: 'process'
    },
    fileId: { type: String },
    subtask: [
        {
            name: { type: String }
        }
    ],
    assignee: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reminder: { type: Date }
});

// USER'S INFORMATION
const infoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'submitted'],
        default: 'pending'
    },
    comment: String,
    timestamp: { type: Date },
    estimated: { type: Date }
});

const leaveSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    grade: { type: String, required: true },
    fullname: String,
    department: String,
    section: String,
    type: String,
    date: leaveDate,
    purpose: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'submitted', 'invalid'],
        default: 'pending'
    },
    comment: String,
    timestamp: { type: Date, default: Date.now },
    estimated: {
        type: Date,
        default: () => {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 3);
            return currentDate;
        }
    },
    approvals: [approvalSchema]
});

// FILE
const FileSchema = new mongoose.Schema({
    uuid: String,
    user: String,
    name: String,
    path: String,
    date: { type: Date },
    type: String,
    size: String
});

//mongoose passport-local
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = userDatabase.model('User', userSchema);
const Activity = userDatabase.model('Activity', activitySchema);
const Info = userDatabase.model('Info', infoSchema);
const UserLeave = userDatabase.model('Leave', userLeaveSchema);
const Notification = userDatabase.model('Notification', notificationSchema);
const Task = userDatabase.model('Task', taskSchema);
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

    const allUser = await User.find();
    const allLeave = await Leave.find();
    const allUserLeave = await UserLeave.find();
    const userLeave = await UserLeave.findOne({ user: user._id });
    const leave = await Leave.find({ user: user._id });
    const task = await Task.find({ assignee: user._id });
    const file = await File.find();

    // activity

    const activity = await Activity.find({ 'user.department' : user.department }).populate('user');

    console.log(activity);    

    if (user) {
        res.render('home', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            // all data
            allUser: allUser,
            allUserLeave: allUserLeave,
            allLeave: allLeave,
            userLeave: userLeave,
            leave: leave,
            tasks: task,
            files: file,
            activities : activity,
            selectedNames: '',
            // toast
            show: '',
            alert: ''
        });
    }
});

// TASK

// ADD TASK
app.post('/task/add', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const name = req.body.name;
        const description = req.body.description;
        const status = req.body.status;
        const due = req.body.due;
        const reminder = req.body.reminder;
        const selectedNames = req.body.selectedNames
            ? req.body.selectedNames.split(',')
            : [];
        const fileId = req.body.uuid;

        if (name && description && status && due && reminder && selectedNames.length > 0) {
            const assignee = await User.find({ fullname: { $in: selectedNames } }, '_id');

            const newTask = new Task({
                owner: user._id,
                name: name,
                description: description,
                status: status,
                due: due,
                reminder: reminder,
                assignee: assignee,
                fileId: fileId,
            });

            const task = newTask.save();

            if (task) {
                console.log('New task added');
                res.redirect('/');

            }

        } else {
            console.log('Your input was not valid or complete please try again!');
            res.redirect('/');
        }
    }
});

// UPDATE 
app.post('/update/:content/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const content = req.params.content;
    const id = req.params.id;

    if (user) {
        // task desc
        if (content === 'description') {
            const description = req.body.description;
            const update = await Task.findOneAndUpdate(
                { _id: id },
                {
                    $set: { description: description }
                },
                {
                    new: true
                }
            );

            if (update) {
                console.log('Description task has been updated');
                res.redirect('/');
            } else {
                console.log('Description task has not been updated.');
                res.redirect('/');
            }
        } else if (content === 'subtask') {
            const subtask = req.body.subtask;

            const update = await Task.findOneAndUpdate(
                { _id: id },
                { $push: { subtask: { name: subtask } } },
                { new: true }
            );

            if (update) {
                console.log('Subtask added');
                res.redirect('/');
            } else {
                console.log('Subtask failed to be added.');
            }
        } else if (content === 'task') {
            const subtask = req.body.subtaskCheckbox;
            const status = req.body.status;
            const due = req.body.due;
            const reminder = req.body.reminder;

            const updateFields = {};

            if (due) {
                updateFields.due = new Date(due);
            }

            if (reminder) {
                updateFields.reminder = new Date(reminder);
            }

            if (status !== undefined && status !== null && status !== '') {
                updateFields.status = status;
            }

            if (subtask && subtask.length > 0) {
                await Task.findByIdAndUpdate(
                    { _id: id },
                    { $pull: { subtask: { _id: { $in: subtask } } } },
                    { new: true }
                );
                console.log('Selected subtasks have been deleted.');
            } else {
                console.log('There is no subtask selected.');
            }

            const update = await Task.findByIdAndUpdate(
                { _id: id },
                {
                    $pull: { subtask: { _id: { $in: subtask } } },
                    $set: updateFields
                },
                { new: true }
            );

            if (update) {
                console.log('Update task success');
                res.redirect('/');
            } else {
                console.log('There is must be something wrong in the update');
                res.redirect('/');
            }
        } else if (content === 'file') {
            if (!req.files || Object.keys(req.files).length === 0) {
                console.log('There is no files selected');
            } else {
                console.log('There are files try to be uploaded');

                const uuid = req.body.uuid;

                console.log(uuid);

                // No file with the report ID found, proceed with file upload
                for (const file of Object.values(req.files)) {
                    const upload = __dirname + '/public/uploads/' + file.name;
                    const pathUpload = '/uploads/' + file.name;
                    const today = new Date();
                    const type = path.extname(file.name);

                    await file.mv(upload);

                    // Calculate file size in megabytes
                    const fileSizeInBytes = (await fs.stat(upload)).size;
                    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

                    console.log(fileSizeInMB);

                    const newFile = new File({
                        uuid: uuid,
                        user: user.fullname,
                        name: file.name,
                        path: pathUpload,
                        date: today,
                        type: type,
                        size: fileSizeInMB.toFixed(2) + ' MB'
                    });

                    newFile.save();
                }

                console.log('Done upload files!');
            }
        }
    }
});

// DELETE 
app.get('/delete/:content/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const content = req.params.content;
    const id = req.params.id;

    if (user) {
        if (content === 'task') {
            const deletedTask = await Task.findOneAndDelete({ _id: id });

            if (deletedTask) {
                const deletedFiles = await File.find({ uuid: deletedTask.fileId });

                if (deletedFiles.length > 0) {
                    for (const deletedFile of deletedFiles) {
                        const filePath = path.join(__dirname, 'public', 'uploads', deletedFile.name);


                        await fs.unlink(filePath);


                        await File.deleteOne({ _id: deletedFile._id });
                    }

                    console.log('Task and files related are deleted!');
                    res.redirect('/');
                } else {
                    console.log('The task selected has been deleted');
                    res.redirect('/');
                }
            }
        }
    }
});

// SEARCH STAFF IN SAME DEPARTMENT
app.get('/search/task/assignee', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const query = req.query.query;

    try {
        let results;
        if (query && query.trim() !== '') {
            results = await User.find({
                department: user.department,
                fullname: { $regex: query, $options: 'i' }
            });
        } else {
            results = [];
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// LANDINGPAGE
app.get('/landing', async function (req, res) {
    res.render('landing-page');
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
                    annual: 14,
                    sick: 14,
                    emergency: 0,
                    paternity: 3,
                    marriage: 3,
                    bereavement: 3,
                    unpaid: 0,
                    hajj: 40,
                    special: 0
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
    const userLeave = await UserLeave.find({ user: user._id });

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
        const info = await Info.findOne({ user: user._id });

        res.render('profile', {
            user: user,
            notifications: notifications,
            userLeave: userLeave,
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

        if (user) {
            const currentLeave = await Leave.find({ user: user._id });
            const userLeave = await UserLeave.findOne({ user: user._id });

            res.render('leave-request', {
                user: user,
                uuid: uuidv4(),
                notifications: notifications,
                leave: currentLeave,
                userLeave: userLeave,
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
                    const headOfSection = await User.findOne({
                        isHeadOfSection: true,
                        section: user.section
                    });
                    const headOfDepartment = await User.findOne({
                        isHeadOfDepartment: true,
                        department: user.department
                    });
                    const adminHR = await User.findOne({
                        isAdmin: true,
                        department: 'Human Resource'
                    });
                    const userLeave = await UserLeave.findOne({ user: user._id });
                    const leave1 = await Leave.find({ user: user._id });
                    // check amount days taken
                    const millisecondsPerDay = 24 * 60 * 60 * 1000;
                    const numberOfDays = Math.ceil(
                        (new Date(returnDate) - new Date(startDate)) / millisecondsPerDay
                    );

                    //   for home
                    const allUser = await User.find();
                    const allLeave = await Leave.find();
                    const allUserLeave = await UserLeave.find();

                    const newDate = {
                        start: new Date(startDate),
                        return: new Date(returnDate)
                    };

                    console.log(headOfDepartment);
                    console.log(headOfSection);

                    if (type === 'Annual Leave') {
                        leaveBalance = userLeave.annual;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log(
                                'Sufficient annual leave balance for the requested duration'
                            );

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
                                        }
                                    ];
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
                                        }
                                    ];
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
                                    }
                                ];
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    }
                                ];
                            } else if (user.isDeputyChiefExec === true) {
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
                                    }
                                ];
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
                                        }
                                    ];
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
                                        }
                                    ];
                                }
                            }
                        } else {
                            console.log(
                                'Insufficient annual leave balance for the requested duration'
                            );

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leave1,
                                // toast
                                show: 'show',
                                alert:
                                    'Insufficient annual leave balance for the requested duration'
                            });
                        }
                    } else if (type === 'Sick Leave') {
                        leaveBalance = userLeave.sick;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log(
                                'Sufficient leave balance and grade is above 30 for the requested duration'
                            );

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
                                        }
                                    ];
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
                                        }
                                    ];
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
                                    }
                                ];
                            } else if (user.isHeadOfDepartment === true) {
                                approvals = [
                                    (approvals = [
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
                                        }
                                    ])
                                ];
                            } else if (user.isDeputyChiefExec === true) {
                                approvals = [
                                    (approvals = [
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
                                        }
                                    ])
                                ];
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
                                        }
                                    ];
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
                                        }
                                    ];
                                }
                            }
                        } else {
                            console.log(
                                'Insufficient leave balance for the requested duration'
                            );

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leave1,
                                // toast
                                show: 'show',
                                alert: 'Insufficient leave balance for the requested duration'
                            });
                        }
                    } else if (type === 'Emergency Leave') {
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
                                    }
                                ];
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
                                    }
                                ];
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
                                }
                            ];
                        } else if (user.isHeadOfDepartment === true) {
                            approvals = [
                                (approvals = [
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
                                    }
                                ])
                            ];
                        } else if (user.isDeputyChiefExec === true) {
                            approvals = [
                                (approvals = [
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
                                    }
                                ])
                            ];
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
                                    }
                                ];
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
                                    }
                                ];
                            }
                        }
                    } else if (
                        type === 'Bereavement Leave' ||
                        type === 'Marriage Leave'
                    ) {
                        leaveBalance = 3;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log(
                                'Sufficient leave balance for the requested duration'
                            );

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
                                        }
                                    ];
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
                                        }
                                    ];
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
                                    }
                                ];
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    }
                                ];
                            } else if (user.isDeputyChiefExec === true) {
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
                                    }
                                ];
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
                                        }
                                    ];
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
                                        }
                                    ];
                                }
                            }
                        } else {
                            console.log(
                                'Insufficient leave balance for the requested duration'
                            );

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leave1,
                                // toast
                                show: 'show',
                                alert: 'Insufficient leave balance for the requested duration'
                            });
                        }
                    } else if (type === 'Study Leave') {
                        leaveBalance = 5;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log(
                                'Sufficient study leave balance for the requested duration'
                            );

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
                                        }
                                    ];
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
                                        }
                                    ];
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
                                    }
                                ];
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    }
                                ];
                            } else if (user.isDeputyChiefExec === true) {
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
                                    }
                                ];
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
                                        }
                                    ];
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
                                        }
                                    ];
                                }
                            }
                        } else {
                            console.log(
                                'Insufficient study leave balance for the requested duration'
                            );

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leave1,
                                // toast
                                show: 'show',
                                alert:
                                    'Insufficient annual leave balance for the requested duration'
                            });
                        }
                    } else if (type === 'Hajj Leave') {
                        leaveBalance = userLeave.hajj;

                        if (leaveBalance >= numberOfDays) {
                            console.log(numberOfDays);
                            console.log(
                                'Sufficient leave balance for the requested duration'
                            );

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
                                        }
                                    ];
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
                                        }
                                    ];
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
                                    }
                                ];
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                                        timestamp: ''
                                    }
                                ];
                            } else if (user.isDeputyChiefExec === true) {
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
                                    }
                                ];
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
                                        }
                                    ];
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
                                        }
                                    ];
                                }
                            }
                        } else {
                            console.log(
                                'Insufficient leave balance for the requested duration'
                            );

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leave1,
                                // toast
                                show: 'show',
                                alert:
                                    'Insufficient annual leave balance for the requested duration'
                            });
                        }
                    } else if (type === 'Special Leave') {
                        if (user.isOfficer === true) {
                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date()
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    }
                                ];
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date()
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
                                        recipient: adminHR._id,
                                        role: 'Human Resource',
                                        status: 'pending',
                                        comment: 'Leave request needs to be reviewed',
                                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    }
                                ];
                            }
                        } else if (user.isHeadOfSection === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date()
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
                                    recipient: adminHR._id,
                                    role: 'Human Resource',
                                    status: 'pending',
                                    comment: 'Leave request needs to be reviewed',
                                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                }
                            ];
                        } else if (user.isHeadOfDepartment === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date()
                                },
                                {
                                    recipient: depChiefExec._id,
                                    role: 'Deputy Chief Executive Officer',
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
                                }
                            ];
                        } else if (user.isDeputyChiefExec === true) {
                            approvals = [
                                {
                                    recipient: user._id,
                                    role: 'Staff',
                                    status: 'submitted',
                                    comment: 'Submitted leave request',
                                    timestamp: new Date()
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
                                }
                            ];
                        } else {
                            if (headOfSection) {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date()
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
                                    }
                                ];
                            } else {
                                approvals = [
                                    {
                                        recipient: user._id,
                                        role: 'Staff',
                                        status: 'submitted',
                                        comment: 'Submitted leave request',
                                        timestamp: new Date()
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
                                    }
                                ];
                            }
                        }
                    } else if (type === 'Unpaid Leave') {
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
                                    }
                                ];
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
                                    }
                                ];
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
                                }
                            ];
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
                                }
                            ];
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
                                    }
                                ];
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
                                    }
                                ];
                            }
                        }
                    }

                    if (approvals === '') {
                        console.log('Leave balance not sufficient!');
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
                        user: user._id,
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

                        console.log('Done send notifications!');
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
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leave1,
                        // toast
                        show: 'show',
                        alert: 'Leave request successfully submitted'
                    });
                }
            } else {
                const files = await File.find({ uuid: uuid });
                const currentLeave = await Leave.find({ user: user._id });
                const userLeave = await UserLeave.findOne({ user: user._id });

                res.render('leave-request', {
                    user: user,
                    notifications: notifications,
                    leave: currentLeave,
                    userLeave: userLeave,
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
        const leave = await Leave.find({ user: user._id });
        const userLeave = await UserLeave.findOne({ user: user._id });

        res.render('leave-history', {
            user: user,
            notifications: notifications,
            leave: leave,
            userLeave: userLeave
        });
    }
});

// DETAILS
app.get('/leave/details/:uuid', isAuthenticated, async function (req, res) {
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
        const userLeave = await UserLeave.findOne({ user: user._id });

        // const currentDate = new Date();
        // const colleagues = await User.find({ department: user.department });
        // const colleagueLeaves = await Leave.find({
        //   username: { $in: colleagues.map(colleague => colleague.username) },
        //   'date.start': { $gte: currentDate },
        //   username: { $ne: user.username }
        // });

        // const upcomingLeaves = await Leave.find({
        //   user: user._id,
        //   'date.start': { $gte: currentDate }
        // });

        res.render('leave-details', {
            user: user,
            notifications: notifications,
            leave: leave,
            approvals: approvals,
            userLeave: userLeave
            //   upcomingLeaves: upcomingLeaves,
            //   colleagueLeaves: colleagueLeaves
        });
    }
});

// APPROVE
app.get('/leave/:approval/:uuid', async function (req, res) {
    const approval = req.params.approval;
    const uuid = req.params.uuid;
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const checkLeave = await Leave.findOne({ uuid: uuid });
        const indexOfRecipient = checkLeave.approvals.findIndex(approval =>
            approval.recipient.equals(user._id)
        );

        if (approval === 'approved') {
            const leave = await Leave.findOneAndUpdate(
                {
                    uuid: uuid,
                    'approvals.recipient': user._id
                },
                {
                    $set: {
                        'approvals.$.status': 'approved',
                        'approvals.$.comment': 'The request have been approved',
                        'approvals.$.timestamp': new Date()
                    }
                },
                { new: true }
            );

            if (leave) {
                if (user.isAdmin === true) {
                    const firstRecipientId =
                        indexOfRecipient !== -1
                            ? checkLeave.approvals[indexOfRecipient].recipient
                            : null;

                    const userLeave = await UserLeave.findOne({
                        user: firstRecipientId
                    });

                    const startDate = checkLeave.date.start;
                    const returnDate = checkLeave.date.return;
                    const timeDifference = returnDate.getTime() - startDate.getTime();

                    // Convert milliseconds to days
                    const daysDifference = Math.ceil(
                        timeDifference / (1000 * 60 * 60 * 24)
                    );

                    switch (checkLeave.type) {
                        case 'Annual Leave':
                            userLeave.annual -= daysDifference;
                            userLeave.annual = Math.max(0, userLeave.annual);
                            break;

                        case 'Sick Leave':
                            userLeave.sick -= daysDifference;
                            userLeave.sick = Math.max(0, userLeave.sick);
                            break;

                        default:
                            break;
                    }

                    await userLeave.save();

                    const updateStatus = await Leave.findOneAndUpdate(
                        {
                            uuid: uuid
                        },
                        {
                            $set: {
                                status: 'approved'
                            }
                        },
                        { new: true }
                    );

                    // send noti
                    const newNotification = new Notification({
                        sender: user._id,
                        recipient: new mongoose.Types.ObjectId(firstRecipientId),
                        type: 'Leave',
                        url: '/leave/details/' + uuid,
                        message: 'Your leave request have been approved'
                    });

                    // newNotification.save();

                    const firstRecipientEmail = await User.findOne({
                        _id: firstRecipientId
                    });

                    // turn off the email notications
                    // send email to the recipient
                    // let mailOptions = {
                    //     from: 'shrrshazni@gmail.com',
                    //     to: firstlRecipientEmail.email,
                    //     subject: 'lakmnsportal - Approval Leave Follow up',
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
                    //           <p>${user.fullname} has take action of ${type} from, ${startDate} until ${returnDate}.</p>
                    //           <p>Please do check the leave approval at <a href="http://localhost:5002/">lakmnsportal</a></p>
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

                    console.log('The leave has been officially approved');
                    res.redirect('/leave/details/' + uuid);
                } else {
                    const nextIndex = indexOfRecipient + 1;
                    const nextApprovalRecipientId =
                        checkLeave.approvals[nextIndex].recipient;

                    // send noti
                    const newNotification = new Notification({
                        sender: user._id,
                        recipient: new mongoose.Types.ObjectId(nextApprovalRecipientId),
                        type: 'Leave',
                        url: '/leave/details/' + uuid,
                        message:
                            'Previous approval has been submitted, please do check the leave request'
                    });

                    // newNotification.save();

                    const nextApprovalRecipientEmail = await User.findOne({
                        _id: nextApprovalRecipientId
                    });

                    // turn off the email notications
                    // send email to the recipient
                    // let mailOptions = {
                    //     from: 'shrrshazni@gmail.com',
                    //     to: nextApprovalRecipientEmail.email,
                    //     subject: 'lakmnsportal - Approval Leave Follow up',
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
                    //           <p>${user.fullname} has take action of ${type} from, ${startDate} until ${returnDate}.</p>
                    //           <p>Please do check the leave approval at <a href="http://localhost:5002/">lakmnsportal</a></p>
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

                    console.log('The leave has been approved');
                    res.redirect('/leave/details/' + uuid);
                }
            }
        } else if (approval === 'denied') {
            const leave = await Leave.findOneAndUpdate(
                {
                    uuid: uuid,
                    'approvals.recipient': user._id
                },
                {
                    $set: {
                        status: 'denied',
                        'approvals.$.status': 'denied',
                        'approvals.$.comment': 'The request have been denied',
                        'approvals.$.timestamp': new Date()
                    }
                },
                { new: true }
            );

            if (leave) {
                var sendNoti = [];
                var sendEmail = [];

                const recipientIds = checkLeave.approvals.map(
                    approval => approval.recipient
                );
                sendNoti = recipientIds.filter(
                    recipientId => !recipientId.equals(user._id)
                );

                // // notifications save has been turn off
                // if (sendNoti.length > 0) {
                //     for (const recipientId of sendNoti) {
                //         const newNotification = new Notification({
                //             sender: user._id,
                //             recipient: new mongoose.Types.ObjectId(recipientId),
                //             type: 'Leave',
                //             url: '/leave/details/' + uuid,
                //             message: 'Leave request needs approval.'
                //         });

                //         // newNotification.save();
                //     }

                //     console.log('Done send notifications!');
                // }

                const users = await User.find({ _id: { $in: sendNoti } });
                sendEmail = users.map(user => user.email);
                console.log(sendEmail);

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
            }
        }
    }
});

// SCHEDULER
cron.schedule(
    '0 0 * * *',
    async () => {
        // Find leave records with date.start timestamp less than or equal to 3 days from now
        const currentDate = new Date();
        const invalidLeaves = await Leave.find({
            estimated: { $gte: currentDate.setDate(currentDate.getDate() + 3) },
            $or: [{ status: 'pending' }, { status: 'submitted' }]
        });

        const adminHR = await User.findOne({ isAdmin: true });
        const depChiefExec = await User.findOne({ isDeputyChiefExec: true });

        // Update the status of invalid leaves
        for (const leave of invalidLeaves) {
            leave.status = 'invalid';
            leave.approvals = leave.approvals.filter(
                approval => approval.role === 'Staff'
            );

            leave.approvals.push(
                {
                    recipient: depChiefExec._id,
                    role: 'Deputy Chief Executive Officer',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                },
                {
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                }
            );

            await leave.save();
        }

        const pendingLeaves = await Leave.find({
            estimated: { $lte: currentDate.setDate(currentDate.getDate() + 3) },
            status: 'submitted'
        });

        // Update the status of pending leaves
        for (const pending of pendingLeaves) {
            pending.status = 'invalid';
            await pending.save();
        }

        console.log('Invalid leaves updated:', invalidLeaves.length);
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

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

        const allUser = await User.find();
        const allLeave = await Leave.find();
        const allUserLeave = await UserLeave.find();
        const leave = await Leave.find({ user: user._id });

        const userLeave = await UserLeave.findOne({ user: user._id });

        res.render('home', {
            user: user,
            notifications: notifications,
            // all data
            allUser: allUser,
            allUserLeave: allUserLeave,
            allLeave: allLeave,
            userLeave: userLeave,
            leave: leave,
            // toast
            show: 'show',
            alert: 'Notification has been marked'
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

    const allUser = await User.find();
    const allLeave = await Leave.find();
    const allUserLeave = await UserLeave.find();
    const leave = await Leave.find({ user: user._id });
    const userLeave = await UserLeave.findOne({ user: user._id });

    if (update) {
        res.redirect('/');
    } else {
        res.render('home', {
            user: user,
            notifications: notifications,
            // all data
            allUser: allUser,
            allUserLeave: allUserLeave,
            allLeave: allLeave,
            userLeave: userLeave,
            leave: leave,
            // toast
            show: 'show',
            alert: 'All notification has been marked'
        });
    }
});

// FILES

// UPLOAD
app.post('/files/upload', isAuthenticated, async (reqFiles, resFiles) => {
    const username = reqFiles.user.username;
    const user = await User.findOne({ username: username });

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

            await file.mv(upload);

            // Calculate file size in megabytes
            const fileSizeInBytes = (await fs.stat(upload)).size;
            const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

            console.log(fileSizeInMB);

            const newFile = new File({
                uuid: uuid,
                user: user.fullname,
                name: file.name,
                path: pathUpload,
                date: today,
                type: type,
                size: fileSizeInMB.toFixed(2) + ' MB'
            });

            newFile.save();
        }

        console.log('Done upload files!');
    }
});

// DOWNLOAD
app.get('/files/download/:id', async function (req, res) {
    const _id = req.params.id;

    const file = await File.findOne({ _id: _id });

    if (file) {
        const filePath = __dirname + '/public/uploads/' + file.name;

        res.download(filePath, file.name);
        console.log('Downloading file');
    }
});

// DELETE
app.get('/files/delete/:id', async function (reqDel, resDel) {
    const _id = reqDel.params.id;

    const deleted = await File.findOneAndDelete({ _id: _id });

    if (deleted) {
        const filePath = __dirname + '/public/uploads/' + deleted.name;
        console.log('File selected is deleted!');
        await fs.unlink(filePath);

        resDel.redirect('/');
    } else {
        console.log('There must be something wrong in deleting the files!');
        resDel.redirect('/');
    }
});

// FECTH API

app.post('/status-update', isAuthenticated, async (req, res) => {
    const user = req.user.username;
    const status = req.body.status;

    const update = await Info.findOneAndUpdate(
        { user: user._id },
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
