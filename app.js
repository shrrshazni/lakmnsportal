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
const moment = require('moment');
const path = require('path');
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { send } = require('process');
const fs = require('fs').promises;
const qr = require('qrcode');
const { timeStamp, time } = require('console');
const { type } = require('os');
// const twilio = require('twilio');

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

// Attendance Database
const attendanceDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/attendance'
);

// SCHEMA INITIALIZATION

// FOR USER DATABASE

// USER
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    nric: { type: String },
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
    children: { type: Number, default: 0 },
    isChiefExec: { type: Boolean, default: false },
    isDeputyChiefExec: { type: Boolean, default: false },
    isHeadOfDepartment: { type: Boolean, default: false },
    isHeadOfSection: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isOfficer: { type: Boolean, default: false },
    isManagement: { type: Boolean, default: false },
    isPersonalAssistant: { type: Boolean, default: false },
    isNonOfficeHour: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
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
    status: { type: String },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date }
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
    department: { type: String },
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

// ATTENDANCE
const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['sign in', 'sign out', 'manual add', 'event', 'meeting', 'invalid'],
        default: 'invalid'
    },
    date: {
        signInTime: {
            type: Date,
            default: null
        },
        signOutTime: {
            type: Date,
            default: null
        }
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Invalid', 'Leave'],
        default: 'Present'
    },
    timestamp: { type: Date, default: null }
});

const TempAttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['sign in', 'sign out', 'manual add', 'event', 'meeting', 'invalid'],
        default: 'invalid'
    },
    timestamp: { type: Date }
});

const qrCodeSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
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
const Attendance = attendanceDatabase.model('Attendance', AttendanceSchema);
const TempAttendance = attendanceDatabase.model(
    'TempAttendance',
    TempAttendanceSchema
);
const QRCode = attendanceDatabase.model('QRCode', qrCodeSchema);

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

// PHONE TRANSPORTER
// const accountSid = "ACafc8b0a422560f0091b2855b4482326a";
// const authToken = "4e7acc459aaed9ecf0fd426308f89e61";
// const client = twilio(accountSid, authToken);
// const verifySid = "VAfe5663f4ddd898cce9936534b3abf99a";

// BASIC USER PART

// HOME
app.get('/', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    const allUser = await User.find().sort({ timestamp: -1 });
    const allLeave = await Leave.find().sort({ timestamp: -1 });
    const allUserLeave = await UserLeave.find().sort({ timestamp: -1 });
    const allInfo = await Info.find();
    const userLeave = await UserLeave.findOne({ user: user._id })
        .populate('user')
        .exec();
    const leave = await Leave.find({ user: user._id });
    const task = await Task.find({ assignee: { $in: [user._id] } })
        .sort({ timestamp: -1 })
        .populate('assignee')
        .exec();
    const file = await File.find();
    const info = await Info.findOne({ user: user._id });

    // find activities one week ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const otherTask = await Task.find({ assignee: { $ne: [user._id] } });
    const otherActivities = await Activity.find();

    // find staff on leave today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();

    // Calculate the first date of the week (Monday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + 1);

    // Calculate the last date of the week (Sunday)
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() + (7 - dayOfWeek));

    // Calculate the first day of the month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);

    // Calculate the last day of the month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    let todayLeaves = [];
    let weekLeaves = [];
    let monthLeaves = [];
    let staffOnLeave = [];

    if (user.isAdmin || user.isChiefExec || user.isDeputyChiefExec) {
        staffOnLeave = await Leave.find({
            status: 'approved'
        });

        staffOnLeave.forEach(leave => {
            if (isDateInRange(leave.date.start, leave.date.return)) {
                todayLeaves.push(leave);
            }

            if (
                leave.date.start <= lastDayOfWeek &&
                leave.date.return >= firstDayOfWeek
            ) {
                weekLeaves.push(leave);
            }

            if (
                leave.date.start <= lastDayOfMonth &&
                leave.date.return >= firstDayOfMonth
            ) {
                monthLeaves.push(leave);
            }
        });
    } else {
        staffOnLeave = await Leave.find({
            status: 'approved',
            department: user.department
        });

        staffOnLeave.forEach(leave => {
            if (isDateInRange(leave.date.start, leave.date.return)) {
                todayLeaves.push(leave);
            }

            if (
                leave.date.start <= lastDayOfWeek &&
                leave.date.return >= firstDayOfWeek
            ) {
                weekLeaves.push(leave);
            }

            if (
                leave.date.start <= lastDayOfMonth &&
                leave.date.return >= firstDayOfMonth
            ) {
                monthLeaves.push(leave);
            }
        });
    }

    let userTeamMembers = '';

    if (user.isChiefExec || user.isDeputyChiefExec) {
        userTeamMembers = await User.find({
            isManagement: true,
            _id: { $ne: user._id }
        });
    } else {
        if (user.isHeadOfDepartment) {
            userTeamMembers = await User.find({
                department: user.department,
                _id: { $ne: user._id }
            });
        } else {
            userTeamMembers = await User.find({
                section: user.section,
                _id: { $ne: user._id }
            });
        }
    }

    const activities = await Activity.find({
        date: { $gte: sevenDaysAgo }
    })
        .populate({
            path: 'user'
        })
        .sort({ date: -1 })
        .exec();

    // leave approvals
    let filteredApprovalLeaves;

    if (user.isAdmin) {
        // If the user is an admin, show all leave approvals except for 'approved' and 'denied'
        filteredApprovalLeaves = allLeave.filter(
            leave => leave.status !== 'approved' && leave.status !== 'denied'
        );
    } else {
        // If the user is not an admin, show leave approvals based on your existing logic
        filteredApprovalLeaves = allLeave.filter(leave => {
            return (
                leave.user.toString() !== user._id.toString() &&
                leave.approvals.some(
                    approval =>
                        approval.recipient.toString() === user._id.toString() &&
                        leave.status !== 'approved' &&
                        leave.status !== 'denied'
                )
            );
        });
    }

    const uniqueDepartments = new Set();
    const uniqueSection = new Set();

    allUser.forEach(user => {
        if (user.department) {
            uniqueDepartments.add(user.department);
        }
    });

    allUser.forEach(user => {
        if (user.section) {
            uniqueSection.add(user.section);
        }
    });

    const departments = Array.from(uniqueDepartments);
    const sections = Array.from(uniqueSection);

    if (user) {
        res.render('home', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            userTeamMembers: userTeamMembers,
            otherTasks: otherTask,
            otherActivities: otherActivities,
            todayLeaves: todayLeaves,
            weekLeaves: weekLeaves,
            monthLeaves: monthLeaves,
            filteredApprovalLeaves: filteredApprovalLeaves,
            departments: departments,
            sections: sections,
            // all data
            allUser: allUser,
            allUserLeave: allUserLeave,
            allLeave: allLeave,
            allInfo: allInfo,
            userLeave: userLeave,
            leave: leave,
            tasks: task,
            files: file,
            activities: activities,
            selectedNames: '',
            info: info,
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
        const userLeave = await UserLeave.findOne({ user: id })
            .populate('user')
            .exec();

        if (!userLeave) {
            return res.status(404).json({ error: 'User leave data not found' });
        }
        res.json(userLeave);
    }
);

