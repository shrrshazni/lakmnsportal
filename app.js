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
    officePhone: String,
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
    annual: {
        leave: { type: Number, default: 14 },
        taken: { type: Number, default: 0 }
    },
    sick: {
        leave: { type: Number, default: 14 },
        taken: { type: Number, default: 0 }
    },
    sickExtended: {
        leave: { type: Number, default: 60 },
        taken: { type: Number, default: 0 }
    },
    emergency: {
        leave: { type: Number, default: 0 },
        taken: { type: Number, default: 0 }
    },
    paternity: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    },
    maternity: {
        leave: { type: Number, default: 60 },
        taken: { type: Number, default: 0 }
    },
    bereavement: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    }, // will be removed later
    study: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    }, // will be removed later
    marriage: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    },
    attendExam: {
        leave: { type: Number, default: 5 },
        taken: { type: Number, default: 0 }
    },
    hajj: {
        leave: { type: Number, default: 40 },
        taken: { type: Number, default: 0 }
    },
    unpaid: {
        taken: { type: Number, default: 0 }
    },
    special: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    }
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
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    grade: { type: String, required: true },
    fileId: { type: String, unique: true },
    type: { type: String },
    assignee: [{ type: mongoose.Schema.Types.ObjectId }],
    date: {
        start: { type: Date },
        return: { type: Date }
    },
    purpose: String,
    status: {
        type: String,
        enum: [
            'pending',
            'approved',
            'denied',
            'submitted',
            'invalid',
            'cancelled'
        ],
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
    user: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    path: String,
    date: { type: Date },
    type: String,
    origin: String,
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
    const task = await Task.find({ assignee: { $in: [user._id] } })
        .sort({ timestamp: -1 })
        .populate('assignee')
        .exec();
    const file = await File.find();

    // find activities one week ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await Activity.find({
        department: user.department,
        date: { $gte: sevenDaysAgo }
    })
        .populate({
            path: 'user'
        })
        .sort({ date: -1 })
        .exec();

    const userDepartment = await User.find({
        department: user.department,
        _id: { $ne: user._id }
    });
    const otherTask = await Task.find({ assignee: { $ne: [user._id] } });
    const otherActivities = await Activity.find();

    // const newUserLeave = new UserLeave({
    //     user: '65b1b953bf237e83aa5a7f27', // Replace with the actual user ID
    //     annual: { leave: 14, taken: 0 },
    //     sick: { leave: 14, taken: 0 },
    //     sickExtended: { leave: 60, taken: 0 },
    //     emergency: { leave: 0, taken:0 },
    //     paternity: { leave: 3, taken: 0 },
    //     maternity: { leave: 60, taken: 0 },
    //     bereavement: { leave: 3, taken: 0 }, // will be removed later
    //     study: { leave: 3, taken: 0 }, // will be removed later
    //     marriage: { leave: 3, taken: 0 },
    //     attendExam: { leave: 5, taken: 0 },
    //     hajj: { leave: 40, taken: 0 },
    //     unpaid: { taken: 0 },
    //     special: { leave: 7, taken: 0 }
    // });

    // newUserLeave.save();

    if (user) {
        res.render('home', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            userDepartment: userDepartment,
            otherTasks: otherTask,
            otherActivities: otherActivities,
            // all data
            allUser: allUser,
            allUserLeave: allUserLeave,
            allLeave: allLeave,
            userLeave: userLeave,
            leave: leave,
            tasks: task,
            files: file,
            activities: activities,
            selectedNames: '',
            // toast
            show: '',
            alert: ''
        });
    }
});

// FETCH API

// ECHARTS

// USER'S LEAVE TYPE
app.get(
    '/api/echarts/leaveType/:id',
    isAuthenticated,
    async function (req, res) {
        const { id } = req.params;
        const userLeave = await UserLeave.findOne({ user: id }).populate('user').exec();

        if (!userLeave) {
            return res.status(404).json({ error: 'User leave data not found' });
        }
        res.json(userLeave);
    }
);

// STAFF DETAILS

app.get('/staff/details/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const id = req.params.id;
    const otherUser = await User.findOne({ _id: id });

    const task = await Task.find({ assignee: { $in: [otherUser._id] } })
        .populate('assignee')
        .exec();
    const file = await File.find();
    const allUser = await User.find();
    const activities = await Activity.find({ user: otherUser._id });
    const leave = await Leave.find({ user: otherUser._id });

    if (user) {
        res.render('staff-details', {
            user: user,
            notifications: notifications,
            // other data
            otherUser: otherUser,
            tasks: task,
            files: file,
            allUser: allUser,
            activities: activities,
            leave: leave
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

        if (
            name &&
            description &&
            status &&
            due &&
            reminder &&
            selectedNames.length > 0
        ) {
            const assignee = await User.find(
                { fullname: { $in: selectedNames } },
                '_id'
            );

            const newTask = new Task({
                owner: user._id,
                name: name,
                description: description,
                status: status,
                due: due,
                reminder: reminder,
                assignee: assignee,
                fileId: fileId
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
                const origin = req.body.origin;

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
                        user: user._id,
                        name: file.name,
                        path: pathUpload,
                        date: today,
                        type: type,
                        origin: origin,
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
                        const filePath = path.join(
                            __dirname,
                            'public',
                            'uploads',
                            deletedFile.name
                        );

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
    const leave = await Leave.find({ user: user._id });
    const activities = await Activity.find({ user: user._id });

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
        // find info
        const info = await Info.findOne({ user: user._id });

        res.render('profile', {
            user: user,
            notifications: notifications,
            leave: leave,
            userLeave: userLeave,
            activities: activities,
            info: info,
            today: date
        });
    }
});

// FULL CALENDAR

app.get('/calendar', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    res.render('calendar', {
        user: user,
        notifications: notifications
    });
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
                selectedNames: '',
                // toast
                show: '',
                alert: ''
            });
        }
    })
    .post('/leave/request', isAuthenticated, async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        if (user) {
            const uuid = req.body.uuid;
            const type = req.body.type;
            const startDate = req.body.startDate;
            const returnDate = req.body.returnDate;
            const purpose = req.body.purpose;
            const selectedNames = req.body.selectedNames
                ? req.body.selectedNames.split(',')
                : [];

            console.log(uuid);

            // init to submit the leave req
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
            // find assignee
            const assignee = await User.find({ fullname: { $in: selectedNames } });

            // for home dashboard
            const leaveHome = await Leave.find({ user: user._id });
            const allUser = await User.find();
            const allLeave = await Leave.find();
            const allUserLeave = await UserLeave.find();
            const taskHome = await Task.find({ assignee: { $in: [user._id] } })
                .sort({ timestamp: -1 })
                .populate('assignee')
                .exec();
            const fileHome = await File.find();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const activitiesHome = await Activity.find({
                department: user.department,
                date: { $gte: sevenDaysAgo }
            })
                .populate({
                    path: 'user'
                })
                .sort({ date: -1 })
                .exec();
            const userDepartmentHome = await User.find({
                department: user.department,
                _id: { $ne: user._id }
            });
            const otherTaskHome = await Task.find({
                assignee: { $ne: [user._id] }
            });
            const otherActivitiesHome = await Activity.find();

            const newDate = {
                start: new Date(startDate),
                return: new Date(returnDate)
            };

            const today = new Date();

            const amountDayRequest = calculateBusinessDays(today, startDate);

            // Calculate the difference in hours between the two dates
            var numberOfDays = '';
            var timeDifference = '';
            var leaveBalance = '';
            var leaveTaken = '';
            var approvals = [];

            if (type === 'Annual Leave' || type === 'Sick Leave') {
                numberOfDays = calculateBusinessDays(startDate, returnDate);
            } else if (type === 'Half Day Leave') {
                numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
            } else if (type === 'Emergency Leave') {
                numberOfDays = calculateBusinessDays(startDate, today);
            } else if (
                type === 'Marriage Leave' ||
                type === 'Paternity Leave' ||
                type === 'Maternity Leave' ||
                type === 'Attend Exam Leave' ||
                type === 'Hajj Leave' ||
                type === 'Unpaid Leave' ||
                type === 'Special Leave' ||
                type === 'Extended Sick Leave'
            ) {
                timeDifference = returnDate.getTime() - startDate.getTime();
                // Convert milliseconds to days
                numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
            }

            // set approval based on role
            if (type === 'Annual Leave') {
                leaveBalance = userLeave.annual.leave - userLeave.annual.taken;

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {

                    if (amountDayRequest >= 3) {
                        console.log(numberOfDays);
                        console.log(
                            'Sufficient annual leave balance for the requested duration'
                        );

                        approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient annual leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient annual leave balance for the requested duration'
                    });
                }

            } else if (type === 'Half Day Leave') {
                leaveBalance = userLeave.annual.leave - userLeave.annual.taken;

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        console.log(numberOfDays);
                        console.log(
                            'Sufficient annual leave balance for the requested duration'
                        );

                        approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient sick leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient sick leave balance for the requested duration'
                    });
                }
            } else if (type === 'Sick Leave') {
                leaveBalance = userLeave.sick.leave - userLeave.sick.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for sick leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for sick leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient sick leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient sick leave balance for the requested duration'
                    });
                }
            } else if (type === 'Extended Sick Leave') {
                leaveBalance = userLeave.sickExtended.leave - userLeave.sickExtended.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for sick extended leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for sick extended leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient sick extended leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient sick leave balance for the requested duration'
                    });
                }
            } else if (type === 'Emergency Leave') {
                const findFile = await File.find({ uuid: uuid });

                if (0 <= numberOfDays <= 5) {
                    if (findFile.length > 0) {
                        approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                    } else {
                        console.log("There is no file attached for emergency leave");

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'Document attachment is required for emergency leave request'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient emergency leave days and leave taken reach maximum for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Exceed 3 days leave or reached maximum 7 times taken for the requested emergency leave'
                    });
                }
            } else if (type === 'Attend Exam Leave') {
                leaveBalance = userLeave.attendExam.leave - userLeave.attendExam.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for attend exam leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for attend exam leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient attend exam leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient attend exam leave balance for the requested duration'
                    });
                }
            } else if (type === 'Paternity Leave') {
                leaveBalance = userLeave.paternity.leave
                leaveTaken = userLeave.paternity.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0 && leaveTaken <= 6 && user.gender === 'Male') {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for paternity leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for paternity leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient paternity leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient paternity balance for the requested duration'
                    });
                }
            } else if (type === 'Maternity Leave') {
                leaveBalance = userLeave.maternity.leave;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0 && user.gender === 'Female') {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for maternity leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for maternity leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient maternity leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient maternity balance for the requested duration'
                    });
                }
            } else if (type === 'Marriage Leave') {
                leaveBalance = userLeave.marriage.leave
                leaveTaken = userLeave.marriage.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0 && leaveTaken <= 1) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for marriage leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for marriage leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient marriage leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient marriage balance for the requested duration'
                    });
                }
            } else if (type === 'Hajj Leave') {
                leaveBalance = userLeave.hajj.leave
                leaveTaken = userLeave.hajj.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0 && leaveTaken <= 1) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for paternity leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for paternity leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient paternity leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient paternity balance for the requested duration'
                    });
                }
            } else if (type === 'Special Leave') {
                leaveBalance = userLeave.special.leave
                leaveTaken = userLeave.special.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0 && leaveTaken <= 10) {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee);
                        } else {
                            console.log("There is no file attached for special leave!");

                            res.render('home', {
                                user: user,
                                notifications: notifications,
                                uuid: uuidv4(),
                                userDepartment: userDepartmentHome,
                                otherTasks: otherTaskHome,
                                otherActivities: otherActivitiesHome,
                                // all data
                                allUser: allUser,
                                allUserLeave: allUserLeave,
                                allLeave: allLeave,
                                userLeave: userLeave,
                                leave: leaveHome,
                                tasks: taskHome,
                                files: fileHome,
                                activities: activitiesHome,
                                selectedNames: '',
                                // toast
                                show: 'show',
                                alert:
                                    'Document attachment is required for special leave request'
                            });
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        res.render('home', {
                            user: user,
                            notifications: notifications,
                            uuid: uuidv4(),
                            userDepartment: userDepartmentHome,
                            otherTasks: otherTaskHome,
                            otherActivities: otherActivitiesHome,
                            // all data
                            allUser: allUser,
                            allUserLeave: allUserLeave,
                            allLeave: allLeave,
                            userLeave: userLeave,
                            leave: leaveHome,
                            tasks: taskHome,
                            files: fileHome,
                            activities: activitiesHome,
                            selectedNames: '',
                            // toast
                            show: 'show',
                            alert:
                                'The leave date applied must be more than 3 days from today'
                        });
                    }
                } else {
                    console.log(
                        'Insufficient special leave balance for the requested duration'
                    );

                    res.render('home', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        userDepartment: userDepartmentHome,
                        otherTasks: otherTaskHome,
                        otherActivities: otherActivitiesHome,
                        // all data
                        allUser: allUser,
                        allUserLeave: allUserLeave,
                        allLeave: allLeave,
                        userLeave: userLeave,
                        leave: leaveHome,
                        tasks: taskHome,
                        files: fileHome,
                        activities: activitiesHome,
                        selectedNames: '',
                        // toast
                        show: 'show',
                        alert:
                            'Insufficient special leave balance for the requested duration'
                    });
                }
            } else if (type === 'Unpaid Leave') {
                approvals = generateApprovals(user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR);
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
                fileId: uuid,
                user: user._id,
                grade: user.grade,
                assignee: assignee,
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
                uuid: uuidv4(),
                userDepartment: userDepartmentHome,
                otherTasks: otherTaskHome,
                otherActivities: otherActivitiesHome,
                // all data
                allUser: allUser,
                allUserLeave: allUserLeave,
                allLeave: allLeave,
                userLeave: userLeave,
                leave: leaveHome,
                tasks: taskHome,
                files: fileHome,
                activities: activitiesHome,
                selectedNames: '',
                // toast
                show: 'show',
                alert:
                    'Leave requested submitted, please wait it to be approved in 3 days'
            });

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
        const leave = await Leave.find({ user: user._id }).sort({
            'date.start': -1
        });
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
app.get('/leave/details/:id', isAuthenticated, async function (req, res) {
    const id = req.params.id;
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        const leave = await Leave.findOne({ _id: id });
        const approvals = leave.approvals;
        const userLeave = await UserLeave.findOne({ user: user._id });
        const userReq = await User.findOne({ _id: leave.user });

        //get amount of days leave requested
        const startDate = leave.date.start;
        const returnDate = leave.date.return;

        var timeDifference = '';
        var daysDifference = '';

        // Calculate the difference in hours between the two dates
        if (leave.type === 'Annual Leave' || leave.type === 'Sick Leave') {
            daysDifference = calculateBusinessDays(startDate, returnDate);
        } else if (leave.type === 'Emergency Leave') {
            daysDifference = calculateBusinessDays(startDate, returnDate);
        } else if (
            leave.type === 'Marriage Leave' ||
            leave.type === 'Paternity Leave' ||
            leave.type === 'Study Leave' ||
            leave.type === 'Hajj Leave' ||
            leave.type === 'Unpaid Leave' ||
            leave.type === 'Special Leave'
        ) {
            timeDifference = returnDate.getTime() - startDate.getTime();

            // Convert milliseconds to days
            daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1;
        }

        //find file from leave
        const file = await File.find({ uuid: leave.fileId });

        res.render('leave-details', {
            user: user,
            notifications: notifications,
            userReq: userReq,
            leave: leave,
            approvals: approvals,
            userLeave: userLeave,
            files: file,
            // data
            leaveDays: daysDifference
        });
    }
});