app.get('/api/leave/selectedmonth', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        try {
            const selectedMonth = req.query.month;

            // Determine the start and end dates of the selected month
            const startOfMonth = moment(`${selectedMonth} 1, 2024`, 'MMMM D, YYYY');
            const endOfMonth = startOfMonth.clone().endOf('month');

            // Retrieve leave records for the selected month
            const leaveRecords = await Leave.find({
                'date.start': {
                    $gte: startOfMonth.toDate(),
                    $lt: endOfMonth.toDate()
                }
            });

            // Initialize count object for each day
            const leaveCounts = {};

            // Iterate through each day of the month
            for (let day = 1; day <= endOfMonth.date(); day++) {
                leaveCounts[day] = { approved: 0, denied: 0 };

                // Check if there are leave records for the current day
                const recordsForDay = leaveRecords.filter(
                    record => moment(record.date.start).date() === day
                );

                // Count approved and denied leaves for the current day
                recordsForDay.forEach(record => {
                    const status = record.status;

                    if (status === 'approved') {
                        leaveCounts[day].approved++;
                    } else if (status === 'denied') {
                        leaveCounts[day].denied++;
                    }
                });
            }

            res.json(leaveCounts);
        } catch (error) {
            console.error('Error fetching leave data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/leave/totalcount', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        try {
            const selectedMonth = req.query.month;

            // Determine the start and end dates of the selected month
            const startOfMonth = moment(`${selectedMonth} 1, 2024`, 'MMMM D, YYYY');
            const endOfMonth = startOfMonth.clone().endOf('month');

            // Retrieve leave records for the selected month with 'approved' status
            const leaveRecords = await Leave.find({
                'date.start': {
                    $gte: startOfMonth.toDate(),
                    $lt: endOfMonth.toDate()
                },
                status: 'approved'
            });

            // Calculate the total approved leave count
            const totalApprovedLeave = leaveRecords.length;

            // Return the result
            res.json({ totalLeaveCount: totalApprovedLeave });
        } catch (error) {
            console.error('Error fetching total leave count:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get(
    '/api/leave/pending-invalid',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
            const currentDate = new Date();
            const sevenDaysAgo = new Date(currentDate);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Assuming 'Leave' is your Mongoose model
            const leaveData = await Leave.find({
                'date.start': {
                    $gte: sevenDaysAgo,
                    $lte: currentDate
                }
            }).select('date.start status invalid');

            // Create an object to store counts for each date
            const dateCounts = {};

            // Initialize counts for all dates in the range
            let currentDatePointer = new Date(sevenDaysAgo);
            while (currentDatePointer <= currentDate) {
                const formattedDate = currentDatePointer.toISOString().split('T')[0];
                dateCounts[formattedDate] = { pending: 0, invalid: 0, percentage: 0 };
                currentDatePointer.setDate(currentDatePointer.getDate() + 1);
            }

            // Process the retrieved data
            leaveData.forEach(entry => {
                const formattedDate = entry.date.start.toISOString().split('T')[0];

                // Update counts for the date
                dateCounts[formattedDate].pending += entry.status === 'pending' ? 1 : 0;
                dateCounts[formattedDate].invalid += entry.status === 'invalid' ? 1 : 0;
            });

            // Calculate percentage for each date
            Object.keys(dateCounts).forEach(date => {
                const total = dateCounts[date].pending + dateCounts[date].invalid;
                dateCounts[date].percentage =
                    total > 0 ? (dateCounts[date].pending / total) * 100 : 0;
            });

            let totalPending = 0;
            let totalInvalid = 0;

            Object.keys(dateCounts).forEach(date => {
                totalPending += dateCounts[date].pending;
                totalInvalid += dateCounts[date].invalid;
            });

            const totalPercentagePending =
                totalPending + totalInvalid > 0
                    ? (totalPending / (totalPending + totalInvalid)) * 100
                    : 0;
            const totalPercentageInvalid = 100 - totalPercentagePending;

            // find previous 7 days

            const fourteenDaysAgo = new Date(currentDate);
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const leaveDataPrevious7Days = await Leave.find({
                'date.start': {
                    $gte: fourteenDaysAgo,
                    $lt: sevenDaysAgo
                }
            }).select('date.start status invalid');

            const dateCountsPrevious7Days = {};

            let currentDatePointerPrevious7Days = new Date(fourteenDaysAgo);
            while (currentDatePointerPrevious7Days < sevenDaysAgo) {
                const formattedDate = currentDatePointerPrevious7Days
                    .toISOString()
                    .split('T')[0];
                dateCountsPrevious7Days[formattedDate] = {
                    pending: 0,
                    invalid: 0,
                    percentage: 0
                };
                currentDatePointerPrevious7Days.setDate(
                    currentDatePointerPrevious7Days.getDate() + 1
                );
            }

            leaveDataPrevious7Days.forEach(entry => {
                const formattedDate = entry.date.start.toISOString().split('T')[0];

                if (!dateCountsPrevious7Days[formattedDate]) {
                    dateCountsPrevious7Days[formattedDate] = {
                        pending: 0,
                        invalid: 0,
                        percentage: 0
                    };
                }

                // Update counts for the date
                dateCountsPrevious7Days[formattedDate].pending +=
                    entry.status === 'pending' ? 1 : 0;
                dateCountsPrevious7Days[formattedDate].invalid +=
                    entry.status === 'invalid' ? 1 : 0;
            });

            Object.keys(dateCountsPrevious7Days).forEach(date => {
                const total =
                    dateCountsPrevious7Days[date].pending +
                    dateCountsPrevious7Days[date].invalid;
                dateCountsPrevious7Days[date].percentage =
                    total > 0 ? (dateCountsPrevious7Days[date].pending / total) * 100 : 0;
            });

            let totalPendingPrevious7Days = 0;
            let totalInvalidPrevious7Days = 0;

            Object.keys(dateCountsPrevious7Days).forEach(date => {
                totalPendingPrevious7Days += dateCountsPrevious7Days[date].pending;
                totalInvalidPrevious7Days += dateCountsPrevious7Days[date].invalid;
            });

            const totalPercentagePendingPrevious7Days =
                totalPendingPrevious7Days + totalInvalidPrevious7Days > 0
                    ? (totalPendingPrevious7Days /
                        (totalPendingPrevious7Days + totalInvalidPrevious7Days)) *
                    100
                    : 0;

            const differencePending =
                totalPercentagePending - totalPercentagePendingPrevious7Days;

            const formattedDifferencePending =
                (differencePending >= 0 ? '+' : '-') +
                Math.abs(differencePending).toFixed(2);

            const responseData = {
                dateCounts,
                totalPercentagePending,
                totalPercentageInvalid,
                totalPending,
                formattedDifferencePending
            };

            res.json(responseData);
        }
    }
);

app.get('/api/leave/submmitted', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        try {
            const currentDate = new Date();
            const fourteenDaysAgo = new Date(currentDate);
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const sevenDaysAgo = new Date(currentDate);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Assuming 'Leave' is your Mongoose model
            const leaveDataLast14Days = await Leave.find({
                timestamp: {
                    $gte: fourteenDaysAgo,
                    $lte: sevenDaysAgo
                },
                status: 'submitted'
            });

            const leaveDataLast7Days = await Leave.find({
                timestamp: {
                    $gte: sevenDaysAgo,
                    $lte: currentDate
                },
                status: 'submitted'
            });

            // Create an object to store submitted counts for each day
            const submittedCountsLast14Days = {};
            const submittedCountsLast7Days = {};

            // Initialize counts for all dates in the range
            let currentDatePointerLast14Days = new Date(fourteenDaysAgo);
            let currentDatePointerLast7Days = new Date(sevenDaysAgo);

            while (currentDatePointerLast14Days <= currentDate) {
                const formattedDate = currentDatePointerLast14Days
                    .toISOString()
                    .split('T')[0];
                submittedCountsLast14Days[formattedDate] = 0;
                currentDatePointerLast14Days.setDate(
                    currentDatePointerLast14Days.getDate() + 1
                );
            }

            while (currentDatePointerLast7Days <= currentDate) {
                const formattedDate = currentDatePointerLast7Days
                    .toISOString()
                    .split('T')[0];
                submittedCountsLast7Days[formattedDate] = 0;
                currentDatePointerLast7Days.setDate(
                    currentDatePointerLast7Days.getDate() + 1
                );
            }

            // Process the retrieved data for the last 14 days
            leaveDataLast14Days.forEach(entry => {
                // Assuming 'timestamp' is a valid field in your Leave model
                const formattedDate = new Date(entry.timestamp)
                    .toISOString()
                    .split('T')[0];

                // Update submitted counts for the date
                submittedCountsLast14Days[formattedDate]++;
            });

            // Process the retrieved data for the last 7 days
            leaveDataLast7Days.forEach(entry => {
                // Assuming 'timestamp' is a valid field in your Leave model
                const formattedDate = new Date(entry.timestamp)
                    .toISOString()
                    .split('T')[0];

                // Update submitted counts for the date
                submittedCountsLast7Days[formattedDate]++;
            });

            const totalSubmittedLast14Days = leaveDataLast14Days.length;
            const totalSubmitted = leaveDataLast7Days.length;
            const totalPercentageLast7 =
                (totalSubmitted / (totalSubmitted + totalSubmittedLast14Days)) * 100;
            const totalPercentageLast14 =
                (totalSubmittedLast14Days /
                    (totalSubmitted + totalSubmittedLast14Days)) *
                100;
            const differencePercentage = totalPercentageLast7 - totalPercentageLast14;
            const formattedDifference =
                totalSubmitted > 0
                    ? (differencePercentage >= 0 ? '+' : '-') +
                    Math.abs(differencePercentage).toFixed(2)
                    : 0 + '%';

            // Create a single JSON object to send as the response
            const responseDataSubmittedCountsLast7Days = {
                submittedCountsLast7Days,
                totalSubmitted,
                formattedDifference
            };

            res.json(responseDataSubmittedCountsLast7Days);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/leave/status', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const currentDate = new Date();
        const sevenDaysAgo = new Date(currentDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Assuming 'Leave' is your Mongoose model
        const leaveDataLast7Days = await Leave.find({
            timestamp: {
                $gte: sevenDaysAgo,
                $lte: currentDate
            }
        }).select('status');

        // Initialize counts for each status
        let submittedCount = 0;
        let pendingCount = 0;
        let invalidCount = 0;
        let deniedCount = 0;
        let approvedCount = 0;

        // Process the retrieved data for the last 7 days
        leaveDataLast7Days.forEach(entry => {
            switch (entry.status) {
                case 'submitted':
                    submittedCount++;
                    break;
                case 'pending':
                    pendingCount++;
                    break;
                case 'invalid':
                    invalidCount++;
                    break;
                case 'denied':
                    deniedCount++;
                    break;
                case 'approved':
                    approvedCount++;
                    break;
            }
        });

        // Calculate percentages
        const totalLeaves = leaveDataLast7Days.length;
        const percentageSubmitted =
            totalLeaves > 0 ? ((submittedCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentagePending =
            totalLeaves > 0 ? ((pendingCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageInvalid =
            totalLeaves > 0 ? ((invalidCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageDenied =
            totalLeaves > 0 ? ((deniedCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageApproved =
            totalLeaves > 0 ? ((approvedCount / totalLeaves) * 100).toFixed(0) : 0;

        // Create a single JSON object to send as the response
        const responseDataLast7Days = {
            percentageSubmitted,
            percentagePending,
            percentageInvalid,
            percentageDenied,
            percentageApproved,
            totalLeaves
        };

        // Respond with the data
        res.json(responseDataLast7Days);
    }
});

app.get(
    '/api/staff/overview/department-section',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
            const allUser = await User.find();

            // Create Sets to store unique departments and sections
            const uniqueDepartments = new Set();
            const uniqueSections = new Set();

            // Iterate through the users and add their departments and sections to the sets
            allUser.forEach(user => {
                if (user.department) {
                    uniqueDepartments.add(user.department);
                }

                if (user.section) {
                    uniqueSections.add(user.section);
                }
            });

            // Convert Sets to Arrays
            const departments = Array.from(uniqueDepartments);
            const sections = Array.from(uniqueSections);

            // Create objects to store user counts for each department and section
            const userCountByDepartment = {};
            const userCountBySection = {};

            // Initialize counts to zero for each department and section
            departments.forEach(department => {
                userCountByDepartment[department] = 0;
            });

            sections.forEach(section => {
                userCountBySection[section] = 0;
            });

            // Update counts based on user data
            allUser.forEach(user => {
                if (user.department) {
                    userCountByDepartment[user.department]++;
                }

                if (user.section) {
                    userCountBySection[user.section]++;
                }
            });

            const responseData = {
                userCountByDepartment,
                userCountBySection
            };

            res.json(responseData);
        }
    }
);

// STAFF DETAILS

app.get('/staff/details/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    const id = req.params.id;
    const otherUser = await User.findOne({ _id: id });

    const task = await Task.find({ assignee: { $in: [otherUser._id] } })
        .populate('assignee')
        .exec();
    const file = await File.find();
    const allUser = await User.find();
    const info = await Info.findOne({ user: otherUser._id });

    const leave = await Leave.find({
        user: otherUser._id,
        status: { $nin: ['denied', 'cancelled'] }
    }).sort({ timestamp: -1 });
    const activities = await Activity.find({ user: otherUser._id }).sort({
        date: -1
    });
    const attendance = await Attendance.find({ user: otherUser._id }).sort({
        timestamp: -1
    });

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
            leave: leave,
            attendance: attendance,
            info: info
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
app.get(
    '/search/staff/assignee-relief',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const query = req.query.query;

        try {
            let results;
            if (query && query.trim() !== '') {
                if (user.isChiefExec) {
                    const deputyChiefExecQuery = {
                        isDeputyChiefExec: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    const managementQuery = {
                        isManagement: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    const personalAssistant = {
                        isPersonalAssistant: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    results = await User.find({
                        $or: [deputyChiefExecQuery, managementQuery, personalAssistant]
                    });
                } else if (user.isDeputyChiefExec) {
                    const managementQuery = {
                        isManagement: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    const personalAssistant = {
                        isPersonalAssistant: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    const headOfDepartment = {
                        isHeadOfDepartment: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    results = await User.find({
                        $or: [headOfDepartment, managementQuery, personalAssistant]
                    });
                } else if (user.isHeadOfDepartment) {
                    results = await User.find({
                        department: user.department,
                        fullname: { $regex: query, $options: 'i' }
                    });
                } else if (user.isPersonalAssistant) {
                    const departmentQuery = {
                        department: user.department,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    const personalAssistant = {
                        isPersonalAssistant: true,
                        fullname: { $regex: query, $options: 'i' }
                    };

                    results = await User.find({
                        $or: [departmentQuery, personalAssistant]
                    });
                } else {
                    results = await User.find({
                        section: user.section,
                        fullname: { $regex: query, $options: 'i' }
                    });
                }
            } else if (user.isAdmin) {
                const departmentQuery = {
                    department: user.department,
                    fullname: { $regex: query, $options: 'i' }
                };

                const admin = {
                    isAdmin: true,
                    fullname: { $regex: query, $options: 'i' }
                };

                results = await User.find({
                    $or: [departmentQuery, admin]
                });
            } else {
                results = [];
            }

            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    }
);

// LANDINGPAGE
app.get('/landing', async function (req, res) {
    res.render('landing-page');
});

// AUTH

//SIGNUP
app
    .get('/sign-up', function (req, res) {
        res.render('sign-up', {
            show: '',
            alert: ''
        });
    })
    .post('/sign-up', function (req, res) {
        // Check if the required fields are present in the request body
        if (
            !req.body.fullname ||
            !req.body.username ||
            !req.body.email ||
            !req.body.password ||
            !req.body.position ||
            !req.body.grade ||
            !req.body.department ||
            !req.body.gender
        ) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const newUser = new User({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            nric: '',
            phone: '',
            profile: '',
            age: 0,
            address: '',
            dateEmployed: '1974-07-04T00:00:00.000+00:00',
            birthdate: '1974-07-04T00:00:00.000+00:00',
            department: req.body.department,
            section: req.body.section,
            gender: req.body.gender,
            grade: req.body.grade,
            position: req.body.position,
            education: '',
            marital: 'single',
            classification: req.body.class,
            isChiefExec: false,
            isDeputyChiefExec: false,
            isHeadOfDepartment: false,
            isHeadOfSection: false,
            isAdmin: false,
            isManagement: false
        });

        User.register(newUser, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.render('sign-up', {
                    show: 'show',
                    alert: 'Sign up unsuccessful'
                });
            } else {
                const newUserLeave = new UserLeave({
                    user: user._id,
                    annual: { leave: 14, taken: 0 },
                    sick: { leave: 14, taken: 0 },
                    sickExtended: { leave: 60, taken: 0 },
                    emergency: { leave: 0, taken: 0 },
                    paternity: { leave: 3, taken: 0 },
                    maternity: { leave: 60, taken: 0 },
                    bereavement: { leave: 3, taken: 0 },
                    study: { leave: 3, taken: 0 },
                    marriage: { leave: 3, taken: 0 },
                    attendExam: { leave: 5, taken: 0 },
                    hajj: { leave: 40, taken: 0 },
                    unpaid: { taken: 0 },
                    special: { leave: 3, taken: 0 }
                });
                newUserLeave.save();

                passport.authenticate('local')(req, res, function () {
                    res.render('sign-up', {
                        show: 'show',
                        alert: 'Sign up successful'
                    });
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

                const updateInfo = await Info.findOneAndUpdate(
                    {
                        user: user._id
                    },
                    {
                        isOnline: true,
                        lastSeen: new Date()
                    },
                    {
                        new: true
                    }
                );

                if (updateInfo) {
                    console.log('Is online at ' + new Date());
                } else {
                    console.log('Failed to update');
                }
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

app
    .get('/forgot-password', async function (req, res) {
        res.render('forgot-password', {
            show: '',
            alert: ''
        });
    })
    .post('/forgot-password', async function (req, res) {
        const email = req.body.email;
        const checkEmail = await User.findOne({ email: email });

        const randomUUID = uuidv4();
        const randomAlphaNumeric = randomUUID
            .replace(/-/g, '')
            .substring(0, 5)
            .toUpperCase();

        const style = `
    <style>
    body.bg-dark {
      background-color: #343a40!important;
    }

    .mb-4 {
      margin-bottom: 1.5rem!important;
    }

    .mt-4 {
      margin-top: 1.5rem!important;
    }

    .d-flex {
      display: flex!important;
    }

    .justify-content-center {
      justify-content: center!important;
    }

    .text-light {
      color: #f8f9fa!important;
    }

    .container {
      width: 100%;
      padding-right: 20vw;
      padding-left: 20vw;
      margin-right: auto;
      margin-left: auto;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      word-wrap: break-word;
      background-color: #fff;
      background-clip: border-box;
      border: 1px solid rgba(0, 0, 0, 0.125);
      border-radius: .25rem;
    }

    .mb-5 {
      margin-bottom: 3rem!important;
    }

    .p-5 {
      padding: 3.125rem!important;
    }

    .text-center {
      text-align: center!important;
    }

    .mb-3 {
      margin-bottom: 1rem!important;
    }

    .fst-italic {
      font-style: italic!important;
    }

    .fw-bold {
      font-weight: bold!important;
    }

    .fst-underline {
      text-decoration: underline!important;
    }

    .fa-brands {
      font-family: "Font Awesome 5 Brands"!important;
    }

    .fa-facebook,
    .fa-linkedin-in {
      font-size: 2rem!important;
    }

    .list-unstyled {
      padding-left: 0;
      list-style: none;
    }

    .list-unstyled>a {
      text-decoration: none;
      color: inherit;
    }

    .border-end {
      border-right: 1px solid rgba(0, 0, 0, 0.125);
    }

    .border-dashed {
      border-style: dashed!important;
    }

    .gap-3 {
      gap: 1rem!important;
    }

    .pe-xl-5,
    .pe-xxl-8 {
      padding-right: 3.125rem!important;
    }

    .w-75 {
      width: 75%!important;
    }

    .w-md-100 {
      width: 100%!important;
    }

    .mx-auto {
      margin-right: auto!important;
      margin-left: auto!important;
    }

    .d-flex.align-items-center {
      display: flex;
      align-items: center!important;
    }

    .justify-content-center {
      justify-content: center!important;
    }

    .text-white {
      color: #fff!important;
    }

    .border-top {
      border-top: 1px solid rgba(0, 0, 0, 0.125)!important;
    }

    .d-sm-flex {
      display: flex!important;
    }

    .text-body-tertiary {
      color: #6c757d!important;
    }

    .mb-0 {
      margin-bottom: 0!important;
    }
    </style> `;

        if (checkEmail) {
            let mailOptions = {
                from: 'shrrshazni@gmail.com',
                to: checkEmail.email,
                subject: 'lakmnsportal - Reset Password',
                html: `
            <html>

            <head>
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

              ${style}
              
            </head>
            
            <body class="bg-dark">
            
              <div class="mb-4 mt-4 d-flex justify-content-center">
                <img src="" alt="">
                <h3 style="color: orange;">lakmns<span class="text-light">portal</span></h3>
              </div>
            
              <div class="container" style="padding: 0 20vw 0 20vw;">
            
                <div class="card mb-5" style="min-height: 30vh;">
                  <div class="card-body p-5">
                    <p>Dear <span class="fw-bold fst-italic">${checkEmail.fullname}</span>,</p>
                    <p class="mb-5">Here is the code needed for you to reset your password later and please keep it safe. Click the link <span class="fw-bold fst-italic fst-underline"><a href="http://localhost:5002/reset-password/${checkEmail._id}/${randomAlphaNumeric}">HERE</a></span> to reset your password.</p>
            
                    <h1 class="text-center mb-5">${randomAlphaNumeric}</h1>
            
                    <p class="mb-3">
                      When a user requests a password reset via email, the system sends a message containing a link or instructions to reset their forgotten password. This process typically involves verifying the user's identity through security questions or a confirmation email.
                      Once verified, users can create a new password, ensuring secure access to their account while maintaining confidentiality.
                    </p>
            
                    <p class="mb-5">You can always change your username or password later in your User Settings. Learn more about our recent changes to usernames in our support article.</p>
            
                    <p class="mb-3">Thank you.</p>
            
                    <p class="mb-3 fst-italic">lakmnsportal</p>
            
                  </div>
                </div>
            
                <div class="row gx-xxl-8 gy-5 align-items-center mb-5">
                  <div class="col-xl-auto flex-1">
                    <ul class="list-unstyled d-flex justify-content-center flex-wrap mb-0 border-end border-dashed gap-3 pe-xl-5 pe-xxl-8 w-75 w-md-100 mx-auto">
                      <li><a class="" href="">Contact us</a></li>
                      <li><a class="" href="">Newsroom</a></li>
                      <li><a class="" href="">Opportunities</a></li>
                      <li><a class="" href="">Support</a></li>
                      <li><a class="" href="">FAQ</a></li>
                    </ul>
                  </div>
                  <div class="col-xl-auto">
                    <div class="d-flex align-items-center justify-content-center gap-5"><a class="text-white" href="#!"> <span class="fa-brands fa-facebook" style="font-size: 2rem;"></span></a><a class="text-white" href="#!"> <span class="fa-brands fa-linkedin-in" style="font-size: 2rem;"></span></a></div>
                  </div>
                </div>
                <hr class="border-top" />
                <div class="d-sm-flex flex-between-center text-center">
                  <p class="text-body-tertiary mb-0">Copyright © LAKMNS</p>
                  <p class="text-body-tertiary mb-0">Made by <a href="#">LAKMNS PROTECH</a></p>
                </div>
            
              </div>

              <script src="https://kit.fontawesome.com/d0a7e80aad.js" crossorigin="anonymous"></script>
              <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
            
            </body>
            
            
            
            </html>
            `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);

                    res.render('forgot-password', {
                        show: 'show',
                        alert:
                            'The email you submitted is invalid or does not belong to any user in our web app.'
                    });
                }

                console.log('Message %s sent: %s', info.messageId, info.response);
            });

            res.render('forgot-password', {
                show: 'show',
                alert:
                    'We have seen reset password link and 5 digit code to your email, please do check it.'
            });
        } else {
        }
    });

// SIGNOUT
app.get('/sign-out/:id', async function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });

    const user = await User.findOne({ _id: req.params.id });

    const updateInfo = await Info.findOneAndUpdate(
        {
            user: user._id
        },
        {
            isOnline: false,
            lastSeen: new Date()
        },
        {
            new: true
        }
    );

    if (updateInfo) {
        console.log('Is online at ' + new Date());
    } else {
        console.log('Failed to update');
    }
});

// PROFILE
app.get('/profile', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });
    const userLeave = await UserLeave.find({ user: user._id });
    const leave = await Leave.find({
        user: user._id,
        status: { $nin: ['denied', 'cancelled'] }
    }).sort({ timestamp: -1 });
    const activities = await Activity.find({ user: user._id }).sort({ date: -1 });
    const allUser = await User.find();
    const file = await File.find({ type: { $ne: 'leave' } }).sort({ date: -1 });
    const attendance = await Attendance.find({ user: user._id }).sort({
        timestamp: -1
    });

    console.log(attendance);

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
            today: date,
            allUser: allUser,
            files: file,
            attendance: attendance
        });
    }
});

// SETTINGS
app
    .get('/settings', isAuthenticated, async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });
        const info = await Info.findOne({ user: user._id });

        if (user) {
            res.render('settings', {
                user: user,
                uuid: uuidv4(),
                notifications: notifications,
                info: info,
                show: '',
                alert: ''
            });
        }
    })
    .post('/settings', isAuthenticated, async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });
        const info = await Info.findOne({ user: user._id });

        if (user) {
            if (
                (req.body.oldPassword === '' &&
                    req.body.newPassword === '' &&
                    req.body.newPassword2 === '') ||
                (req.body.oldPassword === undefined &&
                    req.body.newPassword === undefined &&
                    req.body.newPassword2 === undefined)
            ) {
                const updateFields = {};

                // Add fields from req.body to the updateFields object if they are present
                if (req.body.officenumber) {
                    updateFields.officenumber = req.body.officenumber;
                }
                if (req.body.email) {
                    updateFields.email = req.body.email;
                }
                if (req.body.phone) {
                    updateFields.phone = req.body.phone;
                }
                if (req.body.dateEmployed) {
                    updateFields.dateEmployed = new Date(req.body.dateEmployed);
                }
                if (req.body.birthdate) {
                    updateFields.birthdate = new Date(req.body.birthdate);
                }
                if (req.body.nric) {
                    updateFields.nric = req.body.nric;
                }
                if (
                    req.body.marital &&
                    req.body.marital !== 'Select your marital status'
                ) {
                    updateFields.marital = req.body.marital;
                }
                if (
                    req.body.education &&
                    req.body.education !== 'Select your highest education'
                ) {
                    updateFields.education = req.body.education;
                }
                if (req.body.address) {
                    updateFields.address = req.body.address;
                }
                if (req.body.children) {
                    updateFields.children = parseInt(req.body.children);
                }

                if (Object.keys(updateFields).length === 0) {
                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert: 'Update unsuccessful, there no any input to be updated'
                    });
                } else {
                    let updateUser = '';

                    if (updateFields.phone !== '') {
                        updateUser = await User.findOneAndUpdate(
                            {
                                _id: user._id
                            },
                            {
                                $set: updateFields
                            },
                            { new: true }
                        );

                        await Info.findOneAndUpdate(
                            {
                                user: user._id
                            },
                            {
                                phoneVerified: false
                            },
                            {
                                new: true
                            }
                        );
                    } else if (updateFields.email !== '') {
                        updateUser = await User.findOneAndUpdate(
                            {
                                _id: user._id
                            },
                            {
                                $set: updateFields
                            },
                            { new: true }
                        );

                        await Info.findOneAndUpdate(
                            {
                                user: user._id
                            },
                            {
                                emailVerified: false
                            },
                            {
                                new: true
                            }
                        );
                    } else {
                        updateUser = await User.findOneAndUpdate(
                            {
                                _id: user._id
                            },
                            {
                                $set: updateFields
                            },
                            { new: true }
                        );
                    }

                    if (updateUser) {
                        console.log('Update successful');
                        res.render('settings', {
                            user: user,
                            uuid: uuidv4(),
                            notifications: notifications,
                            info: info,
                            show: 'show',
                            alert:
                                'Update sucessful on basic or personal information, please do check your profile to see the changes'
                        });
                    }
                }
            } else {
                const isPasswordValid = await user.authenticate(req.body.oldPassword);
                const newPasswordMatch = req.body.newPassword === req.body.newPassword2;

                if (isPasswordValid.user === false) {
                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert:
                            'Update unsuccessful, maybe you entered a wrong current password'
                    });
                } else if (newPasswordMatch === false) {
                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert:
                            'Update unsuccessful, new password and confirm pasword are not match'
                    });
                } else {
                    await user.setPassword(req.body.newPassword);
                    const updatePassword = await user.save();

                    if (updatePassword) {
                        res.render('settings', {
                            user: user,
                            uuid: uuidv4(),
                            notifications: notifications,
                            info: info,
                            show: 'show',
                            alert: 'Update successful on new password, you can use it onwards'
                        });
                    }
                }
            }
        }
    });

app.post(
    '/settings/upload/profile-image',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.find({ username: username });

        if (user) {
            if (!req.files || Object.keys(req.files).length === 0) {
                console.log('There is no files selected');

                res.redirect('/settings');
            } else {
                console.log('There are files try to be uploaded');

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

                    await User.findOneAndUpdate(
                        {
                            username: username
                        },
                        {
                            profile: pathUpload
                        },
                        { upsert: true, new: true }
                    );
                }

                console.log('Done upload files!');

                res.redirect('/settings');
            }
        }
    }
);

app.get('/info/:type/:method/:id', async function (req, res) {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });
    const info = await Info.findOne({ user: user._id });

    if (user) {
        var type = req.params.type;
        var method = req.params.method;

        if (type === 'email' && method === 'verification') {
            let mailOptions = {
                from: 'shrrshazni@gmail.com',
                to: user.email,
                subject: 'lakmnsportal - Email Verification',
                html: `
                  <html>
                    <head>
                      <style>
                        body {
                          font-family: 'Arial', sans-serif;
                          background-color: #f4f4f4;
                          color: #333;
                        }
                        p {
                          margin-bottom: 20px;
                        }
                        a {
                          color: #3498db;
                        }
                      </style>
                    </head>
                    <body>
                      <h1>Leave Request</h1>
                      <p>Please click here to confirm your email to be verified, <a href="http://localhost:5002/info/email/confirm/${user._id}">lakmnsportal</a></p>
                    </body>
                  </html>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);

                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert: 'The email you submitted here is invalid'
                    });
                }

                console.log('Message %s sent: %s', info.messageId, info.response);
            });

            res.render('settings', {
                user: user,
                uuid: uuidv4(),
                notifications: notifications,
                info: info,
                show: 'show',
                alert: 'We already send email verification towards your email'
            });
        } else if (type === 'email' && method === 'confirm') {
            const updateEmail = await Info.findOneAndUpdate(
                {
                    user: user._id
                },
                {
                    emailVerified: true
                },
                { upsert: true, new: true }
            );

            if (updateEmail) {
                console.log('Email is verified');
                res.redirect('/');
            } else {
                console.log('There is error');
                res.redirect('/');
            }
        }
        // else if (type === 'phone' && method === 'verification') {
        //     const tac = generateTAC();
        //     const phone = '+6' + user.phone;

        //     await client.messages.create({
        //         body: `Your TAC is: ${tac}`,
        //         from: 'YOUR_TWILIO_PHONE_NUMBER',
        //         to: phone
        //     });
        // }
    }
});

// FULL CALENDAR

app.get('/calendar', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

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
            const userLeave = await UserLeave.findOne({ user: user._id })
                .populate('user')
                .exec();

            res.render('leave-request', {
                user: user,
                uuid: uuidv4(),
                notifications: notifications,
                leave: currentLeave,
                userLeave: userLeave,
                selectedNames: '',
                // data
                type: '',
                startDate: '',
                returnDate: '',
                purpose: '',
                // validation
                validationType: '',
                validationStartDate: '',
                validationReturnDate: '',
                validitionPurpose: '',
                startDateFeedback: 'Please select a start date',
                returnDateFeedback: 'Please select a return date',
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
                isHeadOfSection: true,
                section: 'Administration and Human Resource Management Division'
            });
            const userLeave = await UserLeave.findOne({ user: user._id })
                .populate('user')
                .exec();
            // find assignee
            const assignee = await User.find({ fullname: { $in: selectedNames } });
            // leave for the user
            const leave = await Leave.find({ user: user._id });

            console.log(adminHR);

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

            let renderDataError = {};

            // set approval based on role
            if (type === 'Annual Leave') {
                leaveBalance = userLeave.annual.leave - userLeave.annual.taken;

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        console.log(numberOfDays);
                        console.log(
                            'Sufficient annual leave balance for the requested duration'
                        );

                        approvals = generateApprovals(
                            user,
                            headOfSection,
                            headOfDepartment,
                            depChiefExec,
                            chiefExec,
                            adminHR,
                            assignee,
                            type
                        );
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient annual leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient sick leave balance for the requested duration';
                }
            } else if (type === 'Half Day Leave') {
                leaveBalance = userLeave.annual.leave - userLeave.annual.taken;

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        console.log(numberOfDays);
                        console.log(
                            'Sufficient annual leave balance for the requested duration'
                        );

                        approvals = generateApprovals(
                            user,
                            headOfSection,
                            headOfDepartment,
                            depChiefExec,
                            chiefExec,
                            adminHR,
                            assignee,
                            type
                        );
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient annual leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient annual leave balance for the requested duration';
                }
            } else if (type === 'Sick Leave') {
                leaveBalance = userLeave.sick.leave - userLeave.sick.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 0) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log(
                                'The leave request must attached with suporting documents'
                            );

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'The leave request must attached with suporting documents';
                        }
                    } else {
                        console.log(
                            'The sick leave request date must be applied today onwards'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The sick leave request must be applied today onwards';
                    }
                } else {
                    console.log(
                        'Insufficient sick leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient sick leave balance for the requested duration';
                }
            } else if (type === 'Extended Sick Leave') {
                leaveBalance =
                    userLeave.sickExtended.leave - userLeave.sickExtended.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 0) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for sick extended leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'Insufficient sick leave balance for the requested duration';
                        }
                    } else {
                        console.log('The leave date applied must be from today onwards');

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be from today onwards';
                    }
                } else {
                    console.log(
                        'Insufficient extended sick leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient extended sick leave balance for the requested duration';
                }
            } else if (type === 'Emergency Leave') {
                const findFile = await File.find({ uuid: uuid });

                if (numberOfDays >= 0) {
                    if (findFile.length > 0) {
                        approvals = generateApprovals(
                            user,
                            headOfSection,
                            headOfDepartment,
                            depChiefExec,
                            chiefExec,
                            adminHR,
                            assignee,
                            type
                        );
                    } else {
                        console.log('There is no file attached');

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'Supporting documents must be attached accordingly';
                    }
                } else {
                    console.log('There is an error in requesting the emergency leave');

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'There is an error in requesting the emergency leave';
                }
            } else if (type === 'Attend Exam Leave') {
                leaveBalance = userLeave.attendExam.leave - userLeave.attendExam.taken;
                const findFile = await File.find({ uuid: uuid });

                if (leaveBalance >= numberOfDays && numberOfDays > 0) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for attend exam leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for attend exam leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient extended sick leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient attend exam leave balance for the requested duration';
                }
            } else if (type === 'Paternity Leave') {
                leaveBalance = userLeave.paternity.leave;
                leaveTaken = userLeave.paternity.taken;
                const findFile = await File.find({ uuid: uuid });

                if (
                    leaveBalance >= numberOfDays &&
                    numberOfDays > 0 &&
                    leaveTaken <= 6 &&
                    user.gender === 'Male'
                ) {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for paternity leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for paternity leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient extended sick leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient paternity leave balance for the requested duration and taken maximum up to 6 for only male staff';
                }
            } else if (type === 'Maternity Leave') {
                leaveBalance = userLeave.maternity.leave;
                const findFile = await File.find({ uuid: uuid });

                if (
                    leaveBalance >= numberOfDays &&
                    numberOfDays > 0 &&
                    user.gender === 'Female'
                ) {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for maternity leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for maternity leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 1 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 1 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient extended sick leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient maternity leave balance for the requested duration for only female staff';
                }
            } else if (type === 'Marriage Leave') {
                leaveBalance = userLeave.marriage.leave;
                leaveTaken = userLeave.marriage.taken;
                const findFile = await File.find({ uuid: uuid });

                if (
                    leaveBalance >= numberOfDays &&
                    numberOfDays > 0 &&
                    leaveTaken <= 1
                ) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for marriage leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for marriage leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient marriage balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient marriage balance for the requested duration with maximum taken up to 1 only';
                }
            } else if (type === 'Hajj Leave') {
                leaveBalance = userLeave.hajj.leave;
                leaveTaken = userLeave.hajj.taken;
                const findFile = await File.find({ uuid: uuid });

                if (
                    leaveBalance >= numberOfDays &&
                    numberOfDays > 0 &&
                    leaveTaken <= 1
                ) {
                    if (amountDayRequest >= 3) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for hajj leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for hajj leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 3 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 3 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient marriage balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient hajj leave balance for the requested duration with maximum taken up to 1 only';
                }
            } else if (type === 'Special Leave') {
                leaveBalance = userLeave.special.leave;
                leaveTaken = userLeave.special.taken;
                const findFile = await File.find({ uuid: uuid });

                if (
                    leaveBalance >= numberOfDays &&
                    numberOfDays > 0 &&
                    leaveTaken <= 10
                ) {
                    if (amountDayRequest >= 1) {
                        if (findFile.length > 0) {
                            approvals = generateApprovals(
                                user,
                                headOfSection,
                                headOfDepartment,
                                depChiefExec,
                                chiefExec,
                                adminHR,
                                assignee,
                                type
                            );
                        } else {
                            console.log('There is no file attached for special leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for special leave!';
                        }
                    } else {
                        console.log(
                            'The leave date applied must be more than 1 days from today'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The leave date applied must be more than 1 days from today';
                    }
                } else {
                    console.log(
                        'Insufficient special leave balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient special leave balance for the requested duration with maximum taken up to 10 only';
                }
            } else if (type === 'Unpaid Leave') {
                approvals = generateApprovals(
                    user,
                    headOfSection,
                    headOfDepartment,
                    depChiefExec,
                    chiefExec,
                    adminHR,
                    type
                );
            }

            if (approvals.length === 0) {
                console.log('Leave request requirements have not met');

                const filesToDelete = await File.find({ uuid: uuid });
                const deletedFiles = await File.deleteMany({ uuid: uuid });

                if (deletedFiles.deletedCount > 0) {
                    console.log(`${deletedFiles.deletedCount} files are deleted!`);

                    for (const deletedFile of filesToDelete) {
                        const filePath = __dirname + '/public/uploads/' + deletedFile.name;
                        await fs.unlink(filePath);
                    }

                    res.render('leave-request', {
                        user: user,
                        uuid: uuid,
                        notifications: notifications,
                        leave: leave,
                        userLeave: userLeave,
                        selectedNames: '',
                        // data
                        type: type,
                        startDate: startDate,
                        returnDate: returnDate,
                        purpose: purpose,
                        // validation
                        validationType: '',
                        validationStartDate: 'is-invalid',
                        validationReturnDate: 'is-invalid',
                        validationPurpose: '',
                        startDateFeedback: 'Please enter a valid start date',
                        returnDateFeedback: 'Please select valid return date',
                        // toast
                        show: renderDataError.show,
                        alert: renderDataError.alert
                    });
                } else {
                    res.render('leave-request', {
                        user: user,
                        uuid: uuid,
                        notifications: notifications,
                        leave: leave,
                        userLeave: userLeave,
                        selectedNames: '',
                        // data
                        type: type,
                        startDate: startDate,
                        returnDate: returnDate,
                        purpose: purpose,
                        // validation
                        validationType: '',
                        validationStartDate: '',
                        validationReturnDate: '',
                        validationPurpose: '',
                        startDateFeedback: 'Please select a start date',
                        returnDateFeedback: 'Please select a return date',
                        // toast
                        show: renderDataError.show,
                        alert: renderDataError.alert
                    });
                }
            } else {
                const adminUsers = await User.find({
                    isAdmin: true,
                    section: 'Administration and Human Resource Management Division',
                    _id: { $ne: adminHR._id }
                });

                // Push the IDs of admin users to sendNoti
                adminUsers.forEach(user => {
                    if (!sendNoti.includes(user._id)) {
                        sendNoti.push(user._id);
                    }
                });

                let i = 0;
                // set user id to be send
                for (const approval of approvals) {
                    const recipientId = approval.recipient;

                    if (i > 0) {
                        // Add the recipientId to the sendNoti array if not already present
                        if (!sendNoti.includes(recipientId)) {
                            sendNoti.push(recipientId);
                        }
                    }

                    // Fetch the user by recipient ID
                    const email = await User.findById(recipientId);

                    // Check if the user is found and has an email
                    if (email && user.email) {
                        // Add the user's email to sendEmail
                        sendEmail.push(email.email);
                    }

                    i++;
                }

                console.log(sendNoti);

                const leave = new Leave({
                    fileId: uuid,
                    user: user._id,
                    department: user.department,
                    grade: user.grade,
                    assignee: assignee,
                    type: type,
                    date: newDate,
                    status: 'submitted',
                    purpose: purpose,
                    approvals: approvals
                });

                const currentLeave = await Leave.create(leave);
                console.log('Leave request submitted');

                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: new Date(),
                    title: 'Submitted a leave application',
                    type: 'Leave request',
                    description:
                        user.fullname +
                        ' has submitted ' +
                        type +
                        ' between ' +
                        startDate +
                        ' and ' +
                        returnDate
                });

                activityUser.save();

                console.log('New acitivity submitted', activityUser);

                // notifications save has been turn off
                if (sendNoti.length > 0) {
                    for (const recipientId of sendNoti) {
                        const newNotification = new Notification({
                            sender: user._id,
                            recipient: new mongoose.Types.ObjectId(recipientId),
                            type: 'Leave request',
                            url: '/leave/details/' + currentLeave._id,
                            message: 'Leave request needs approval.'
                        });

                        newNotification.save();
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

                // for home dashboard
                const allUser = await User.find().sort({ timestamp: -1 });
                const allLeave = await Leave.find().sort({ timestamp: -1 });
                const allUserLeave = await UserLeave.find().sort({ timestamp: -1 });
                const allInfo = await Info.find();
                const taskHome = await Task.find({ assignee: { $in: [user._id] } })
                    .sort({ timestamp: -1 })
                    .populate('assignee')
                    .exec();
                const fileHome = await File.find();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const otherTaskHome = await Task.find({
                    assignee: { $ne: [user._id] }
                });
                const otherActivitiesHome = await Activity.find();
                const info = await Info.findOne({ user: user._id });

                // find staff on leave today
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dayOfWeek = today.getDay();

                // Calculate the first date of the week (Monday)
                const firstDayOfWeek = new Date(today);
                firstDayOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + 1);

                // Calculate the last date of the week (Sunday)
                const lastDayOfWeek = new Date(today);
                lastDayOfWeek.setDate(today.getDate() + (7 - dayOfWeek));

                // Calculate the first day of the month
                const firstDayOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    2
                );

                // Calculate the last day of the month
                const lastDayOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                );
                lastDayOfMonth.setHours(23, 59, 59, 999);

                let todayLeaves = [];
                let weekLeaves = [];
                let monthLeaves = [];
                let staffOnLeave = '';

                if (user.isAdmin || user.isChiefExec || user.isDeputyChiefExec) {
                    staffOnLeave = await Leave.find({
                        user: { $ne: user._id },
                        status: 'approved'
                    });

                    staffOnLeave = await Leave.find({
                        status: 'approved',
                        user: { $ne: user._id },
                        department: user.department
                    });

                    staffOnLeave.forEach(leave => {
                        if (leave.date.start >= today && today <= leave.date.return) {
                            todayLeaves.push(leave);
                        }

                        if (
                            leave.date.start <= lastDayOfWeek &&
                            leave.date.return >= firstDayOfWeek
                        ) {
                            weekLeaves.push(leave);
                        }

                        if (
                            leave.date.start <= lastDayOfMonth &&
                            leave.date.return >= firstDayOfMonth
                        ) {
                            monthLeaves.push(leave);
                        }
                    });
                } else {
                    staffOnLeave = await Leave.find({
                        status: 'approved',
                        user: { $ne: user._id },
                        department: user.department
                    });

                    staffOnLeave.forEach(leave => {
                        if (leave.date.start >= today && today <= leave.date.return) {
                            todayLeaves.push(leave);
                        }

                        if (
                            leave.date.start <= lastDayOfWeek &&
                            leave.date.return >= firstDayOfWeek
                        ) {
                            weekLeaves.push(leave);
                        }

                        if (
                            leave.date.start <= lastDayOfMonth &&
                            leave.date.return >= firstDayOfMonth
                        ) {
                            monthLeaves.push(leave);
                        }
                    });
                }
                let userTeamMembers = '';

                if (user.isChiefExec || user.isDeputyChiefExec) {
                    userTeamMembers = await User.find({
                        isManagement: true,
                        _id: { $ne: user._id }
                    });
                } else {
                    if (user.isHeadOfDepartment) {
                        userTeamMembers = await User.find({
                            department: user.department,
                            _id: { $ne: user._id }
                        });
                    } else {
                        userTeamMembers = await User.find({
                            section: user.section,
                            _id: { $ne: user._id }
                        });
                    }
                }

                const activitiesHome = await Activity.find({
                    date: { $gte: sevenDaysAgo }
                })
                    .populate({
                        path: 'user'
                    })
                    .sort({ date: -1 })
                    .exec();

                // leave approvals
                let filteredApprovalLeaves;

                if (user.isAdmin) {
                    // If the user is an admin, show all leave approvals except for 'approved' and 'denied'
                    filteredApprovalLeaves = allLeave.filter(
                        leave => leave.status !== 'approved' && leave.status !== 'denied'
                    );
                } else {
                    // If the user is not an admin, show leave approvals based on your existing logic
                    filteredApprovalLeaves = allLeave.filter(leave => {
                        return (
                            leave.user.toString() !== user._id.toString() &&
                            leave.approvals.some(
                                approval =>
                                    approval.recipient.toString() === user._id.toString() &&
                                    leave.status !== 'approved' &&
                                    leave.status !== 'denied'
                            )
                        );
                    });
                }

                const uniqueDepartments = new Set();
                const uniqueSection = new Set();

                allUser.forEach(user => {
                    if (user.department) {
                        uniqueDepartments.add(user.department);
                    }
                });

                allUser.forEach(user => {
                    if (user.section) {
                        uniqueSection.add(user.section);
                    }
                });

                const departments = Array.from(uniqueDepartments);
                const sections = Array.from(uniqueSection);

                const renderDataSuccess = {
                    user: user,
                    uuid: uuidv4(),
                    notifications: notifications,
                    userTeamMembers: userTeamMembers,
                    otherTasks: otherTaskHome,
                    otherActivities: otherActivitiesHome,
                    staffOnLeave: staffOnLeave,
                    todayLeaves: todayLeaves,
                    weekLeaves: weekLeaves,
                    monthLeaves: monthLeaves,
                    filteredApprovalLeaves: filteredApprovalLeaves,
                    departments: departments,
                    sections: sections,
                    // all data
                    allUser: allUser,
                    allUserLeave: allUserLeave,
                    allLeave: allLeave,
                    allInfo: allInfo,
                    userLeave: userLeave,
                    leave: leave,
                    tasks: taskHome,
                    files: fileHome,
                    info: info,
                    activities: activitiesHome,
                    selectedNames: '',
                    show: 'show',
                    alert:
                        'Leave request submitted, please wait for approval 3 days from now'
                };

                res.render('home', renderDataSuccess);
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
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const leave = await Leave.find({ user: user._id }).sort({
            'date.start': -1
        });
        const userLeave = await UserLeave.findOne({ user: user._id })
            .populate('user')
            .exec();

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
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    const leave = await Leave.findOne({ _id: id });

    if (user && leave) {
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
            approvals: leave.approvals,
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
        const humanResourceIndex = checkLeave.approvals.findIndex(
            approval => approval.role === 'Human Resource'
        );

        console.log(checkLeave.approvals[humanResourceIndex].recipient);

        if (approval === 'approved') {
            await Leave.findOneAndUpdate(
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

            const nextIndex = indexOfRecipient + 1;
            const nextApprovalRecipientId = checkLeave.approvals[nextIndex].recipient;

            // send noti
            const newNotification = new Notification({
                sender: user._id,
                recipient: new mongoose.Types.ObjectId(nextApprovalRecipientId),
                type: 'Leave',
                url: '/leave/details/' + id,
                message:
                    'Previous approval has been submitted, please do check the leave request for approval'
            });

            newNotification.save();

            // activity
            const activityUser = new Activity({
                user: user._id,
                date: new Date(),
                title: 'Leave application approved',
                type: 'Leave request',
                description: 'Approved a leave request'
            });

            activityUser.save();

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

                // notifications save has been turn off
                if (sendNoti.length > 0) {
                    for (const recipientId of sendNoti) {
                        const newNotification = new Notification({
                            sender: user._id,
                            recipient: new mongoose.Types.ObjectId(recipientId),
                            type: 'Leave',
                            url: '/leave/details/' + id,
                            message: 'Leave request has been denied.'
                        });

                        // newNotification.save();
                    }

                    console.log('Done send notifications!');
                }

                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: new Date(),
                    title: 'Leave application denied',
                    type: 'Leave request',
                    description: 'Denied a leave request'
                });

                activityUser.save();

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
        } else if (approval === 'cancelled') {
            if (checkLeave.status === 'approved') {
                const userLeave = await UserLeave.findOne({
                    user: firstRecipientId
                });

                const startDate = checkLeave.date.start;
                const returnDate = checkLeave.date.return;

                var timeDifference = '';
                var daysDifference = '';

                // Calculate the difference in hours between the two dates
                if (
                    checkLeave.type === 'Annual Leave' ||
                    checkLeave.type === 'Sick Leave'
                ) {
                    daysDifference = calculateBusinessDays(startDate, returnDate);
                } else if (checkLeave.type === 'Half Day Leave') {
                    numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = calculateBusinessDays(startDate, today);
                } else if (
                    checkLeave.type === 'Marriage Leave' ||
                    checkLeave.type === 'Paternity Leave' ||
                    checkLeave.type === 'Maternity Leave' ||
                    checkLeave.type === 'Attend Exam Leave' ||
                    checkLeave.type === 'Hajj Leave' ||
                    checkLeave.type === 'Unpaid Leave' ||
                    checkLeave.type === 'Special Leave' ||
                    checkLeave.type === 'Extended Sick Leave'
                ) {
                    timeDifference = returnDate.getTime() - startDate.getTime();
                    // Convert milliseconds to days
                    daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
                }

                switch (checkLeave.type) {
                    case 'Annual Leave':
                        userLeave.annual.taken -= daysDifference;
                        userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                        break;

                    case 'Sick Leave':
                        userLeave.sick.taken -= daysDifference;
                        userLeave.sick.taken = Math.max(0, userLeave.sick.taken);
                        break;

                    case 'Sick Extended Leave':
                        userLeave.sickExtended.taken -= daysDifference;
                        userLeave.sickExtended.taken = Math.max(
                            0,
                            userLeave.sickExtended.taken
                        );
                        break;

                    case 'Emergency Leave':
                        userLeave.annual.taken -= daysDifference;
                        userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                        userLeave.emergency.taken -= daysDifference;
                        userLeave.emergency.taken = Math.max(0, userLeave.emergency.taken);
                        break;

                    case 'Attend Exam Leave':
                        userLeave.attendExam.leave += daysDifference;
                        userLeave.attendExam.leave = Math.max(
                            0,
                            userLeave.attendExam.leave
                        );
                        userLeave.attendExam.taken = userLeave.attendExam.taken - 1;
                        break;

                    case 'Maternity Leave':
                        userLeave.maternity.leave += daysDifference;
                        userLeave.maternity.leave = Math.max(0, userLeave.maternity.leave);
                        userLeave.maternity.taken = userLeave.maternity.taken - 1;
                        break;

                    case 'Paternity Leave':
                        userLeave.paternity.leave += daysDifference;
                        userLeave.paternity.leave = Math.max(0, userLeave.paternity.leave);
                        userLeave.paternity.taken = userLeave.paternity.taken - 1;
                        break;

                    case 'Hajj Leave':
                        userLeave.hajj.taken = userLeave.hajj.taken - 1;
                        break;

                    case 'Unpaid Leave':
                        userLeave.unpaid.taken = userLeave.unpaid.taken - 1;
                        break;

                    case 'Special Leave':
                        userLeave.special.taken = userLeave.special.taken - 1;
                        break;

                    default:
                        break;
                }

                await userLeave.save();
            }

            await Leave.findOneAndUpdate(
                {
                    _id: id
                },
                {
                    $set: {
                        status: 'cancelled',
                        comment:
                            'The request has been cancelled by the ' +
                            checkLeave.approvals[indexOfRecipient].role
                    }
                },
                { new: true }
            );

            const firstRecipientId = checkLeave.approvals[0].recipient;
            const lastRecipientId =
                checkLeave.approvals[checkLeave.approvals.length - 1].recipient;

            // send noti
            const newNotification1 = new Notification({
                sender: user._id,
                recipient: new mongoose.Types.ObjectId(firstRecipientId),
                type: 'Leave approval',
                url: '/leave/details/' + id,
                message: 'This leave has been cancelled by ' + user.fullname
            });

            // send noti
            const newNotification2 = new Notification({
                sender: user._id,
                recipient: new mongoose.Types.ObjectId(lastRecipientId),
                type: 'Leave approval',
                url: '/leave/details/' + id,
                message: 'This leave has been cancelled by ' + user.fullname
            });

            newNotification1.save();
            newNotification2.save();

            // activity
            const activityUser = new Activity({
                user: user._id,
                date: new Date(),
                title: 'Leave cancelled',
                type: 'Leave approval',
                description: 'Cancel the leave request'
            });

            activityUser.save();

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

            console.log('The leave has been officially cancelled');
            res.redirect('/leave/details/' + id);
        } else if (approval === 'acknowledged') {
            if (
                checkLeave.approvals[humanResourceIndex - 1].status === 'approved' &&
                user.isAdmin
            ) {
                const findrecipient = await Leave.findOneAndUpdate(
                    {
                        _id: id,
                        'approvals.recipient':
                            checkLeave.approvals[humanResourceIndex].recipient
                    },
                    {
                        $set: {
                            'approvals.$.status': 'approved',
                            'approvals.$.comment':
                                'The request have been officially approved',
                            'approvals.$.timestamp': new Date()
                        }
                    },
                    { new: true }
                );

                if (findrecipient) {
                    console.log('The recipient has been updated', findrecipient);
                } else {
                    console.log('There is no update here');
                }

                const firstRecipientId = checkLeave.approvals[0].recipient;

                const userLeave = await UserLeave.findOne({
                    user: firstRecipientId
                });

                const startDate = checkLeave.date.start;
                const returnDate = checkLeave.date.return;

                var timeDifference = '';
                var daysDifference = '';

                // Calculate the difference in hours between the two dates
                if (
                    checkLeave.type === 'Annual Leave' ||
                    checkLeave.type === 'Sick Leave'
                ) {
                    daysDifference = calculateBusinessDays(startDate, returnDate);
                } else if (checkLeave.type === 'Half Day Leave') {
                    numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = calculateBusinessDays(startDate, today);
                } else if (
                    checkLeave.type === 'Marriage Leave' ||
                    checkLeave.type === 'Paternity Leave' ||
                    checkLeave.type === 'Maternity Leave' ||
                    checkLeave.type === 'Attend Exam Leave' ||
                    checkLeave.type === 'Hajj Leave' ||
                    checkLeave.type === 'Unpaid Leave' ||
                    checkLeave.type === 'Special Leave' ||
                    checkLeave.type === 'Extended Sick Leave'
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
                        userLeave.sickExtended.taken = Math.max(
                            0,
                            userLeave.sickExtended.taken
                        );
                        break;

                    case 'Emergency Leave':
                        userLeave.annual.taken += daysDifference;
                        userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                        userLeave.emergency.taken += daysDifference;
                        userLeave.emergency.taken = Math.max(0, userLeave.emergency.taken);
                        break;

                    case 'Attend Exam Leave':
                        userLeave.attendExam.leave -= daysDifference;
                        userLeave.attendExam.leave = Math.max(
                            0,
                            userLeave.attendExam.leave
                        );
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

                newNotification.save();

                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: new Date(),
                    title: 'Leave application approved',
                    type: 'Leave request',
                    description: 'Approved a leave request'
                });

                activityUser.save();

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
            } else {
                console.log('The user is not an admin');
            }

            res.redirect('/leave/details/' + id);
        }
    }
});

// Function to update attendance
const updateAttendance = async () => {
    try {
        const now = new Date();
        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
        );
        const todayEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59
        );

        // Find all attendance records for today with signOutTime as null
        const attendanceRecords = await Attendance.find({
            'date.signInTime': { $gte: todayStart, $lt: todayEnd },
            'date.signOutTime': null
        });

        // Update status to 'Absent' for records without signOutTime
        for (let record of attendanceRecords) {
            record.status = 'Invalid';
            await record.save();
        }

        console.log('Attendance updated at 5 PM');
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
};

// Function to check leave on attendance
const updateAttendanceForApprovedLeaves = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find leave requests with status 'approved' and return date of today
        const approvedLeaves = await Leave.find({
            status: 'approved',
            'date.start': {
                $gte: today
            },
            'date.return': {
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Today's end
            }
        });

        console.log(approvedLeaves);

        for (const leave of approvedLeaves) {
            await Attendance.findOneAndUpdate(
                {
                    user: leave.user,
                    timestamp: {
                        $gte: today, // Greater than or equal to the start of today
                        $lte: new Date() // Less than the current time
                    }
                },
                {
                    $set: {
                        status: 'Leave',
                        type: 'manual add',
                        timestamp: new Date()
                    }
                },
                { upsert: true, new: true }
            );
        }

        console.log('Attendance records updated for leaves approved today');
    } catch (error) {
        console.error('Error updating attendance records:', error);
    }
};

// Function to check and update attendance absent
const updateAbsentAttendance = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all users
        const allUsers = await User.find();

        // Create new attendance records marking them as absent
        for (const user of allUsers) {
            const newAttendance = new Attendance({
                user: user._id,
                type: 'invalid',
                signInTime: null,
                signOutTime: null,
                status: 'Absent',
                timestamp: new Date()
            });

            await newAttendance.save();
        }

        console.log('Attendance records created for all users as absent');
    } catch (error) {
        console.error('Error creating attendance records for absent users:', error);
    }
};

// Function to delete all qr codes data
const clearQRCodeData = async () => {
    try {
        // Delete all documents in the QRCode collection
        const result = await QRCode.deleteMany({});
        console.log(
            `Deleted ${result.deletedCount} documents from the QRCode collection`
        );

        const tempAttendance = await TempAttendance.deleteMany({});

        console.log(
            `Deleted ${tempAttendance.deletedCount} documents from the temporary attendance`
        );
    } catch (error) {
        console.error('Error clearing QRCode data:', error);
    }
};

// SCHEDULER

// CHECK EACH LEAVE VALIDITY
cron.schedule(
    '0 0 * * *',
    async () => {
        // Find leave records with date.start timestamp less than or equal to 3 days from now
        const currentDate = new Date();
        const invalidLeaves = await Leave.find({
            timestamp: { $lte: currentDate.setDate(currentDate.getDate() - 3) },
            status: 'pending'
        });

        console.log(invalidLeaves);

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

// CHECK USER SESSION MAXAGE
cron.schedule(
    '0 * * * *', // Runs every hour
    () => {
        store.all((error, sessions) => {
            if (error) {
                console.error('Error retrieving sessions:', error);
                return;
            }

            // Iterate through each session
            sessions.forEach(async session => {
                // Extract relevant session data

                const sessionUser = session.session.passport.user;

                // Check if session has expired
                const currentTime = Date.now();
                const sessionExpirationTime = new Date(session.expires).getTime();
                if (currentTime > sessionExpirationTime) {
                    try {
                        // Set user's isOnline to false
                        await Info.findOneAndUpdate({ sessionUser }, { isOnline: false });
                        console.log(`User ${sessionUser} is now offline`);
                    } catch (updateError) {
                        console.error(`Error updating user ${sessionUser}:`, updateError);
                    }
                }
            });
            console.log('Session check complete');
        });
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

// UPDATE ATTENDANCE AT 8AM
cron.schedule(
    '0 8 * * *',
    () => {
        console.log('Running cron job to update attendance at 8AM');
        updateAbsentAttendance();
        updateAttendanceForApprovedLeaves();
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

// UPDATE ATTENDANCE TO INVALID AT 5PM
cron.schedule(
    '0 17 * * *',
    () => {
        console.log('Running cron job to update attendance');
        updateAttendance();
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

// CLEAR QR CODE ID FOR TODAY
cron.schedule(
    '0 0 * * *',
    () => {
        console.log('Clear qr code save for today');
        clearQRCodeData();
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

// NOTIFICATIONS
app.get('/notifications/history', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    // find notification based on date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Set to the first day of the week (Sunday)
    firstDayOfWeek.setHours(0, 0, 0, 0); // Set time to the beginning of the day

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Set to the last day of the week (Saturday)
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const notificationsToday = await Notification.find({
        recipient: user._id,
        timestamp: {
            $gte: today,
            $lt: tomorrow
        }
    })
        .populate('sender')
        .sort({ timestamp: -1, read: -1 });

    const notificationsYesterday = await Notification.find({
        recipient: user._id,
        timestamp: {
            $gte: yesterday,
            $lt: today
        }
    })
        .populate('sender')
        .sort({ timestamp: -1, read: -1 });

    const notificationsThisWeek = await Notification.find({
        recipient: user._id,
        timestamp: {
            $gte: firstDayOfWeek,
            $lte: lastDayOfWeek
        }
    })
        .populate('sender')
        .sort({ timestamp: -1, read: -1 });

    const notificationsThisMonth = await Notification.find({
        recipient: user._id,
        timestamp: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
        }
    })
        .populate('sender')
        .sort({ timestamp: -1, read: -1 });

    if (user) {
        res.render('notifications', {
            user: user,
            notifications: notifications,
            notificationsToday: notificationsToday,
            notificationsYesterday: notificationsYesterday,
            notificationsThisWeek: notificationsThisWeek,
            notificationsThisMonth: notificationsThisMonth
        });
    }
});

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
        console.log('There is error for the update for notifications');
        res.redirect('/');
    }
});

app.get('/markAllAsRead', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    const update = await Notification.updateMany(
        { recipient: user._id },
        { read: true },
        { new: true }
    );

    if (update) {
        res.redirect('/');
    } else {
        console.log('There is error for the update for notifications');
        res.redirect('/');
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
    const username = req.user.username;
    const user = await User.findOne({ username: username });
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

// HUMAN RESOURCES
app.get(
    '/human-resource/staff-members/overview',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        const allUser = await User.find();
        const uniqueDepartments = new Set();
        const uniqueSection = new Set();

        allUser.forEach(user => {
            if (user.department) {
                uniqueDepartments.add(user.department);
            }
        });

        allUser.forEach(user => {
            if (user.section) {
                uniqueSection.add(user.section);
            }
        });

        const departments = Array.from(uniqueDepartments);
        const sections = Array.from(uniqueSection);

        if (user) {
            res.render('hr-staffmembers-overview', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                departments: departments,
                sections: sections,
                // all data
                allUser: allUser,
                show: '',
                alert: ''
            });
        }
    }
);

app
    .get(
        '/human-resource/staff-members/add-staff',
        isAuthenticated,
        async function (req, res) {
            const username = req.user.username;
            const user = await User.findOne({ username: username });
            const notifications = await Notification.find({
                recipient: user._id,
                read: false
            }).populate('sender');

            if (user) {
                res.render('hr-staffmembers-addstaff', {
                    user: user,
                    notifications: notifications,
                    uuid: uuidv4(),
                    // all data
                    show: '',
                    alert: ''
                });
            }
        }
    )
    .post(
        '/human-resource/staff-members/add-staff',
        isAuthenticated,
        async function (req, res) {
            const username = req.user.username;
            const user1 = await User.findOne({ username: username });
            const notifications = await Notification.find({
                recipient: user1._id,
                read: false
            }).populate('sender');

            // for successful
            const allUser = await User.find();
            const uniqueDepartments = new Set();
            const uniqueSection = new Set();

            allUser.forEach(user => {
                if (user.department) {
                    uniqueDepartments.add(user.department);
                }
            });

            allUser.forEach(user => {
                if (user.section) {
                    uniqueSection.add(user.section);
                }
            });

            const departments = Array.from(uniqueDepartments);
            const sections = Array.from(uniqueSection);

            if (user1) {
                if (
                    !req.body.fullname ||
                    !req.body.username ||
                    !req.body.email ||
                    !req.body.password ||
                    !req.body.position ||
                    !req.body.grade ||
                    !req.body.department ||
                    !req.body.gender
                ) {
                    res.render('hr-staffmembers-addstaff', {
                        user: user1,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Sign up unsuccessful'
                    });
                }

                const newUser = new User({
                    fullname: req.body.fullname,
                    username: req.body.username,
                    email: req.body.email,
                    nric: '',
                    phone: '',
                    profile: '',
                    age: 0,
                    address: '',
                    dateEmployed: '1974-07-04T00:00:00.000+00:00',
                    birthdate: '1974-07-04T00:00:00.000+00:00',
                    department: req.body.department,
                    section: req.body.section,
                    gender: req.body.gender,
                    grade: req.body.grade,
                    position: req.body.position,
                    education: '',
                    marital: 'single',
                    classification: req.body.class,
                    isChiefExec: false,
                    isDeputyChiefExec: false,
                    isHeadOfDepartment: false,
                    isHeadOfSection: false,
                    isAdmin: false,
                    isManagement: false,
                    isPersonalAssistant: false
                });

                User.register(newUser, req.body.password, function (err, user) {
                    if (err) {
                        console.log(err);
                        res.render('hr-staffmembers-addstaff', {
                            user: user1,
                            notifications: notifications,
                            uuid: uuidv4(),
                            show: 'show',
                            alert: err
                        });
                    } else {
                        const newUserLeave = new UserLeave({
                            user: user._id,
                            annual: { leave: 14, taken: 0 },
                            sick: { leave: 14, taken: 0 },
                            sickExtended: { leave: 60, taken: 0 },
                            emergency: { leave: 0, taken: 0 },
                            paternity: { leave: 3, taken: 0 },
                            maternity: { leave: 60, taken: 0 },
                            bereavement: { leave: 3, taken: 0 },
                            study: { leave: 3, taken: 0 },
                            marriage: { leave: 3, taken: 0 },
                            attendExam: { leave: 5, taken: 0 },
                            hajj: { leave: 40, taken: 0 },
                            unpaid: { taken: 0 },
                            special: { leave: 3, taken: 0 }
                        });

                        newUserLeave.save();

                        passport.authenticate('local')(req, res, function () {
                            res.render('hr-staffmembers-overview', {
                                user: user1,
                                notifications: notifications,
                                uuid: uuidv4(),
                                departments: departments,
                                sections: sections,
                                // all data
                                allUser: allUser,
                                show: 'show',
                                alert: 'Sign up successful'
                            });
                        });
                    }
                });
            }
        }
    );

app.get(
    '/human-resource/leave/overview',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        const allLeave = await Leave.find();
        const allUser = await User.find();

        if (user) {
            res.render('hr-leave-overview', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                // all data
                allLeave: allLeave,
                allUser: allUser
            });
        }
    }
);

app.get(
    '/human-resource/leave/balances',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        }).populate('sender');

        const allUserLeave = await UserLeave.find();
        const allUser = await User.find();

        if (user) {
            res.render('hr-leave-balances', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                // all data
                allUserLeave: allUserLeave,
                allUser: allUser
            });
        }
    }
);

app.get(
    '/human-resource/attendance/overview',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });

        if (user) {
            const currentDate = new Date();
            const startOfToday = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                0,
                0,
                0
            );
            const endOfToday = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                23,
                59,
                59
            );

            const attendance = await Attendance.find({
                timestamp: { $gte: startOfToday, $lte: endOfToday }
            }).sort({ timestamp: -1 });

            const allUser = await User.find();

            res.render('hr-attendance-overview', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                allUser: allUser,
                attendance: attendance
            });
        }
    }
);

// Function to generate a unique identifier (replace this with your own logic)
const generateUniqueIdentifier = () => {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
};

// ATTENDACE
app.get('/attendance', async function (req, res) {
    const uniqueIdentifier = generateUniqueIdentifier();

    res.render('attendance', {
        uuid: uuidv4(),
        uniqueIdentifier: uniqueIdentifier
    });
});

// ATTENDANCE TODAY FOR KP/KB
app.get(
    '/attendance/today/department/section',
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const user = await User.findOne({ username: username });
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });

        if (user) {
            res.render('attendance-today', {
                user: user,
                notifications: notifications,
                uuid: uuidv4()
            });
        }
    }
);

// SCAN QR GENERATED
app.get('/scan-qr', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('scan', {
            user: user,
            notifications: notifications,
            uuid: uuidv4()
        });
    }
});

//ATTENDANCE TODAY FOR ATTENDANCE PAGE
app.get('/api/attendance/today', async function (req, res) {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 to get the start of the day

        // Get the current time
        const currentTime = new Date();

        // Find attendance data for today within the specified time range
        const attendanceData = await Attendance.find({
            'date.signInTime': {
                $gte: today, // Find records where signInTime is greater than or equal to today
                $lte: currentTime // and less than or equal to the current time
            }
        })
            .sort({ timestamp: -1 })
            .limit(2)
            .lean();

        // Get all users
        const allUsers = await User.find().lean();

        // Filter the attendance data and populate user information
        const filteredData = attendanceData.map(entry => {
            const user = allUsers.find(
                user => user._id.toString() === entry.user.toString()
            );

            const getInitials = str => {
                const names = str.split(' '); // Split the full name into an array of names
                const initials = names
                    .slice(0, 2)
                    .map(name => name.charAt(0).toUpperCase()); // Get the first letter of each name and capitalize it
                return initials.join(''); // Join the initials into a single string
            };

            const formatDateTime = dateTime => {
                const options = {
                    timeZone: 'Asia/Kuala_Lumpur',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                };
                return dateTime.toLocaleTimeString('en-MY', options);
            };

            return {
                user: user
                    ? {
                        _id: user._id,
                        fullname: user.fullname,
                        initials: getInitials(user.fullname),
                        username: user.username,
                        department: user.department,
                        section: user.section,
                        profile: user.profile
                        // Add other user fields as needed
                    }
                    : null,
                datetime: formatDateTime(new Date(entry.date.signInTime)),
                signInTime: entry.date.signInTime,
                signOutTime: entry.date.signOutTime,
                status: entry.status,
                type: entry.type
            };
        });

        // Send the filtered attendance data for today to the client
        res.json(filteredData);
    } catch (err) {
        console.error('Error fetching attendance data for today:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//GET ALL ATTENDANCE DATA
app.post(
    '/api/data/all-attendance',
    isAuthenticated,
    async function (req, res) {
        const selectedDate = req.body.date;
        const searchQuery = req.query.search || ''; // Get search query from request query params
        const page = parseInt(req.query.page) || 1; // Get page number from request query params
        const limit = 10; // Number of items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip

        // Extract month and year from the selected date
        const [month, year] = selectedDate.split('/');

        try {
            // Create a set of all possible status types
            const allStatusTypes = ['Present', 'Absent', 'Late', 'Invalid', 'Leave'];
            const allUser = await User.find();

            // Query attendance records based on the month and year
            const attendanceData = await Attendance.aggregate([
                // Match attendance records for the selected month and year
                {
                    $match: {
                        timestamp: {
                            $gte: new Date(`${year}-${month}-01`),
                            $lt: new Date(`${year}-${parseInt(month) + 1}-01`)
                        }
                    }
                },
                // Group by user and status, count occurrences
                {
                    $group: {
                        _id: { user: '$user', status: '$status' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const userStatusCounts = {};

            // Iterate over all users and initialize their status counts
            allUser.forEach(user => {
                userStatusCounts[user._id] = {};
                allStatusTypes.forEach(statusType => {
                    userStatusCounts[user._id][statusType] = 0;
                });
            });

            // Update status counts based on the attendance data
            attendanceData.forEach(({ _id, count }) => {
                const { user, status } = _id;
                userStatusCounts[user][status] = count;
            });

            // Combine populated attendance data with user status counts
            const combinedData = allUser.map(user => {
                const statusCounts = userStatusCounts[user._id];
                return {
                    user: {
                        _id: user._id,
                        username: user.username,
                        fullname: user.fullname,
                        section: user.section,
                        department: user.department
                    },
                    statusCounts: statusCounts
                };
            });

            // Filter combinedData based on the search query
            const filteredData = combinedData.filter(item => {
                const { fullname, section, department, username } = item.user;
                const regex = new RegExp(searchQuery, 'i');
                return (
                    regex.test(fullname) ||
                    regex.test(section) ||
                    regex.test(department) ||
                    regex.test(username)
                );
            });

            // Paginate the filtered data
            const paginatedData = filteredData.slice(skip, skip + limit);

            const response = {
                data1: paginatedData,
                data2: filteredData
            };

            console.log(filteredData.length);

            // Respond with the paginated and filtered attendance data
            res.json(response);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// HR VIEW FOR TODAYS ATTENDANCE
app.post(
    '/api/data/all-attendance/today',
    isAuthenticated,
    async function (req, res) {
        const searchQuery = req.query.search || ''; // Get search query from request query params
        const page = parseInt(req.query.page) || 1; // Get page number from request query params
        const limit = 5; // Number of items per page
        const skip = (page - 1) * limit;

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 to get the start of the day

        try {
            // Query attendance records for today
            const attendanceData = await Attendance.aggregate([
                // Match attendance records for today
                {
                    $match: {
                        timestamp: {
                            $gte: today, // Find records where timestamp is greater than or equal to today
                            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Less than tomorrow
                        }
                    }
                },
                // Group by user and status, include attendance type, sign-in time, and sign-out time
                {
                    $group: {
                        _id: {
                            user: '$user',
                            status: '$status',
                            type: '$type',
                            signInTime: '$date.signInTime',
                            signOutTime: '$date.signOutTime',
                            timestamp: '$timestamp'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Collect unique user IDs from attendanceData
            const userIds = attendanceData.map(record => record._id.user);

            // Query all users from the database
            const allUser = await User.find({});

            // Create a map to quickly access user details by user ID
            const userMap = {};
            allUser.forEach(user => {
                userMap[user._id] = {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    section: user.section,
                    department: user.department
                };
            });

            // Create the combined data from attendanceData and userMap
            const combinedData = allUser.map(user => {
                const attendanceRecord = attendanceData.find(record =>
                    record._id.user.equals(user._id)
                );
                return attendanceRecord
                    ? {
                        user: userMap[user._id],
                        status: attendanceRecord._id.status,
                        type: attendanceRecord._id.type,
                        signInTime: attendanceRecord._id.signInTime,
                        signOutTime: attendanceRecord._id.signOutTime,
                        timestamp: attendanceRecord._id.timestamp,
                        count: attendanceRecord.count
                    }
                    : {
                        user: userMap[user._id],
                        status: 'Absent',
                        type: 'Nil',
                        signInTime: null,
                        signOutTime: null,
                        timestamp: null,
                        count: 0
                    };
            });

            // Sort combinedData based on timestamp, placing users without attendance records at the end
            combinedData.sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(a.timestamp) - new Date(b.timestamp);
            });

            // Filter combinedData based on the search query
            const filteredData = combinedData.filter(item => {
                const { fullname, section, department, username } = item.user;
                const { status, type, signInTime, signOutTime } = item;
                const regex = new RegExp(searchQuery, 'i');
                return (
                    regex.test(fullname) ||
                    regex.test(section) ||
                    regex.test(department) ||
                    regex.test(username) ||
                    regex.test(status) ||
                    regex.test(type) ||
                    (signInTime &&
                        regex.test(
                            new Date(signInTime).toLocaleTimeString('en-MY', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                                timeZone: 'Asia/Kuala_Lumpur'
                            })
                        )) ||
                    (signOutTime &&
                        regex.test(
                            new Date(signOutTime).toLocaleTimeString('en-MY', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                                timeZone: 'Asia/Kuala_Lumpur'
                            })
                        ))
                );
            });

            // Paginate the filtered data
            const paginatedData = filteredData.slice(skip, skip + limit);

            // Calculate counts for present, absent, late, leave statuses
            const totalCounts = combinedData.reduce(
                (acc, item) => {
                    acc.total++;
                    acc[item.status.toLowerCase()] =
                        (acc[item.status.toLowerCase()] || 0) + 1;
                    return acc;
                },
                { total: 0, present: 0, absent: 0, late: 0, leave: 0, invalid: 0 }
            );

            const response = {
                data1: paginatedData,
                data2: filteredData,
                counts: totalCounts
            };

            // Respond with the paginated and filtered attendance data
            res.json(response);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

app.post(
    '/api/data/all-attendance/today/department/section',
    isAuthenticated,
    async function (req, res) {
        const searchQuery = req.query.search || ''; // Get search query from request query params
        const page = parseInt(req.query.page) || 1; // Get page number from request query params
        const limit = 10; // Number of items per page
        const skip = (page - 1) * limit;

        const username = req.user.username;
        const user = await User.findOne({ username: username });

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 to get the start of the day

        try {
            // Query attendance records for today
            const attendanceData = await Attendance.aggregate([
                // Match attendance records for today
                {
                    $match: {
                        timestamp: {
                            $gte: today, // Find records where timestamp is greater than or equal to today
                            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Less than tomorrow
                        }
                    }
                },
                // Group by user and status, include attendance type, sign-in time, and sign-out time
                {
                    $group: {
                        _id: {
                            user: '$user',
                            status: '$status',
                            type: '$type',
                            signInTime: '$date.signInTime',
                            signOutTime: '$date.signOutTime',
                            timestamp: '$timestamp'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Collect unique user IDs from attendanceData
            const userIds = attendanceData.map(record => record._id.user);

            var allUser;
            if (user.isHeadOfDepartment) {
                // Query all users from the database
                allUser = await User.find({ department: user.department });
            } else if (user.isHeadOfSection) {
                // Query all users from the database
                allUser = await User.find({ section: user.section });
            }

            // Create a map to quickly access user details by user ID
            const userMap = {};
            allUser.forEach(user => {
                userMap[user._id] = {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    section: user.section,
                    department: user.department
                };
            });

            // Create the combined data from attendanceData and userMap
            const combinedData = allUser.map(user => {
                const attendanceRecord = attendanceData.find(record =>
                    record._id.user.equals(user._id)
                );
                return attendanceRecord
                    ? {
                        user: userMap[user._id],
                        status: attendanceRecord._id.status,
                        type: attendanceRecord._id.type,
                        signInTime: attendanceRecord._id.signInTime,
                        signOutTime: attendanceRecord._id.signOutTime,
                        timestamp: attendanceRecord._id.timestamp,
                        count: attendanceRecord.count
                    }
                    : {
                        user: userMap[user._id],
                        status: 'Absent',
                        type: 'Nil',
                        signInTime: null,
                        signOutTime: null,
                        timestamp: null,
                        count: 0
                    };
            });

            // Sort combinedData based on timestamp, placing users without attendance records at the end
            combinedData.sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(a.timestamp) - new Date(b.timestamp);
            });

            // Filter combinedData based on the search query
            const filteredData = combinedData.filter(item => {
                const { fullname, section, department, username } = item.user;
                const { status, type, signInTime, signOutTime } = item;
                const regex = new RegExp(searchQuery, 'i');
                return (
                    regex.test(fullname) ||
                    regex.test(section) ||
                    regex.test(department) ||
                    regex.test(username) ||
                    regex.test(status) ||
                    regex.test(type) ||
                    (signInTime &&
                        regex.test(
                            new Date(signInTime).toLocaleTimeString('en-MY', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                                timeZone: 'Asia/Kuala_Lumpur'
                            })
                        )) ||
                    (signOutTime &&
                        regex.test(
                            new Date(signOutTime).toLocaleTimeString('en-MY', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                                timeZone: 'Asia/Kuala_Lumpur'
                            })
                        ))
                );
            });

            // Paginate the filtered data
            const paginatedData = filteredData.slice(skip, skip + limit);

            // Calculate counts for present, absent, late, leave statuses
            const totalCounts = combinedData.reduce(
                (acc, item) => {
                    acc.total++;
                    acc[item.status.toLowerCase()] =
                        (acc[item.status.toLowerCase()] || 0) + 1;
                    return acc;
                },
                { total: 0, present: 0, absent: 0, late: 0, leave: 0, invalid: 0 }
            );

            const response = {
                data1: paginatedData,
                data2: filteredData,
                counts: totalCounts
            };

            // Respond with the paginated and filtered attendance data
            res.json(response);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

// QR GENERATED
app.get('/generate-qr', async (req, res) => {
    const uniqueIdentifier = generateUniqueIdentifier();

    try {
        const qrCodeImage = await qr.toDataURL(uniqueIdentifier, {
            type: 'image/png',
            errorCorrectionLevel: 'H',
            color: { dark: '#3874ff', light: '#ffffff' }, // Set the color (dark is the main color, light is the background color)
            width: 400,
            margin: 0 // Set the width of the QR code
        });

        res.json({ qrCodeImage, uniqueIdentifier });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/save-qr-data', async function (req, res) {
    const qrData = req.body.qrData;
    // console.log('Received QR code data:', qrData);

    // Save the raw URL in the database
    await QRCode.create({
        uniqueId: qrData,
        createdAt: new Date()
    });

    res.status(200).send('QR code data received and saved successfully');
});

app.post('/process-scanned-data', isAuthenticated, async function (req, res) {
    const scannedData = req.body.scannedData;
    const id = req.body.id;

    console.log('Received scanned data from client:', scannedData);
    console.log('Id received is:', id);

    const checkUser = await User.findOne({ _id: id });

    var log = '';

    if (checkUser) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkQrCode = await QRCode.findOne({ uniqueId: id });

        if (checkQrCode) {
            console.log('You qr code is invalid, try to scan latest qr code!');

            log = 'You qr code is invalid, try to scan latest qr code!';
        } else {

            const existingAttendance = await Attendance.findOne({

                user: checkUser._id,
                timestamp: {
                    $gte: today,
                    $lte: new Date()
                }
            });

            if (existingAttendance) {
                if (existingAttendance.date.signInTime !== null && existingAttendance.date.signOutTime === null) {
                    await Attendance.findOneAndUpdate(
                        {
                            user: checkUser._id
                        },
                        {
                            'date.signOutTime': new Date(),
                            type: 'sign out'
                        },
                        {
                            upsert: true,
                            new: true
                        }
                    );

                    console.log('You have successfully signed out for today, thank you');

                    const tempAttendance = new TempAttendance({
                        user: checkUser._id,
                        timestamp: new Date(),
                        type: 'sign out'
                    });

                    await tempAttendance.save();

                    log = 'You have successfully signed out for today, thank you!';
                } else if (
                    existingAttendance.date.signInTime === null &&
                    existingAttendance.date.signOutTime === null
                ) {
                    const currentTime = new Date();
                    const pstTime = currentTime.toLocaleString('en-MY', {
                        timeZone: 'Asia/Kuala_Lumpur',
                        hour12: false,
                    });
                    const pstHourString = pstTime.split(',')[1].trim().split(':')[0];
                    const pstHour = parseInt(pstHourString);

                    console.log(pstHour);

                    if (pstHour >= 8) {
                        console.log('Clock in late confirmed');

                        await Attendance.findOneAndUpdate(
                            {
                                user: checkUser._id,
                                timestamp: {
                                    $gte: today, // Greater than or equal to the start of today
                                    $lte: new Date() // Less than the current time
                                }
                            },
                            {
                                $set: {
                                    status: 'Late',
                                    type: 'sign in',
                                    'date.signInTime': new Date(),
                                    timestamp: new Date()
                                }
                            },
                            { upsert: true, new: true }
                        );

                        const tempAttendance = new TempAttendance({
                            user: checkUser._id,
                            timestamp: new Date(),
                            type: 'sign in'
                        });

                        await tempAttendance.save();

                        log =
                            'You have successfully signed in as late for today, thank you!';
                    } else {
                        await Attendance.findOneAndUpdate(
                            {
                                user: checkUser._id,
                                timestamp: {
                                    $gte: today, // Greater than or equal to the start of today
                                    $lte: new Date() // Less than the current time
                                }
                            },
                            {
                                $set: {
                                    status: 'Present',
                                    type: 'sign in',
                                    'date.signInTime': new Date(),
                                    timestamp: new Date()
                                }
                            },
                            { upsert: true, new: true }
                        );

                        const tempAttendance = new TempAttendance({
                            user: checkUser._id,
                            timestamp: new Date(),
                            type: 'sign in'
                        });

                        await tempAttendance.save();

                        log = 'You have successfully signed in for today, thank you!';
                    }
                } else {
                    console.log('You already sign out for today.');
                    log = 'You already sign out for today, thank you!';
                }
            } else {
                console.log(
                    'The attendance for the user doesnt exist, please check the user id'
                );
                log =
                    'The attendance for the user doesnt exist, please check the user id';
            }
        }

        const response = {
            user: checkUser,
            message: log
        };

        // console.log(response);
        res.json(response);
    }
});

app.get('/get-latest-scanned-data', async function (req, res) {
    try {
        const tempAttendance = await TempAttendance.findOne()
            .sort({ timestamp: -1 })
            .lean();
        var message = '';
        var response = '';

        if (tempAttendance) {
            const allUser = await User.find();
            const user = allUser.find(
                user => user._id.toString() === tempAttendance.user.toString()
            );

            if (tempAttendance.type === 'sign in') {
                message = 'Have sign in, welcome!';
            } else if (tempAttendance.type === 'sign out') {
                message = 'Have sign out, have a good rest!';
            } else if (tempAttendance.type === 'meeting') {
                message = 'Welcome to the meeting room!';
            } else if (tempAttendance.type === 'events') {
                message = 'Thank you for your participation!';
            } else if (tempAttendance.type === 'invalid') {
                message = 'PLease try again!';
            }

            response = {
                temp: tempAttendance,
                user: user,
                message: message
            };
        } else {
            // Handle the case when tempAttendance is null
            message = 'No attendance record found.';
            response = {
                temp: null,
                user: null,
                message: message
            };
        }

        res.json(response);
    } catch (error) {
        console.error('Error fetching latest scanned data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SUPER ADMIN
app.get('/super-admin/update', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user.isSuperAdmin) {
        const allUsers = await User.find();

        // Iterate through each user
        for (const user of allUsers) {
            // Update the user's additional information
            await User.findOneAndUpdate(
                { section: 'Administration and Human Resource Management Division' },
                {
                    department: ''
                },
                { upsert: true, new: true }
            );
        }

        console.log('All user has been updated');

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
generateApprovals = function (
    user,
    headOfSection,
    headOfDepartment,
    depChiefExec,
    chiefExec,
    adminHR,
    assignee,
    type
) {
    let approvals;

    if (type === 'Emergency Leave') {
        if (
            user.isAdmin &&
            user.section === 'Administration and Human Resource Management Division'
        ) {
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                            timestamp: ''
                        }))
                        : []),
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                        {
                            recipient: headOfSection._id,
                            role: 'Head of Section',
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
        } else {
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
        }
    } else {
        if (
            user.isAdmin &&
            user.section === 'Administration and Human Resource Management Division'
        ) {
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                timestamp: ''
                            }))
                            : []),
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                            estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                            timestamp: ''
                        }))
                        : []),
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                                timestamp: ''
                            }))
                            : []),
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
        } else {
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                            role: 'Relief Staff',
                            status: 'pending',
                            comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                                estimated: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
                                role: 'Relief Staff',
                                status: 'pending',
                                comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
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
        }
    }

    return approvals;
};

// CHECK DATE TODAY BETWEEN TWO DATES IN RANGE
isDateInRange = function (startDate, endDate) {
    const currentDate = new Date();

    // Convert start and end dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Set time component to 00:00:00 for both start and end dates
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);

    // Check if the current date is between the start and end dates
    return startDateObj <= currentDate && currentDate <= endDateObj;
};

// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