// APPROVE
app.get('/leave/:approval/:id', async function (req, res) {
    const approval = req.params.approval;
    const id = req.params.id;
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const checkLeave = await Leave.findOne({ _id: id });
        const indexOfRecipient = checkLeave.approvals.findIndex(approval =>
            approval.recipient.equals(user._id)
        );

        if (approval === 'approved') {
            const leave = await Leave.findOneAndUpdate(
                {
                    _id: id,
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

                    var timeDifference = '';
                    var daysDifference = '';

                    // Calculate the difference in hours between the two dates
                    if (type === 'Annual Leave' || type === 'Sick Leave') {
                        daysDifference = calculateBusinessDays(startDate, returnDate);
                    } else if (type === 'Half Day Leave') {
                        numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                    } else if (type === 'Emergency Leave') {
                        daysDifference = calculateBusinessDays(startDate, today);
                    } else if (
                        type === 'Marriage Leave' ||
                        type === 'Paternity Leave' ||
                        type === 'Maternity Leave' ||
                        type === 'Attend Exam Leave' ||
                        type === 'Hajj Leave' ||
                        type === 'Unpaid Leave' ||
                        type === 'Special Leave' ||
                        type === 'Extended Sick Leave'
                    ) {
                        timeDifference = returnDate.getTime() - startDate.getTime();
                        // Convert milliseconds to days
                        daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
                    }


                    switch (checkLeave.type) {
                        case 'Annual Leave':
                            userLeave.annual.taken += daysDifference;
                            userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                            break;

                        case 'Sick Leave':
                            userLeave.sick.taken += daysDifference;
                            userLeave.sick.taken = Math.max(0, userLeave.sick.taken);
                            break;

                        case 'Sick Extended Leave':
                            userLeave.sickExtended.taken += daysDifference;
                            userLeave.sickExtended.taken = Math.max(0, userLeave.sickExtended.taken);
                            break;

                        case 'Emergency Leave':
                            userLeave.annual.taken += daysDifference;
                            userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                            userLeave.emergency.taken += daysDifference;
                            userLeave.emergency.taken = Math.max(0, userLeave.emergency.taken);
                            break;

                        case 'Attend Exam Leave':
                            userLeave.attendExam.leave -= daysDifference;
                            userLeave.attendExam.leave = Math.max(0, userLeave.attendExam.leave);
                            userLeave.attendExam.taken = userLeave.attendExam.taken + 1;
                            break;

                        case 'Maternity Leave':
                            userLeave.maternity.leave -= daysDifference;
                            userLeave.maternity.leave = Math.max(0, userLeave.maternity.leave);
                            userLeave.maternity.taken = userLeave.maternity.taken + 1;
                            break;

                        case 'Paternity Leave':
                            userLeave.paternity.leave -= daysDifference;
                            userLeave.paternity.leave = Math.max(0, userLeave.paternity.leave);
                            userLeave.paternity.taken = userLeave.paternity.taken + 1;
                            break;

                        case 'Hajj Leave':
                            userLeave.hajj.taken = userLeave.hajj.taken + 1;
                            break;

                        case 'Unpaid Leave':
                            userLeave.unpaid.taken = userLeave.unpaid.taken + 1;
                            break;

                        case 'Special Leave':
                            userLeave.special.taken = userLeave.special.taken + 1;
                            break;

                        default:
                            break;
                    }

                    await userLeave.save();

                    await Leave.findOneAndUpdate(
                        {
                            _id: id
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
                        url: '/leave/details/' + id,
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
                    res.redirect('/leave/details/' + id);
                } else {
                    const nextIndex = indexOfRecipient + 1;
                    const nextApprovalRecipientId =
                        checkLeave.approvals[nextIndex].recipient;

                    // send noti
                    const newNotification = new Notification({
                        sender: user._id,
                        recipient: new mongoose.Types.ObjectId(nextApprovalRecipientId),
                        type: 'Leave',
                        url: '/leave/details/' + id,
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
                    res.redirect('/leave/details/' + id);
                }
            }
        } else if (approval === 'denied') {
            const leave = await Leave.findOneAndUpdate(
                {
                    _id: id,
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
                const firstRecipientId =
                    indexOfRecipient !== -1
                        ? checkLeave.approvals[indexOfRecipient].recipient
                        : null;

                const userLeave = await UserLeave.findOne({
                    user: firstRecipientId
                });

                var daysDifference = '';
                if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = calculateBusinessDays(startDate, returnDate);
                }

                switch (checkLeave.type) {
                    case 'Emergency Leave':
                        userLeave.unpaid.taken = userLeave.unpaid.taken + 1;
                        userLeave.emergency.taken += daysDifference;
                        userLeave.emergency.taken = Math.max(0, userLeave.emergency.taken);
                        break;

                    default:
                        break;
                }

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

                console.log('The leave has been approved');
                res.redirect('/leave/details/' + id);
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
        const chiefExec = await User.findOne({ isChiefExec: true });

        // Update the status of invalid leaves
        for (const leave of invalidLeaves) {
            const user = await User.findById(leave.user);

            // Check if the user is an admin
            if (user.isDeputyChiefExec) {
                leave.status = 'invalid';
                leave.approvals = leave.approvals.filter(
                    approval => approval.role === 'Staff'
                );

                leave.approvals.push(
                    {
                        recipient: chiefExec._id,
                        role: 'Chief Executive Officer',
                        status: 'pending',
                        comment: 'Leave request needs approval',
                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        timestamp: ''
                    },
                    {
                        recipient: adminHR._id,
                        role: 'Human Resource',
                        status: 'pending',
                        comment: 'Leave request needs approval',
                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                        timestamp: ''
                    }
                );

                await leave.save();
            } else {
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
                        estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        timestamp: ''
                    },
                    {
                        recipient: adminHR._id,
                        role: 'Human Resource',
                        status: 'pending',
                        comment: 'Leave request needs approval',
                        estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                        timestamp: ''
                    }
                );

                await leave.save();
            }
        }

        const pendingLeaves = await Leave.find({
            estimated: { $lte: currentDate.setDate(currentDate.getDate() + 3) },
            status: 'submitted'
        });

        // Update the status of pending leaves
        for (const pending of pendingLeaves) {
            pending.status = 'pending';
            await pending.save();
        }

        console.log('Invalid leaves updated:', invalidLeaves.length);
        console.log('Pending leaves updated:', pendingLeaves.length);
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
        const origin = reqFiles.body.origin;

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
                user: user._id,
                name: file.name,
                path: pathUpload,
                date: today,
                type: type,
                origin: origin,
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

// DELETE USING FILES ID
app.get('/files/delete/:id', async function (req, res) {
    const _id = req.params.id;

    const deleted = await File.findOneAndDelete({ _id: _id });

    if (deleted) {
        const filePath = __dirname + '/public/uploads/' + deleted.name;
        console.log('File selected is deleted!');
        await fs.unlink(filePath);

        res.redirect('/');
    } else {
        console.log('There must be something wrong in deleting the files!');
        res.redirect('/');
    }
});

// DELETE USING FILES UUID
app.get('/files/delete/cancel/:uuid', async function (req, res) {
    const uuid = req.params.uuid;

    const filesToDelete = await File.find({ uuid: uuid });
    const deletedFiles = await File.deleteMany({ uuid: uuid });

    if (deletedFiles.deletedCount > 0) {
        console.log(`${deletedFiles.deletedCount} files are deleted!`);

        for (const deletedFile of filesToDelete) {
            const filePath = __dirname + '/public/uploads/' + deletedFile.name;
            await fs.unlink(filePath);
        }

        res.redirect('/');
    } else {
        console.log('No files found or there was an error deleting files.');
        res.redirect('/');
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

// GET NUMBERS OF DAYS BETWEEN TWO DATES
calculateBusinessDays = function (startDateString, endDateString) {
    const start = new Date(startDateString);
    const end = new Date(endDateString);

    // Convert dates to Malaysia Time (UTC+8)
    start.setUTCHours(start.getUTCHours() + 8);
    end.setUTCHours(end.getUTCHours() + 8);

    // Ensure the dates are set to midnight to exclude time from the calculation
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const defaultPublicHolidays = ['2024-02-16', '2024-05-01', '2024-05-07'];
    const allPublicHolidays = defaultPublicHolidays;

    let count = 0;

    // Use '<' to include the end date in the calculation
    while (start < end) {
        const dayOfWeek = start.getUTCDay();

        // Check if the current day is a business day (Monday to Friday) and not a public holiday
        if (
            dayOfWeek >= 1 &&
            dayOfWeek <= 5 &&
            !isPublicHoliday(start, allPublicHolidays)
        ) {
            count++;
        }

        start.setUTCDate(start.getUTCDate() + 1);
    }

    return count + 1;
};

isPublicHoliday = function (date, publicHolidays) {
    const formattedDate = formatDate(date);

    return publicHolidays.some(holiday => holiday === formattedDate);
};

formatDate = function (date) {
    return date.toISOString().split('T')[0];
};

// GENERATES APPROVALS
generateApprovals = function (user, headOfSection, headOfDepartment, depChiefExec, chiefExec, adminHR, assignee) {
    let approvals;

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
                ...(assignee && assignee.length > 0
                    ? assignee.map(assigneeItem => ({
                        recipient: assigneeItem._id,
                        role: 'Temporary Replacement',
                        status: 'pending',
                        comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                        estimated: new Date(
                            Date.now() + 1 * 24 * 60 * 60 * 1000
                        ),
                        timestamp: ''
                    }))
                    : []),
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
                ...(assignee && assignee.length > 0
                    ? assignee.map(assigneeItem => ({
                        recipient: assigneeItem._id,
                        role: 'Temporary Replacement',
                        status: 'pending',
                        comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                        estimated: new Date(
                            Date.now() + 1 * 24 * 60 * 60 * 1000
                        ),
                        timestamp: ''
                    }))
                    : []),
                {
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
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
                    estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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
            ...(assignee && assignee.length > 0
                ? assignee.map(assigneeItem => ({
                    recipient: assigneeItem._id,
                    role: 'Temporary Replacement',
                    status: 'pending',
                    comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                }))
                : []),
            {
                recipient: headOfDepartment._id,
                role: 'Head of Department',
                status: 'pending',
                comment: 'Leave request needs approval',
                estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                timestamp: ''
            },
            {
                recipient: depChiefExec._id,
                role: 'Deputy Chief Executive Officer',
                status: 'pending',
                comment: 'Leave request needs approval',
                estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                timestamp: ''
            },
            {
                recipient: adminHR._id,
                role: 'Human Resource',
                status: 'pending',
                comment: 'Leave request needs to be reviewed',
                estimated: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
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
            ...(assignee && assignee.length > 0
                ? assignee.map(assigneeItem => ({
                    recipient: assigneeItem._id,
                    role: 'Temporary Replacement',
                    status: 'pending',
                    comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                }))
                : []),
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
                estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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
            ...(assignee && assignee.length > 0
                ? assignee.map(assigneeItem => ({
                    recipient: assigneeItem._id,
                    role: 'Temporary Replacement',
                    status: 'pending',
                    comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                    estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                }))
                : []),
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
                estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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
                ...(assignee && assignee.length > 0
                    ? assignee.map(assigneeItem => ({
                        recipient: assigneeItem._id,
                        role: 'Temporary Replacement',
                        status: 'pending',
                        comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                        estimated: new Date(
                            Date.now() + 1 * 24 * 60 * 60 * 1000
                        ),
                        timestamp: ''
                    }))
                    : []),
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
                    estimated: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                },
                {
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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
                ...(assignee && assignee.length > 0
                    ? assignee.map(assigneeItem => ({
                        recipient: assigneeItem._id,
                        role: 'Temporary Replacement',
                        status: 'pending',
                        comment: `Temporary replacement for leave by ${assigneeItem.fullname}`,
                        estimated: new Date(
                            Date.now() + 1 * 24 * 60 * 60 * 1000
                        ),
                        timestamp: ''
                    }))
                    : []),
                {
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
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
                    estimated: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    timestamp: ''
                }
            ];
        }
    }

    return approvals;
};

// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
