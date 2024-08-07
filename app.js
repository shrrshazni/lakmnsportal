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
const requestIp = require('request-ip');
const { performance } = require('perf_hooks');

const mongoURI =
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/session';

const app = express();

app.use(fileUpload());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(requestIp.mw());
app.set('trust proxy', true);

// Sessions Database
const sessionDatabase = mongoose.createConnection('mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/session');

// mongoose session option
const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'sessions',
    stringify: false,
    connection: sessionDatabase
    // autoRemove: 'interval',
    // autoRemoveInterval: 1
});

//init session
app.use(
    session({
        secret: 'Our little secrets',
        resave: false,
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

// Tender Database
const tenderDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/tender'
);

// Auxiliary Police
const auxPoliceDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/auxipolice'
);

// SCHEMA INITIALIZATION

// FOR USER DATABASE

// USER
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true }, // Add index here
    email: { type: String, required: true, unique: true, index: true },
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
    isDriver: { type: Boolean, default: false },
    isTeaLady: { type: Boolean, default: false },
    dateEmployed: { type: Date },
    birthdate: { type: Date }
});
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

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
notificationSchema.index({ recipient: 1, read: 1 });

// ACTIVITY
const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    title: { type: String },
    type: { type: String },
    description: { type: String }
});
activitySchema.index({ user: 1, date: -1 });

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
infoSchema.index({ user: 1 }); // Index on user
infoSchema.index({ status: 1 }); // Index on status
infoSchema.index({ isOnline: 1 }); // Index on isOnline

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
            const currentDate = moment().utcOffset(8).add(3, 'days').toDate();
            return currentDate;
        }
    },
    approvals: [approvalSchema]
});
leaveSchema.index({ status: 1 });

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
FileSchema.index({ user: 1 }); // Index on user
FileSchema.index({ date: -1 });

// ATTENDANCE
const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['sign in', 'sign out', 'manual add', 'event', 'meeting', 'invalid', 'weekend', 'public holiday', 'acknowledged'],
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
        enum: ['Present', 'Absent', 'Late', 'Invalid', 'Leave', 'Non Working Day'],
        default: 'Present'
    },
    location: {
        signIn: { type: String, default: 'tbd' },
        signOut: { type: String, default: 'tbd' }
    },
    remarks: {
        type: String
    },
    timestamp: { type: Date, default: null }
});
// Add indexes
AttendanceSchema.index({ user: 1, date: 1 }); // Compound index on user and date
AttendanceSchema.index({ type: 1 }); // Index on type
AttendanceSchema.index({ status: 1 }); // Index on status
AttendanceSchema.index({ location: 1 }); // Index on status

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
qrCodeSchema.index({ uniqueId: 1 });

// AUXILIARY POLICE

// PATROL REPORT 
const checkpoint = {
    latitude: Number,
    longitude: Number,
    checkpointName: String,
    time: String,
    logReport: String,
    fullName: String,
    username: String
};

const cycleAmount = {
    cycleSeq: Number,
    timeSlot: String,
    checkpoint: [checkpoint]
};

const shiftMember = {
    cycle: [cycleAmount]
};

// PATROL SCHEMA
const patrolSchema = new mongoose.Schema({
    reportId: String,
    shift: String,
    type: String,
    date: Date,
    location: String,
    status: String,
    startShift: String,
    endShift: String,
    remarks: String,
    staff: [],
    shiftMember: shiftMember,
    patrolUnit: [checkpoint],
    timestamp: { type: Date }
});
patrolSchema.index({ reportId: 1 }); // Index on reportId
patrolSchema.index({ shift: 1 }); // Index on shift
patrolSchema.index({ date: 1 }); // Index on date
patrolSchema.index({ location: 1 }); // Index on location
patrolSchema.index({ status: 1 }); // Index on status

// SCHEDULE
const scheduleAuxSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    location: { type: String },
    shift: [],
    staffRaisedFlag: [],
    staffLoweredFlag: []
});
scheduleAuxSchema.index({ date: 1 }); // Index on date
scheduleAuxSchema.index({ location: 1 }); // Index on location

// DUTY HANDOVER

const dutyHandoverSchema = new mongoose.Schema({
    headShift: String,
    date: Date,
    time: String,
    location: String,
    remarks: String,
    status: {
        type: String,
        enum: ['completed', 'pending'],
        default: 'pending'
    },
    shift: String,
    staff: [String],
    timestamp: { type: Date }
});
dutyHandoverSchema.index({ date: 1 }); // Index on date
dutyHandoverSchema.index({ location: 1 }); // Index on location
dutyHandoverSchema.index({ status: 1 }); // Index on status
dutyHandoverSchema.index({ shift: 1 }); // Index on shift

// CASE SCHEMA
const caseSchema = new mongoose.Schema({
    fullname: String,
    time: String,
    date: Date,
    location: String,
    summary: String,
    actionTaken: String,
    eventSummary: String,
    staffOnDuty: [],
    remarks: String
});
caseSchema.index({ date: 1 }); // Index on date
caseSchema.index({ location: 1 }); // Index on location
caseSchema.index({ fullname: 1 }); // Index on fullname

// TENDER
// const tenderSchema = new mongoose.Schema({
//     id: {
//         type: String,
//         required: true
//     },
//     title: {
//         type: String,
//         required: true
//     },
//     date: {
//         start: { type: String },
//         deadline: {
//             type: Date,
//             required: true
//         }
//     },
//     budget: {
//         type: Number,
//         required: true
//     },
//     twc: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true
//     }
// });

// const tenderCompanySchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     registration: { type: String, required: true },
//     email: { type: String, required: true },
//     documents: [
//         {
//             tenderId: { type: String },
//             budgetSub: { type: Number },
//             fileId: { type: String }

//         }
//     ]
// });


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
const ArchivedAttendance = attendanceDatabase.model('ArchivedAttendance', AttendanceSchema);
const TempAttendance = attendanceDatabase.model(
    'TempAttendance',
    TempAttendanceSchema
);
const QRCode = attendanceDatabase.model('QRCode', qrCodeSchema);
const ScheduleAux = auxPoliceDatabase.model('ScheduleAux', scheduleAuxSchema);
const PatrolAux = auxPoliceDatabase.model('PatrolAux', patrolSchema);
const CaseAux = auxPoliceDatabase.model('CaseAux', caseSchema);
const DutyHandoverAux = auxPoliceDatabase.model('DutyHandoverAux', dutyHandoverSchema);
// const Tender = tenderDatabase.model('Tender', tenderSchema);
// const TenderCompany = tenderDatabase.model('TenderCompany', tenderCompanySchema);

// Create mongo indexes query for efficiently
// Create all indexes
async function createAllIndexes() {
    try {
        await User.createIndexes();
        await UserLeave.createIndexes();
        await Notification.createIndexes();
        await Activity.createIndexes();
        await Task.createIndexes();
        await Info.createIndexes();
        await Leave.createIndexes();
        await File.createIndexes();
        await Attendance.createIndexes();
        await TempAttendance.createIndexes();
        await QRCode.createIndexes();
        await PatrolAux.createIndexes();
        await ScheduleAux.createIndexes();
        await DutyHandoverAux.createIndexes();
        await CaseAux.createIndexes();

        console.log('All indexes created successfully');
    } catch (err) {
        console.error('Error creating indexes:', err);
    }
}
// createAllIndexes();

// Deleted all indexes
async function deleteAllIndexes(collection) {
    try {
        const indexes = await collection.indexes();
        const indexNames = indexes
            .filter(index => index.name !== '_id_') // Avoid dropping the default _id index
            .map(index => index.name);

        for (const indexName of indexNames) {
            await collection.dropIndex(indexName);
            console.log(`Dropped index: ${indexName}`);
        }
    } catch (err) {
        console.error('Error deleting indexes:', err);
    }
}
async function deleteAllIndexesFromCollections() {
    try {
        // Define the collections
        const collections = [
            User.collection,
            UserLeave.collection,
            Notification.collection,
            Activity.collection,
            Task.collection,
            Info.collection,
            Leave.collection,
            File.collection,
            Attendance.collection,
            TempAttendance.collection,
            QRCode.collection,
            PatrolAux.collection,
            ScheduleAux.collection,
            DutyHandoverAux.collection,
            CaseAux.collection
        ];

        for (const collection of collections) {
            await deleteAllIndexes(collection);
        }

        console.log('All indexes deleted successfully');
    } catch (err) {
        console.error('Error deleting indexes from collections:', err);
    }
}
// deleteAllIndexesFromCollections();

// Update mongo indexes
async function updateIndex(collection, indexName, indexSpec) {
    try {
        // Drop existing index if it exists
        const existingIndexes = await collection.indexes();
        const indexExists = existingIndexes.some(index => index.name === indexName);

        if (indexExists) {
            await collection.dropIndex(indexName);
        }

        // Create the new index
        await collection.createIndex(indexSpec.key, {
            name: indexSpec.name,
            unique: indexSpec.unique || false,
            background: true
        });

        console.log(`Index updated: ${indexSpec.name}`);
    } catch (err) {
        console.error(`Error updating index ${indexSpec.name}:`, err);
    }
}
async function updateAllIndexes() {
    try {
        // User Collection
        await updateIndex(User.collection, 'username_1', { key: { username: 1 }, name: 'username_1', unique: true });
        await updateIndex(User.collection, 'email_1', { key: { email: 1 }, name: 'email_1', unique: true });

        // UserLeave Collection
        await updateIndex(UserLeave.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(UserLeave.collection, 'date_start_1', { key: { 'date.start': 1 }, name: 'date_start_1' });

        // Notification Collection
        await updateIndex(Notification.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(Notification.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

        // Activity Collection
        await updateIndex(Activity.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(Activity.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

        // Task Collection
        await updateIndex(Task.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(Task.collection, 'status_1', { key: { status: 1 }, name: 'status_1' });

        // Info Collection
        await updateIndex(Info.collection, 'type_1', { key: { type: 1 }, name: 'type_1' });
        await updateIndex(Info.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

        // Leave Collection
        await updateIndex(Leave.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(Leave.collection, 'status_1', { key: { status: 1 }, name: 'status_1' });

        // File Collection
        await updateIndex(File.collection, 'fileId_1', { key: { fileId: 1 }, name: 'fileId_1', unique: true });

        // Attendance Collection
        await updateIndex(Attendance.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(Attendance.collection, 'date_signIn_1', { key: { 'date.signInTime': 1 }, name: 'date_signIn_1' });

        // TempAttendance Collection
        await updateIndex(TempAttendance.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
        await updateIndex(TempAttendance.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

        // QRCode Collection
        await updateIndex(QRCode.collection, 'code_1', { key: { code: 1 }, name: 'code_1', unique: true });

        // PatrolAux Collection
        await updateIndex(PatrolAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
        await updateIndex(PatrolAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

        // ScheduleAux Collection
        await updateIndex(ScheduleAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
        await updateIndex(ScheduleAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

        // DutyHandoverAux Collection
        await updateIndex(DutyHandoverAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
        await updateIndex(DutyHandoverAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

        // CaseAux Collection
        await updateIndex(CaseAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
        await updateIndex(CaseAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

        console.log('All indexes updated successfully');
    } catch (err) {
        console.error('Error updating indexes:', err);
    }
}
// updateAllIndexes();

async function listIndexes(collection) {
    try {
        const indexes = await collection.indexes();
        console.log(`Indexes for ${collection.collectionName}:`, indexes);
    } catch (err) {
        console.error(`Error listing indexes for ${collection.collectionName}:`, err);
    }
}
// Check indexes for all collections
async function checkIndexes() {
    try {
        await listIndexes(User.collection);
        await listIndexes(UserLeave.collection);
        await listIndexes(Notification.collection);
        await listIndexes(Activity.collection);
        await listIndexes(Task.collection);
        await listIndexes(Info.collection);
        await listIndexes(Leave.collection);
        await listIndexes(File.collection);
        await listIndexes(Attendance.collection);
        await listIndexes(TempAttendance.collection);
        await listIndexes(QRCode.collection);
        await listIndexes(PatrolAux.collection);
        await listIndexes(ScheduleAux.collection);
        await listIndexes(DutyHandoverAux.collection);
        await listIndexes(CaseAux.collection);

        console.log('All indexes listed successfully');
    } catch (err) {
        console.error('Error listing indexes:', err);
    }
}
// checkIndexes();

passport.use(new LocalStrategy(User.authenticate()));

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

//CHECK AUTH USER
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/landing'); // Redirect to the login page if not authenticated
};

//EMAIL TRANSPORTER
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'protech@lakmns.org',
        pass: 'lxiwvlgvibxcbsxy'
    }
});

// BASIC USER PART

//HOME
app.get('/', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const startTotal = performance.now();

    // Logging execution time for each query
    const logTime = (label, start) => {
        const end = performance.now();
        console.log(`${label} took ${end - start}ms`);
    };

    const startUserQuery = performance.now();
    const user = await User.findOne({ username: username });
    logTime('User Query', startUserQuery);

    const oneMonthAgo = moment().subtract(1, 'months').toDate();
    // Delete notifications older than one month
    await Notification.deleteMany({ createdAt: { $lt: oneMonthAgo } });

    const startNotificationsQuery = performance.now();
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });
    logTime('Notifications Query', startNotificationsQuery);

    // Run queries in parallel
    const [
        allUser,
        allLeave,
        allUserLeave,
        allInfo,
        userLeave,
        leave,
        task,
        file,
        info,
        otherTask,
        otherActivities,
        staffOnLeave,
        userTeamMembers,
        activities
    ] = await Promise.all([
        User.find().sort({ timestamp: -1 }),
        Leave.find().sort({ timestamp: -1 }),
        UserLeave.find().sort({ timestamp: -1 }),
        Info.find(),
        UserLeave.findOne({ user: user._id }).populate('user').exec(),
        Leave.find({ user: user._id }),
        Task.find({ assignee: { $in: [user._id] } })
            .sort({ timestamp: -1 })
            .populate('assignee')
            .exec(),
        File.find(),
        Info.findOne({ user: user._id }),
        Task.find({ assignee: { $ne: [user._id] } }),
        Activity.find(),
        user.isAdmin || user.isChiefExec || user.isDeputyChiefExec
            ? Leave.find({ status: 'approved' })
            : Leave.find({ status: 'approved', department: user.department }),
        user.isChiefExec || user.isDeputyChiefExec
            ? User.find({ isManagement: true, _id: { $ne: user._id } })
            : user.isHeadOfDepartment
                ? User.find({ department: user.department, _id: { $ne: user._id } })
                : User.find({ section: user.section, _id: { $ne: user._id } }),
        Activity.find({ date: { $gte: moment().utcOffset(8).startOf('day').clone().subtract(7, 'days') } })
            .populate({ path: 'user' })
            .sort({ date: -1 })
            .exec()
    ]);

    const startLeaveProcessing = performance.now();
    let todayLeaves = [];
    let weekLeaves = [];
    let monthLeaves = [];
    const today = moment().utcOffset(8).startOf('day');
    const sevenDaysAgo = today.clone().subtract(7, 'days');
    const firstDayOfWeek = today.clone().startOf('isoWeek');
    const lastDayOfWeek = today.clone().endOf('isoWeek');
    const firstDayOfMonth = today.clone().startOf('month');
    const lastDayOfMonth = today.clone().endOf('month');

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
    logTime('Leave Processing', startLeaveProcessing);

    const startLeaveApprovals = performance.now();
    let filteredApprovalLeaves;
    if (user.isAdmin) {
        filteredApprovalLeaves = allLeave.filter(
            leave => leave.status !== 'approved' && leave.status !== 'denied'
        );
    } else {
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
    logTime('Leave Approvals', startLeaveApprovals);

    const startUniqueCollections = performance.now();
    const uniqueDepartments = new Set();
    const uniqueSections = new Set();

    allUser.forEach(user => {
        if (user.department) uniqueDepartments.add(user.department);
        if (user.section) uniqueSections.add(user.section);
    });

    const departments = Array.from(uniqueDepartments);
    const sections = Array.from(uniqueSections);
    logTime('Unique Collections', startUniqueCollections);

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
            show: '',
            alert: '',
            // addditional data
            clientIp: req.clientIp
        });
    }

    logTime('Total', startTotal);
});

//STAFF DETAILS
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
                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Add Assignee on Task',
                    type: 'Task',
                    description:
                        user.fullname +
                        ' has add assignee '
                        + assignee[0].username +
                        ' at '
                        + getDateFormat2(moment().utcOffset(8).toDate())
                });

                activityUser.save();

                console.log('New activity submitted', activityUser);

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
                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Update Task Description',
                    type: 'Task',
                    description:
                        user.fullname +
                        ' has update task description '
                        + update.name +
                        ' at '
                        + getDateFormat2(moment().utcOffset(8).toDate())
                });

                activityUser.save();

                console.log('New activity submitted', activityUser);

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
                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Update/Add Task Description',
                    type: 'Task',
                    description:
                        user.fullname +
                        ' has update/add task description '
                        + update.name +
                        ' at '
                        + getDateFormat2(moment().utcOffset(8).toDate())
                });

                activityUser.save();

                console.log('New activity submitted', activityUser);

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
                updateFields.due = moment(due).utcOffset(8).toDate();
            }

            if (reminder) {
                updateFields.reminder = moment(reminder).utcOffset(8).toDate();
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
                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Update Task Content',
                    type: 'Task',
                    description:
                        user.fullname +
                        ' has update task content '
                        + update.name +
                        ' at '
                        + getDateFormat2(moment().utcOffset(8).toDate())
                });

                activityUser.save();

                console.log('New activity submitted', activityUser);

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
                    const today = moment().utcOffset(8).startOf('day').toDate();
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

                // activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Upload File for Task',
                    type: 'Task',
                    description:
                        user.fullname +
                        ' has upload file at '
                        + getDateFormat2(moment().utcOffset(8).toDate())
                });

                activityUser.save();

                console.log('New activity submitted', activityUser);

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
app.get('/search/staff/assignee-relief', isAuthenticated, async function (req, res) {
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
            } else if (user.isDriver) {
                const departmentQuery = {
                    department: user.department,
                    fullname: { $regex: query, $options: 'i' }
                };

                const driver = {
                    isDriver: true,
                    fullname: { $regex: query, $options: 'i' }
                };

                results = await User.find({
                    $or: [departmentQuery, driver]
                });
            } else if (user.isTeaLady) {
                const departmentQuery = {
                    department: user.department,
                    fullname: { $regex: query, $options: 'i' }
                };

                const teaLady = {
                    isTeaLady: true,
                    fullname: { $regex: query, $options: 'i' }
                };

                results = await User.find({
                    $or: [departmentQuery, teaLady]
                });
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
                results = await User.find({
                    department: user.department,
                    fullname: { $regex: query, $options: 'i' }
                });
            }
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

app.get('/search/staff/auxiliary-police', isAuthenticated, async function (req, res) {
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

//LANDINGPAGE
app.get('/landing', async function (req, res) {
    res.render('landing-page');
});

//AUTH

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

//SIGNIN
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
        const { username, password, rememberMe } = req.body;

        // Start measuring time
        console.time('Sign-in Process');

        // Calculate the expiration date based on the 'rememberMe' checkbox
        const expirationDate = rememberMe
            ? moment().utcOffset(8).add(7, 'days').toDate()  // 7 days if rememberMe is checked
            : moment().utcOffset(8).add(1, 'hour').toDate(); // 1 hour otherwise

        const passwordRegex = /^(?:\d+|[a-zA-Z0-9]{2,})/;

        try {
            const user = await User.findByUsername(username);

            // validation username
            let validationUsername = username && user ? 'is-valid' : 'is-invalid';

            // validation password
            let validationPassword = password && passwordRegex.test(password) ? 'is-valid' : 'is-invalid';

            if (validationUsername === 'is-valid' && validationPassword === 'is-valid') {
                user.authenticate(password, async (err, authenticatedUser) => {
                    if (err || !authenticatedUser) {
                        // End timing and log
                        console.timeEnd('Sign-in Process');

                        return res.render('sign-in', {
                            // validation
                            validationUsername,
                            validationPassword: 'is-invalid',
                            // input value
                            username,
                            password,
                            toastShow: 'show',
                            toastMsg: 'Incorrect password'
                        });
                    }

                    // Password is correct, log in the user
                    req.logIn(authenticatedUser, async err => {
                        if (err) {
                            // End timing and log
                            console.timeEnd('Sign-in Process');

                            return next(err);
                        }

                        await Info.findOneAndUpdate(
                            { user: user._id },
                            { isOnline: true, lastSeen: moment().utcOffset(8).toDate() },
                            { new: true }
                        );

                        req.session.cookie.expires = expirationDate;

                        console.log(`Current Session expires: ${req.session.cookie.expires}`);

                        // End timing and log
                        console.timeEnd('Sign-in Process');

                        return res.redirect('/');
                    });
                });
            } else {
                // End timing and log
                console.timeEnd('Sign-in Process');

                res.render('sign-in', {
                    // validation
                    validationUsername,
                    validationPassword,
                    // input value
                    username,
                    password,
                    toastShow: 'show',
                    toastMsg: 'There is an error, please do check your input'
                });
            }
        } catch (error) {
            // End timing and log
            console.timeEnd('Sign-in Process');

            console.error(error);
            res.status(500).send('Internal Server Error');
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

        const emailData = {
            checkEmail: checkEmail,
            uuid: randomAlphaNumeric,
        };

        console.log(emailData.checkEmail);
        console.log(emailData.uuid);

        const emailHTML = await new Promise((resolve, reject) => {
            app.render('email', { uuid: randomAlphaNumeric, checkEmail: checkEmail }, (err, html) => {
                if (err) reject(err);
                else resolve(html);
            });
        });

        console.log(emailHTML);

        if (checkEmail) {
            let mailOptions = {
                from: 'protech@lakmns.org',
                to: checkEmail.email,
                subject: 'lakmnsportal - Reset Password',
                html: emailHTML,
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
                    'We have seen reset password link and 5 alpha-numeric code to your email, please do check it.'
            });
        } else {
            res.render('forgot-password', {
                show: 'show',
                alert:
                    'The email address you have entered are not registered in lakmnsportal, please do check your email again.'
            });
        }
    });

app.get('/reset-password/:id', async function (req, res) {
    const id = req.params.id;
    console.log(id);

    res.render('reset-password', {
        id: id,
        show: '',
        alert: ''
    });

}).post('/reset-password/:id', async function (req, res) {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });

    if (req.body.confirmPassword === req.body.password) {
        await user.setPassword(req.body.password);
        const updatePassword = await user.save();

        if (updatePassword) {

            res.render('sign-in', {
                validationUsername: '',
                validationPassword: '',
                // input value
                username: '',
                password: '',
                // toast
                toastShow: 'show',
                toastMsg: 'Reset password successful!'
            });

        } else {

            res.render('reset-password', {
                id: id,
                show: 'show',
                alert: 'Update password failed!'
            });
        }
    } else {
        res.render('reset-password', {
            id: id,
            show: 'show',
            alert: 'New password and confirm password is not a match!'
        });
    }


});

//SIGNOUT
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
            lastSeen: moment().utcOffset(8).toDate()
        },
        {
            new: true
        }
    );

    if (updateInfo) {
        console.log('Sign out at ' + moment().utcOffset(8).toDate());
    } else {
        console.log('Failed to update');
    }
});

//PROFILE
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

//SETTINGS
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
                updateFields.dateEmployed = moment(req.body.dateEmployed).utcOffset(8).toDate();
            }
            if (req.body.birthdate) {
                updateFields.birthdate = moment(req.body.birthdate).utcOffset(8).toDate();
            }
            if (req.body.nric) {
                updateFields.nric = req.body.nric;
            }
            if (req.body.marital && req.body.marital !== 'Select your marital status') {
                updateFields.marital = req.body.marital;
            }
            if (req.body.education && req.body.education !== 'Select your highest education') {
                updateFields.education = req.body.education;
            }
            if (req.body.address) {
                updateFields.address = req.body.address;
            }
            if (req.body.children && req.body.children !== 'Select your number of children') {
                updateFields.children = parseInt(req.body.children);
            }

            console.log('Update fields:', updateFields);

            if (Object.keys(updateFields).length === 0) {
                res.render('settings', {
                    user: user,
                    uuid: uuidv4(),
                    notifications: notifications,
                    info: info,
                    show: 'show',
                    alert: 'Update unsuccessful, there is no input to be updated'
                });
            } else {
                // Check if email already exists
                if (updateFields.email) {
                    const emailExists = await User.findOne({ email: updateFields.email });
                    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                        return res.render('settings', {
                            user: user,
                            uuid: uuidv4(),
                            notifications: notifications,
                            info: info,
                            show: 'show',
                            alert: 'The email address is already in use by another account.'
                        });
                    }
                }

                const updateUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $set: updateFields },
                    { upsert: true, new: true }
                );

                if (updateUser) {
                    // If email or phone are updated, set verification fields to false
                    const updateInfoFields = {};
                    if (updateFields.phone) {
                        updateInfoFields.phoneVerified = false;
                    }
                    if (updateFields.email) {
                        updateInfoFields.emailVerified = false;
                    }

                    if (Object.keys(updateInfoFields).length > 0) {
                        await Info.findOneAndUpdate(
                            { user: user._id },
                            { $set: updateInfoFields },
                            { upsert: true, new: true }
                        );
                    }

                    console.log('Update successful:', updateUser);

                    const activityUser = new Activity({
                        user: user._id,
                        date: moment().utcOffset(8).toDate(),
                        title: 'Update profile',
                        type: 'Profile',
                        description: `${user.fullname} has updated their profile on ${moment().format('YYYY-MM-DD')}`
                    });

                    await activityUser.save();
                    console.log('New activity submitted:', activityUser);

                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert: 'Update successful. Please check your profile to see the changes.'
                    });
                } else {
                    console.log('Update unsuccessful');
                    res.render('settings', {
                        user: user,
                        uuid: uuidv4(),
                        notifications: notifications,
                        info: info,
                        show: 'show',
                        alert: 'Update unsuccessful. Please check your profile to see the changes.'
                    });
                }
            }
        }
    });


app.post('/settings/change-password', isAuthenticated, async function (req, res) {
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
});

app.post('/settings/upload/profile-image', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (!user) {
        console.log('User not found');
        return res.redirect('/settings');
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('There are no files selected');
        return res.redirect('/settings');
    }

    console.log('Files to be uploaded');

    for (const file of Object.values(req.files)) {
        const upload = __dirname + '/public/uploads/' + file.name;
        const pathUpload = '/uploads/' + file.name;
        const today = moment().utcOffset(8).startOf('day').toDate();
        const type = path.extname(file.name);

        await file.mv(upload);

        const fileSizeInBytes = (await fs.stat(upload)).size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        console.log(fileSizeInMB);

        await User.findOneAndUpdate(
            { username: username },
            { profile: pathUpload },
            { upsert: true, new: true }
        );
    }

    const activityUser = new Activity({
        user: user._id, // Ensure this is the correct reference
        date: moment().utcOffset(8).toDate(),
        title: 'Update profile',
        type: 'Profile',
        description: `${user.fullname} has updated their profile at ${getDateFormat2(moment().utcOffset(8).toDate())}`
    });

    await activityUser.save();

    console.log('New activity submitted', activityUser);
    console.log('Done uploading files!');

    res.redirect('/settings');
});


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
            const emailHTML = await new Promise((resolve, reject) => {
                app.render('email-verified', { user: user }, (err, html) => {
                    if (err) reject(err);
                    else resolve(html);
                });
            });
            let mailOptions = {
                from: 'protech@lakmns.org',
                to: user.email,
                subject: 'lakmnsportal - Email Verification',
                html: emailHTML
            };

            console.log(mailOptions);

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

// TUTORIAL
app.get('/guide', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('guide', {
            user: user,
            notifications: notifications,
            uuid: uuidv4()
        });
    }
});

// TUTORIAL
app.get('/changelog', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('changelog', {
            user: user,
            notifications: notifications,
            uuid: uuidv4()
        });
    }
});

//FULL CALENDAR

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

//LEAVE

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
                section: 'Human Resource Management Division'
            });
            const userLeave = await UserLeave.findOne({ user: user._id })
                .populate('user')
                .exec();
            // find assignee
            const assignee = await User.find({ fullname: { $in: selectedNames } });
            // leave for the user
            const leave = await Leave.find({ user: user._id });

            const newDate = {
                start: moment(startDate).utcOffset(8).toDate(),
                return: moment(returnDate).utcOffset(8).toDate()
            };

            const today = moment().utcOffset(8).startOf('day').toDate();

            // Calculate the difference in hours between the two dates
            var numberOfDays = '';
            var timeDifference = '';
            var leaveBalance = '';
            var leaveTaken = '';
            var approvals = [];

            console.log(adminHR.fullname);

            if (type === 'Annual Leave') {
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
                type === 'Extended Sick Leave' ||
                type === 'Sick Leave'
            ) {
                // Convert milliseconds to days
                numberOfDays = moment(returnDate).diff(moment(startDate), 'days') + 1;
            }

            let renderDataError = {};
            const amountDayRequest = calculateBusinessDays(today, startDate);

            console.log('Amount of day request:', amountDayRequest);
            console.log(numberOfDays);

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
                        'Insufficient annual leave balance for the requested duration';
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
                    if (amountDayRequest <= 1 && amountDayRequest >= -5) {
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
                            'The sick leave request date must be applied today or 5 days before'
                        );

                        renderDataError.show = 'show';
                        renderDataError.alert =
                            'The sick leave request must be applied today 5 days before';
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
                    if (amountDayRequest <= 1 && amountDayRequest >= -5) {
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

                if (amountDayRequest <= 1 && amountDayRequest >= -5) {
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
                    if (amountDayRequest <= 1 && amountDayRequest >= -5) {
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
                        type: '',
                        startDate: startDate,
                        returnDate: returnDate,
                        purpose: purpose,
                        // validation
                        validationType: 'is-invalid',
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
                        type: '',
                        startDate: startDate,
                        returnDate: returnDate,
                        purpose: purpose,
                        // validation
                        validationType: 'is-invalid',
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
                    section: 'Human Resource Management Division',
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
                    date: moment().utcOffset(8).toDate(),
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
                //     from: 'protech@lakmns.org',
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
                const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').toDate();
                const otherTaskHome = await Task.find({
                    assignee: { $ne: [user._id] }
                });
                const otherActivitiesHome = await Activity.find();
                const info = await Info.findOne({ user: user._id });

                const today = moment().utcOffset(8).startOf('day');
                const firstDayOfWeek = today.clone().startOf('week').add(1, 'day');
                const lastDayOfWeek = today.clone().endOf('week');
                const firstDayOfMonth = today.clone().startOf('month');
                const lastDayOfMonth = today.clone().endOf('month');

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
                        'Leave request submitted, please wait for approval 3 days from now',
                    // addditional data
                    clientIp: req.clientIp
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

        var daysDifference = '';

        // Calculate the difference in hours between the two dates
        if (leave.type === 'Annual Leave') {
            if (userReq.isNonOfficeHour) {
                daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
            } else {
                daysDifference = calculateBusinessDays(startDate, returnDate);
            }
        } else if (leave.type === 'Emergency Leave') {
            daysDifference = calculateBusinessDays(startDate, returnDate);
        } else if (
            leave.type === 'Marriage Leave' ||
            leave.type === 'Paternity Leave' ||
            leave.type === 'Study Leave' ||
            leave.type === 'Hajj Leave' ||
            leave.type === 'Unpaid Leave' ||
            leave.type === 'Special Leave' ||
            leave.type === 'Sick Leave'
        ) {
            daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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
                        'approvals.$.timestamp': moment().utcOffset(8).toDate(),
                        status: 'pending'
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
                date: moment().utcOffset(8).toDate(),
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
            //     from: 'protech@lakmns.org',
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
                        'approvals.$.timestamp': moment().utcOffset(8).toDate()
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
                    date: moment().utcOffset(8).toDate(),
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
                //     from: 'protech@lakmns.org',
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

                // Calculate the difference in hours between the two dates
                if (
                    checkLeave.type === 'Annual Leave' ||
                    checkLeave.type === 'Sick Leave'
                ) {
                    daysDifference = calculateBusinessDays(startDate, returnDate);
                } else if (checkLeave.type === 'Half Day Leave') {
                    numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = calculateBusinessDays(startDate, moment().utcOffset(8).startOf('day').toDate());
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
                    daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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
                date: moment().utcOffset(8).toDate(),
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
            //     from: 'protech@lakmns.org',
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
                user.isAdmin && user.section === 'Human Resource Management Division'
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
                            'approvals.$.timestamp': moment().utcOffset(8).toDate()
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
                const checkUser = await User.findOne({ _id: firstRecipientId });

                const startDate = checkLeave.date.start;
                const returnDate = checkLeave.date.return;

                // Calculate the difference in hours between the two dates
                if (
                    checkLeave.type === 'Annual Leave'
                ) {
                    if (checkUser.isNonOfficeHour) {
                        daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
                    } else {
                        daysDifference = calculateBusinessDays(startDate, returnDate);
                    }
                } else if (checkLeave.type === 'Half Day Leave') {
                    numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = calculateBusinessDays(startDate, moment().utcOffset(8).startOf('day').toDate());
                } else if (
                    checkLeave.type === 'Marriage Leave' ||
                    checkLeave.type === 'Paternity Leave' ||
                    checkLeave.type === 'Maternity Leave' ||
                    checkLeave.type === 'Attend Exam Leave' ||
                    checkLeave.type === 'Hajj Leave' ||
                    checkLeave.type === 'Unpaid Leave' ||
                    checkLeave.type === 'Special Leave' ||
                    checkLeave.type === 'Extended Sick Leave' ||
                    checkLeave.type === 'Sick Leave'
                ) {
                    daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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

                // // send noti
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
                    date: moment().utcOffset(8).toDate(),
                    title: 'Leave application approved',
                    type: 'Leave request',
                    description: 'Approved a leave request'
                });

                activityUser.save();

                const firstRecipientEmail = await User.findOne({
                    _id: firstRecipientId
                });

                // let mailOptions = {
                //     from: 'protech@lakmns.org',
                //     to: firstRecipientEmail.email,
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

//ATTENDANCE
app.get('/attendance', restrictAccess, async function (req, res) {
    const uniqueIdentifier = generateUniqueIdentifier();

    res.render('attendance', {
        uuid: uuidv4(),
        uniqueIdentifier: uniqueIdentifier
    });
});

// UPDATE REMARKS ATTENDANCE
app.post('/attendance/update/remarks/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const id = req.params.id;
        console.log(id);
        console.log(req.body.remarks)

        const attendance = await Attendance.findOneAndUpdate(
            { _id: id },
            { $set: { remarks: req.body.remarks } },
            { upsert: true }
        )

        if (attendance) {
            console.log('Update remark success:', req.body.remarks);
            res.redirect('/profile');
        }
    }
});

app.get('/attendance/acknowledged/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            console.error(`User not found for username: ${username}`);
            return res.status(404).send('User not found');
        }

        const id = req.params.id;
        console.log(id);

        const findAttendance = await Attendance.findOne({ _id: id });

        if (!findAttendance) {
            console.error(`Attendance record not found for ID: ${id}`);
            return res.status(404).send('Attendance record not found');
        }

        console.log('Found Attendance:', findAttendance);

        const updatedAttendance = await Attendance.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    status: 'Present',
                    type: 'manual add',
                    remarks: `${findAttendance.remarks} - Acknowledged by ${user.position}`
                }
            },
            { new: true, upsert: true } // `new: true` to return the updated document
        );

        if (updatedAttendance) {
            console.log('Update attendance status success:', updatedAttendance.remarks);
            return res.redirect('/');
        } else {
            console.error('Failed to update attendance status');
            return res.status(500).send('Failed to update attendance status');
        }
    } catch (error) {
        console.error('Error during attendance update:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// SCAN QR PAGE
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

// ATTENDANCE TODAY FOR HOD PAGE
app.get('/attendance/today/department/section', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('attendance-records', {
            user: user,
            notifications: notifications,
            uuid: uuidv4()
        });
    }
}
);

//HUMAN RESOURCES
app.get('/human-resource/staff-members/overview', isAuthenticated, async function (req, res) {
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

app.get('/human-resource/staff-members/overview/update/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const userId = req.params.id;

    if (user) {
        const otherUser = await User.findOne({ _id: userId });

        res.render('hr-staffmembers-overview-update', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            // data
            otherUser: otherUser
        });
    }
}).post('/human-resource/staff-members/overview/update/:id', isAuthenticated, async function (req, res) {
    const userId = req.params.id;

    const {
        fullname, classification, grade, position, department, section, dateEmployed,
        isOfficer, isAdmin, isHeadOfDepartment, isHeadOfSection, isManagement, isPersonalAssistant, isDriver, isTeaLady, isNonOfficeHour
    } = req.body;

    // Initialize updatedFields with the extracted values
    const updatedFields = { fullname, classification, grade, position, department, section, dateEmployed };

    // Function to filter out empty fields
    const filterEmptyFields = (fields) => {
        const filteredFields = {};
        for (const key in fields) {
            if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
                filteredFields[key] = fields[key];
            }
        }
        return filteredFields;
    };

    // Filter out empty fields
    const nonEmptyUpdatedFields = filterEmptyFields(updatedFields);

    // Function to check boolean fields
    const isFieldTrue = (field) => field && field !== 'no' && field !== 'Select an option';

    // Update boolean fields
    nonEmptyUpdatedFields.isOfficer = isFieldTrue(isOfficer);
    nonEmptyUpdatedFields.isAdmin = isFieldTrue(isAdmin);
    nonEmptyUpdatedFields.isHeadOfDepartment = isFieldTrue(isHeadOfDepartment);
    nonEmptyUpdatedFields.isHeadOfSection = isFieldTrue(isHeadOfSection);
    nonEmptyUpdatedFields.isManagement = isFieldTrue(isManagement);
    nonEmptyUpdatedFields.isPersonalAssistant = isFieldTrue(isPersonalAssistant);
    nonEmptyUpdatedFields.isDriver = isFieldTrue(isDriver);
    nonEmptyUpdatedFields.isTeaLady = isFieldTrue(isTeaLady);
    nonEmptyUpdatedFields.isNonOfficeHour = isFieldTrue(isNonOfficeHour);


    const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: nonEmptyUpdatedFields },
        { new: true, useFindAndModify: false, runValidators: true }
    );

    if (!updatedUser) {
        console.log('Failed to update');
    } else {
        // activity
        const activityUser = new Activity({
            user: req.user._id,
            date: moment().utcOffset(8).toDate(),
            title: 'Update Staff Data',
            type: 'Admin',
            description:
                req.user.fullname +
                ' has updated staff '
                + updatedUser.username +
                ' at '
                + getDateFormat2(moment().utcOffset(8).toDate())
        });

        await activityUser.save();

        console.log('New activity submitted', activityUser);
    }

    res.redirect('/human-resource/staff-members/overview/update/' + userId);
});

app
    .get('/human-resource/staff-members/add-staff', isAuthenticated, async function (req, res) {
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
    .post('/human-resource/staff-members/add-staff', isAuthenticated, async function (req, res) {
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

            // Process boolean fields
            const isFieldTrue = (field) => field && field !== 'no' && field !== 'Select an option';

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
                isHeadOfDepartment: isFieldTrue(req.body.isHeadOfDepartment),
                isHeadOfSection: isFieldTrue(req.body.isHeadOfSection),
                isAdmin: isFieldTrue(req.body.isAdmin),
                isManagement: isFieldTrue(req.body.isManagement),
                isPersonalAssistant: isFieldTrue(req.body.isPersonalAssistant),
                isDriver: isFieldTrue(req.body.isDriver),
                isTealady: isFieldTrue(req.body.isTealady),
                isNonOfficeHour: isFieldTrue(req.body.isNonOfficeHour),
            });

            User.register(newUser, req.body.password, async function (err, user) {
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
                    // Create a new UserLeave document for the user
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

                    await newUserLeave.save();

                    const createInfo = new Info({
                        user: user._id,
                        status: 'New staff',
                        emailVerified: false,
                        phoneVerified: false,
                        isOnline: false,
                        lastSeen: moment().utcOffset(8).toDate()
                    });
                    await createInfo.save();
                    console.log('New info document created:', createInfo);

                    // activity
                    const activityUser = new Activity({
                        user: user1._id,
                        date: moment().utcOffset(8).toDate(),
                        title: 'Add new staff',
                        type: 'Admin HR',
                        description:
                            user1.fullname +
                            ' has add staff '
                            + newUserLeave.username +
                            ' at '
                            + getDateFormat2(moment().utcOffset(8).toDate())
                    });

                    activityUser.save();

                    console.log('New activity submitted', activityUser);

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
    });


app.get('/human-resource/leave/overview', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const allLeave = await Leave.find().sort({ timestamp: -1 });
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

app.get('/human-resource/leave/balances', isAuthenticated, async function (req, res) {
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
            allUser: allUser,
            show: '',
            alert: ''
        });
    }
}
);

app.get('/human-resource/leave/balances/update/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const checkUser = req.params.id;

    if (user) {
        const userLeave = await UserLeave.findOne({ user: checkUser })
            .populate('user')
            .exec();

        res.render('hr-leave-balances-update', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            userLeave: userLeave,
        });
    }
}).post('/human-resource/leave/balances/update/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    const userId = req.params.id;
    const {
        annualtotal, annualtaken, sicktotal, sicktaken,
        sickExtendedTotal, sickExtendedTaken, emergency,
        attendexam, marriage, paternity, unpaid, special, hajj
    } = req.body;

    const allUserLeave = await UserLeave.find();
    const allUser = await User.find();
    const userLeave = await UserLeave.findOne({ user: userId })
        .populate('user')
        .exec();

    // Initialize an empty object to store the fields to update
    const updatedFields = {};

    // Helper function to add fields to updatedFields if they have a value
    const addFieldIfExists = (field, value) => {
        if (value !== undefined && value !== '') {
            updatedFields[field] = parseFloat(value, 10).toFixed(1);
        }
    };

    // Add fields to updatedFields only if they have a value
    addFieldIfExists('annual.leave', annualtotal);
    addFieldIfExists('annual.taken', annualtaken);
    addFieldIfExists('sick.leave', sicktotal);
    addFieldIfExists('sick.taken', sicktaken);
    addFieldIfExists('sickExtended.leave', sickExtendedTotal);
    addFieldIfExists('sickExtended.taken', sickExtendedTaken);
    addFieldIfExists('emergency.taken', emergency);
    addFieldIfExists('attendExam.taken', attendexam);
    addFieldIfExists('marriage.taken', marriage);
    addFieldIfExists('paternity.taken', paternity);
    addFieldIfExists('unpaid.taken', unpaid);
    addFieldIfExists('special.taken', special);
    addFieldIfExists('hajj.taken', hajj);

    try {
        const updatedLeave = await UserLeave.findOneAndUpdate(
            { user: userId },
            { $set: updatedFields },
            { new: true, useFindAndModify: false }
        );

        const findUser = await User.findOne({ _id: userId });

        if (!updatedLeave) {
            console.log('Failed to update');
        } else {
            // activity
            const activityUser = new Activity({
                user: user._id,
                date: moment().utcOffset(8).toDate(),
                title: 'Update staff leave balances',
                type: 'Admin',
                description:
                    user.fullname +
                    ' has update staff leave balances '
                    + findUser.username +
                    ' at '
                    + getDateFormat2(moment().utcOffset(8).toDate())
            });

            activityUser.save();

            console.log('New activity submitted', activityUser);
        }

        res.redirect('/human-resource/leave/balances/update/' + userId);
    } catch (err) {
        res.render('hr-leave-balances', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            allUserLeave: allUserLeave,
            allUser: allUser,
            show: 'show',
            alert: userLeave.user.fullname + ' leave balances update failed!'
        });
    }
});

app.get('/human-resource/attendance/overview', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const startOfToday = moment().utcOffset(8).startOf('day').toDate();
        const endOfToday = moment().utcOffset(8).endOf('day').toDate();

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

//PROCUREMENT

//TENDER 

//TENDER REGISTER
app.get('/procurement/tender/register', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('procurement-tender-register', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        })
    }
});

//TENDER LIST
app.get('/procurement/tender/register', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('procurement-tender-list', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        })
    }
});

//AUXILIARY POLICE

// DUTY HANDOVER
app.get('/auxiliary-police/duty-handover/submit', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('auxiliarypolice-dutyhandover-submit', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            show: '',
            alert: '',
        });
    }

}).post('/auxiliary-police/duty-handover/submit', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });
    const { location, date, shift, time, notes, shiftStaff, dutyHandoverId } = req.body;

    try {

        let dutyHandover = await DutyHandoverAux.findOne({
            location: location,
            date: moment(date).utcOffset(8).toDate(),
            time: time,
            shift: shift
        });

        if (dutyHandover) {
            // Update existing duty handover
            dutyHandover.remarks = notes;
            dutyHandover.staff = shiftStaff;
            dutyHandover.status = 'completed';
            dutyHandover.timestamp = moment().utcOffset(8).toDate();

            await dutyHandover.save();
            console.log('Exisitng handover updated');
            res.render('auxiliarypolice-dutyhandover-submit', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'Existing handover updated',
            });
        } else {
            // update duty handover based on id
            await DutyHandoverAux.findByIdAndUpdate(
                dutyHandoverId,
                { status: 'completed' },
                { new: true } // To return the updated document
            );

            // Create a new duty handover
            dutyHandover = new DutyHandoverAux({
                headShift: user.fullname,
                date: moment(date).utcOffset(8).toDate(),
                location: location,
                remarks: notes,
                status: "pending",
                shift: shift,
                time: time,
                staff: shiftStaff,
                timestamp: moment().utcOffset(8).toDate()
            });

            const create = await dutyHandover.save();
            const newReport = await createPatrolReport(dutyHandoverId, location, date, shift, time, shiftStaff);

            console.log('New duty handover and patrol report created', create, newReport);
            res.render('auxiliarypolice-dutyhandover-submit', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'New duty handover and patrol report created',
            });
        }
    } catch (error) {
        console.error('Error updating duty handover:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/auxiliary-police/duty-handover/view', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const bmi = await DutyHandoverAux.find({
            location: 'Baitul Makmur I',
        }).sort({ date: -1 });

        const bmii = await DutyHandoverAux.find({
            location: 'Baitul Makmur II',
        }).sort({ date: -1 });

        const jm = await DutyHandoverAux.find({
            location: 'Jamek Mosque',
        }).sort({ date: -1 });

        const cm = await DutyHandoverAux.find({
            location: 'City Mosque',
        }).sort({ date: -1 });

        const rs = await DutyHandoverAux.find({
            location: 'Raudhatul Sakinah',
        }).sort({ date: -1 });

        res.render('auxiliarypolice-dutyhandover-view', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            bmi: bmi,
            bmii: bmii,
            jm: jm,
            cm: cm,
            rs: rs
        });
    }

});

// SEARCH DUTY HANDOVER
app.get('/search-duty-handover', isAuthenticated, async function (req, res) {
    const { location, date, shift, time } = req.query;

    let shiftTime;
    let adjustedDate = moment(date).utcOffset(8).toDate();

    if (time === '0700') {
        shiftTime = '2300';
        adjustedDate.setDate(adjustedDate.getDate() - 1); // Subtract one day
    } else if (time === '1500') {
        shiftTime = '0700';
    } else if (time === '2300') {
        shiftTime = '1500';
    }

    const results = await DutyHandoverAux.findOne({
        location: location,
        date: adjustedDate,
        time: shiftTime
    });

    const resultsSchedule = await ScheduleAux.findOne({
        location: location,
        date: moment(date).utcOffset(8).toDate(),
        'shift.shiftName': shift
    });

    const response = {
        dutyHandover: results,
        shiftSchedule: resultsSchedule
    }

    console.log(response.shiftSchedule);

    res.json(response);
});

// SCHEDULE VIEW
app.get('/auxiliary-police/schedule/view', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('auxiliarypolice-schedule-view', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        });
    }
});

// SCHEDULE ADD
app.get('/auxiliary-police/schedule/add', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {

        res.render('auxiliarypolice-schedule-add', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            show: '',
            alert: ''
        });
    }
}).post('/auxiliary-police/schedule/add', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        const {
            location,
            date,
            selectedNames1,
            selectedNames2,
            selectedNames3,
            selectedNames4 = '',  // Optional field for Shift D
            time1,
            time2,
            time3,
            time4 = '',  // Optional field for Shift D
            selectedNames5 = '',  // Optional field for Raised Flag Duty
            selectedNames6 = ''  // Optional field for Lowered Flag Duty
        } = req.body;

        console.log('Received form data:', {
            location,
            date,
            selectedNames1,
            selectedNames2,
            selectedNames3,
            selectedNames4,
            time1,
            time2,
            time3,
            time4,
            selectedNames5,
            selectedNames6
        });

        if (!location || !date || !selectedNames1 || !selectedNames2 || !selectedNames3 || time1 === 'Select shift time' || time2 === 'Select shift time' || time3 === 'Select shift time' || (selectedNames4 && time4 === 'Select shift time')) {
            console.log('Failed to add auxiliary police schedule');
            res.render('auxiliarypolice-schedule-add', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'All form must be filled, there is an empty input'
            });
        } else {
            // Ensure the selected names are split into arrays
            const selectedNames1Array = selectedNames1 ? selectedNames1.split(',') : [];
            const selectedNames2Array = selectedNames2 ? selectedNames2.split(',') : [];
            const selectedNames3Array = selectedNames3 ? selectedNames3.split(',') : [];
            const selectedNames4Array = selectedNames4 ? selectedNames4.split(',') : [];  // Handle new shift
            const staffRaisedFlagArray = selectedNames5 ? selectedNames5.split(',') : [];  // Handle raised flag duty
            const staffLoweredFlagArray = selectedNames6 ? selectedNames6.split(',') : [];  // Handle lowered flag duty

            console.log('Parsed selected names arrays:', {
                selectedNames1Array,
                selectedNames2Array,
                selectedNames3Array,
                selectedNames4Array,
                staffRaisedFlagArray,
                staffLoweredFlagArray
            });

            // Construct the shifts array
            const shifts = [
                { shiftName: 'Shift A', staff: selectedNames1Array, time: time1 },
                { shiftName: 'Shift B', staff: selectedNames2Array, time: time2 },
                { shiftName: 'Shift C', staff: selectedNames3Array, time: time3 },
                ...(selectedNames4Array.length > 0 ? [{ shiftName: 'Shift D', staff: selectedNames4Array, time: time4 }] : [])
            ];

            // Log shifts array for debugging
            console.log('Constructed shifts array:', shifts);

            const findSchedule = await ScheduleAux.findOne({
                location: location,
                date: moment(date).utcOffset(8).toDate()
            });

            if (findSchedule) {
                const updateSchedule = await ScheduleAux.findOneAndUpdate(
                    { location: location, date: moment(date).utcOffset(8).toDate() },
                    {
                        $set: {
                            shift: shifts,
                            staffRaisedFlag: staffRaisedFlagArray,
                            staffLoweredFlag: staffLoweredFlagArray
                        }
                    },
                    { upsert: true }
                );

                if (updateSchedule) {
                    console.log('Successfully updated auxiliary police schedule');
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully updated auxiliary police schedule on'
                    });
                }
            } else {
                const newSchedule = new ScheduleAux({
                    date: moment(date).utcOffset(8).toDate(),
                    location: location,
                    shift: shifts,
                    staffRaisedFlag: staffRaisedFlagArray,
                    staffLoweredFlag: staffLoweredFlagArray
                });

                const saveSchedule = await newSchedule.save();

                if (saveSchedule) {
                    console.log('Successfully added auxiliary police schedule on ' + date);
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully added auxiliary police schedule on ' + date
                    });
                } else {
                    console.log('Failed to add auxiliary police schedule on ' + date);
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Failed to add auxiliary police schedule on ' + date
                    });
                }
            }
        }
    }
});



// CASE

// VIEW
app.get('/auxiliary-police/case/view', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const caseReport = await CaseAux.find().sort({ date: -1 });

        res.render('auxiliarypolice-case-view', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            caseReport: caseReport
        });
    }
});

// DETAIL
app.get('/auxiliary-police/case/details/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const id = req.params.id;
        const caseReport = await CaseAux.findOne({ _id: id });

        res.render('auxiliarypolice-case-detail', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            caseReport: caseReport
        });
    }
});

// ADD
app.get('/auxiliary-police/case/add', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('auxiliarypolice-case-add', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            show: '',
            alert: ''
        });
    }
}).post('/auxiliary-police/schedule/add', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    if (user) {
        const {
            location,
            date,
            selectedNames1,
            selectedNames2,
            selectedNames3,
            selectedNames4 = '',  // Optional field for Shift D
            time1,
            time2,
            time3,
            time4 = '',  // Optional field for Shift D
            selectedNames5 = '',  // Optional field for Raised Flag Duty
            selectedNames6 = ''  // Optional field for Lowered Flag Duty
        } = req.body;

        if (!location || !date || !selectedNames1 || !selectedNames2 || !selectedNames3 || time1 === 'Select shift time' || time2 === 'Select shift time' || time3 === 'Select shift time' || (selectedNames4 && time4 === 'Select shift time')) {
            console.log('Failed to add auxiliary police schedule');
            res.render('auxiliarypolice-schedule-add', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'All form must be filled, there is an empty input'
            });
        } else {
            // Ensure the selected names are split into arrays
            const selectedNames1Array = selectedNames1 ? selectedNames1.split(',') : [];
            const selectedNames2Array = selectedNames2 ? selectedNames2.split(',') : [];
            const selectedNames3Array = selectedNames3 ? selectedNames3.split(',') : [];
            const selectedNames4Array = selectedNames4 ? selectedNames4.split(',') : [];  // Handle new shift
            const staffRaisedFlagArray = selectedNames5 ? selectedNames5.split(',') : [];  // Handle raised flag duty
            const staffLoweredFlagArray = selectedNames6 ? selectedNames6.split(',') : [];  // Handle lowered flag duty

            // Construct the shifts array
            const shifts = [
                { shiftName: 'Shift A', staff: selectedNames1Array, time: time1 },
                { shiftName: 'Shift B', staff: selectedNames2Array, time: time2 },
                { shiftName: 'Shift C', staff: selectedNames3Array, time: time3 },
                ...(selectedNames4Array.length > 0 ? [{ shiftName: 'Shift D', staff: selectedNames4Array, time: time4 }] : [])
            ];

            // Log shifts array for debugging
            console.log('Constructed shifts array:', shifts);

            const findSchedule = await ScheduleAux.findOne({
                location: location,
                date: moment(date).utcOffset(8).toDate()
            });

            if (findSchedule) {
                const updateSchedule = await ScheduleAux.findOneAndUpdate(
                    { location: location, date: moment(date).utcOffset(8).toDate() },
                    {
                        $set: {
                            shift: shifts,
                            staffRaisedFlag: staffRaisedFlagArray,
                            staffLoweredFlag: staffLoweredFlagArray
                        }
                    },
                    { upsert: true }
                );

                if (updateSchedule) {
                    console.log('Successfully updated auxiliary police schedule');
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully updated auxiliary police schedule on'
                    });
                }
            } else {

                const newSchedule = new ScheduleAux({
                    date: moment(date).utcOffset(8).toDate(),
                    location: location,
                    shift: shifts,
                    staffRaisedFlag: staffRaisedFlagArray,
                    staffLoweredFlag: staffLoweredFlagArray
                });

                const saveSchedule = await newSchedule.save();

                if (saveSchedule) {
                    console.log('Successfully added auxiliary police schedule on ' + date);
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully added auxiliary police schedule on ' + date
                    });
                } else {
                    console.log('Failed to add auxiliary police schedule on ' + date);
                    res.render('auxiliarypolice-schedule-add', {
                        user: user,
                        notifications: notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Failed to add auxiliary police schedule on ' + date
                    });
                }
            }
        }
    }
});

// PATROL

// SHIFT MEMBER LOCATION
app.get('/auxiliary-police/patrol/shift-member-location/view', async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const bmi = await PatrolAux.find({
            location: 'Baitul Makmur I',
            type: 'Shift Member Location'
        }).sort({ date: -1 });

        const bmii = await PatrolAux.find({
            location: 'Baitul Makmur II',
            type: 'Shift Member Location'
        }).sort({ date: -1 });

        const jm = await PatrolAux.find({
            location: 'Jamek Mosque',
            type: 'Shift Member Location'
        }).sort({ date: -1 });

        const cm = await PatrolAux.find({
            location: 'City Mosque',
            type: 'Shift Member Location'
        }).sort({ date: -1 });

        const rs = await PatrolAux.find({
            location: 'Raudhatul Sakinah',
            type: 'Shift Member Location'
        }).sort({ date: -1 });

        res.render('auxiliarypolice-patrol-shiftmemberlocation-view', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            bmi: bmi,
            bmii: bmii,
            jm: jm,
            cm: cm,
            rs: rs
        });
    }
});

app.get('/auxiliary-police/patrol/shift-member-location/details/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const id = req.params.id;

        const checkReport = await PatrolAux.findOne({ _id: id });

        const shiftMemberCycles = checkReport.shiftMember.cycle;

        const currentTime = moment.utc().add(8, 'hours').format('HH:mm:ss');

        const currentTimeNumeric = parseInt(currentTime.replace(':', ''), 10);

        for (const cycle of shiftMemberCycles) {
            const startTimeNumeric = parseInt(cycle.timeSlot.split('-')[0], 10);
            const endTimeNumeric = parseInt(cycle.timeSlot.split('-')[1], 10);

            console.log(startTimeNumeric);
            console.log(endTimeNumeric);

            if (cycle.timeSlot === '2300-0000') {
                if (
                    currentTimeNumeric >= startTimeNumeric &&
                    currentTimeNumeric >= endTimeNumeric
                ) {
                    var currentTimeSlot = cycle.timeSlot;
                    break;
                }
            } else {
                if (
                    currentTimeNumeric >= startTimeNumeric &&
                    currentTimeNumeric <= endTimeNumeric
                ) {
                    var currentTimeSlot = cycle.timeSlot;
                    break;
                }
            }
        }

        if (currentTimeSlot === undefined) {
            // Handle the case when no matching time slot is found
            console.log('No matching time slot found.');
        }

        // Function to count times with values in a cycle
        function countTimesWithValuesInCycle(cycle) {
            let timesWithValuesCount = 0;

            for (const checkpoint of cycle.checkpoint) {
                // Check if the time property has a non-empty value
                if (checkpoint.time && checkpoint.time.trim() !== '') {
                    timesWithValuesCount++;
                }
            }

            return timesWithValuesCount;
        }

        // Function to count total times in a cycle
        function countTotalTimesInCycle(cycle) {
            return cycle.checkpoint.length;
        }

        // Function to count total times with values in all cycles
        function countTotalTimesWithValuesInShift(shiftMemberCycles) {
            let totalTimesWithValuesInShift = 0;
            let totalTimesInShift = 0;

            for (const cycle of shiftMemberCycles) {
                totalTimesWithValuesInShift += countTimesWithValuesInCycle(cycle);
                totalTimesInShift += countTotalTimesInCycle(cycle);
            }

            return { totalTimesWithValuesInShift, totalTimesInShift };
        }

        // Count total times with values and total times in the shift
        const { totalTimesWithValuesInShift, totalTimesInShift } =
            countTotalTimesWithValuesInShift(shiftMemberCycles);

        // Calculate percentage
        const percentageTimesWithValuesInShift =
            (totalTimesWithValuesInShift / totalTimesInShift) * 100;

        console.log('Check Report', checkReport);
        console.log('Shift Cycle', shiftMemberCycles);
        console.log('Current time slot', currentTimeSlot);
        console.log('Percentage', percentageTimesWithValuesInShift.toFixed(0));

        res.render('auxiliarypolice-patrol-shiftmemberlocation-detail', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            // data extracted
            patrolReport: checkReport,
            reportId: id,
            cycle: shiftMemberCycles,
            currentTimeSlot: currentTimeSlot,
            progressReport: percentageTimesWithValuesInShift.toFixed(0),
        });
    }
});

// PATROL UNIT
app.get('/auxiliary-police/patrol/patrol-unit/view', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {

        const patrolUnit = await PatrolAux.find({
            type: 'Patrol Unit'
        }).sort({ date: -1 });

        res.render('auxiliarypolice-patrol-patrolunit-view', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            patrolUnit: patrolUnit
        });

    }
});

app.get('/auxiliary-police/patrol/patrol-unit/details/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    const reportId = req.params.id;

    if (user) {

        const checkReport = await PatrolAux.findOne({
            _id: reportId
        });

        // Check for amount of time for checkpoint being submit or not
        let nonEmptyTimeCount = 0;
        const totalPatrolUnits = checkReport.patrolUnit.length;

        console.log(checkReport.patrolUnit.length);

        // Check each patrol unit for non-empty time
        checkReport.patrolUnit.forEach(patrolUnit => {
            if (patrolUnit.time && patrolUnit.time.trim() !== '') {
                nonEmptyTimeCount++;
            }
        });

        const percentageNonEmptyTime =
            (nonEmptyTimeCount / totalPatrolUnits) * 100;


        res.render('auxiliarypolice-patrol-patrolunit-detail', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            // patrol report
            patrolReport: checkReport,
            percentage: percentageNonEmptyTime.toString(),
            reportId: reportId,
        });
    }
});

app.post('/remarks/update/:id', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {
        const id = req.params.id;

        const patrol = await PatrolAux.findOneAndUpdate(
            { _id: id },
            { $set: { remarks: req.body.remarks } },
            { new: true }
        );

        if (patrol) {
            console.log('Successfully update remarks on this patrol report');
            res.redirect('/auxiliary-police/patrol/patrol-unit/' + patrol._id);
        } else {
            console.log('Failed to update remarks on this patrol report');
            res.redirect('/auxiliary-police/patrol/patrol-unit/' + patrol._id);
        }
    }
});

// SUBMIT CHECKPOINT DATA WITH QR SCAN
app.get(
    '/patrol-unit/checkpoint-submit/:checkpointName/:longitude/:latitude',
    async function (req, res) {
        const dateToday = dateLocal.getDate();
        const kualaLumpurTimeZoneOffset1 = 8; // Kuala Lumpur is UTC+8
        const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60); // Convert hours to minutes

        // Get the current time in the Asia/Kuala_Lumpur timezone
        const time = now1.format('HHmm') + 'HRS';

        console.log(dateToday);

        const checkpointName = _.startCase(
            req.params.checkpointName.replace(/-/g, ' ')
        );
        const currentLongitude = req.params.longitude;
        const currentLatitude = req.params.latitude;

        const logReport = 'Have patrol this area at ' + time;

        const updatedCheckpointData = {
            time: time, // Replace with the new time
            longitude: currentLongitude, // Replace with the new longitude
            latitude: currentLatitude, // Replace with the new latitude
            logReport: logReport
        };

        // Find the patrol report by ID and update the specific checkpoint in the patrolUnit array
        const checkPatrolUnit = await PatrolAux.findOneAndUpdate(
            {
                type: 'Patrol Unit',
                date: moment().utcOffset(8).toDate(),
                'patrolUnit.checkpointName': checkpointName
            },
            {
                $set: {
                    'patrolUnit.$.time': updatedCheckpointData.time,
                    'patrolUnit.$.longitude': updatedCheckpointData.longitude,
                    'patrolUnit.$.latitude': updatedCheckpointData.latitude,
                    'patrolUnit.$.logReport': updatedCheckpointData.logReport
                }
            },
            { new: true, useFindAndModify: false }
        );

        if (checkPatrolUnit.status === 'Open' && checkPatrolUnit) {

            console.log(checkPatrolUnit._id);

            console.log(
                'Successfully update on patrol unit for at ' +
                checkpointName
            );
            res.render('submit-success');
        } else {
            console.log('Unsuccessful update the qr data due to closed status!');
            res.render('submit-failed');
        }
    }
);

// MAP COORDINATES
app.get('/map-coordinates/:reportId', async (req, res) => {
    const reportId = req.params.reportId;

    try {
        // Use findOne to find a single report based on the reportId
        const patrolReport = await PatrolAux.findOne({ _id: reportId });

        if (!patrolReport) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Extract checkpoint coordinates within the patrolReport and format them
        const checkpointCoordinates = patrolReport.patrolUnit.map(checkpoint => [
            checkpoint.longitude,
            checkpoint.latitude
        ]);

        // Send the retrieved checkpoint coordinates as JSON
        res.json(checkpointCoordinates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Select fullname
app.get(
    '/shift-member/fullname-submit/:location/:checkpointName',
    async function (req, res) {
        // init the params from the link
        const location = _.startCase(req.params.location.replace(/-/g, ' '));

        // init the params from the link
        const checkpointName = _.startCase(
            req.params.checkpointName.replace(/-/g, ' ')
        );

        const today = moment().utcOffset(8).startOf('day').toDate();

        const kualaLumpurTimeZoneOffset1 = 8; // Kuala Lumpur is UTC+8
        const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60); // Convert hours to minutes

        // Get the current time in the Asia/Kuala_Lumpur timezone
        const currentTimeNumeric = now1.format('HHmm');

        // Check if the current time is between 2300 and 0700
        const isNightShift = currentTimeNumeric >= 2300 || currentTimeNumeric < 700;

        if (isNightShift) {
            const filteredReports1 = await PatrolAux.findOne({
                location: location,
                startShift: '2300',
                $or: [{ date: today }, { date: yesterday }]
            });

            console.log(filteredReports1);

            res.render('shift-member-submit', {
                patrolReport: filteredReports1,
                location: location,
                checkpointName: checkpointName
            });
        } else {
            const filteredReports2 = await PatrolAux.findOne({
                location: location,
                date: { $gte: currentTimeNumeric },
                startShift: { $gte: currentTimeNumeric },
                endShift: { $gte: currentTimeNumeric }
            });

            console.log(filteredReports2);

            res.render('shift-member-submit', {
                patrolReport: filteredReports2,
                location: location,
                checkpointName: checkpointName
            });
        }
    }
);

// SUBMIT DATA USING QR SCANNER
app.get(
    '/shift-member/checkpoint-submit/:location/:checkpointName/:shiftMember/:reportId',
    async function (req, res) {
        const checkUser = await User.findOne({ fullname: req.params.shiftMember });

        const reportId = req.params.reportId;

        // init the params from the link
        const checkpointName = _.startCase(
            req.params.checkpointName.replace(/-/g, ' ')
        );
        // init the params from the link
        const location = _.startCase(req.params.location.replace(/-/g, ' '));

        if (checkUser) {
            // Find a patrol report where the staff array contains the user's full name
            const patrolReport = await PatrolAux.findOne({
                _id: reportId
            });

            if (patrolReport && patrolReport.status === 'Pending') {
                // Find the relevant cycle based on your logic and checkpointName
                const cycleToUpdate = patrolReport.shiftMember.cycle.find(cycle =>
                    cycle.checkpoint.some(
                        checkpoint =>
                            checkpoint.checkpointName === checkpointName &&
                            isWithinTimeSlot(cycle.timeSlot)
                    )
                );

                // Function to check if the current time is within the given time slot
                function isWithinTimeSlot(timeSlot) {
                    // Parse the start and end times from the time slot
                    const [startTime, endTime] = timeSlot.split('-');

                    // Get the current time in numeric format (e.g., HHmm)
                    const currentTimeNumeric = moment.utc().add(8, 'hours').format('HH:mm:ss');
                    const currentTime = parseInt(currentTimeNumeric.replace(':', ''), 10);

                    var startNumeric = '';
                    var endNumeric = '';

                    // Convert start and end times to numeric format
                    startNumeric = parseInt(startTime.replace(':', ''), 10);
                    endNumeric = parseInt(endTime.replace(':', ''), 10);

                    if (endNumeric === 0) {
                        endNumeric = 2400;
                    }

                    if (startNumeric <= endNumeric) {
                        return currentTime >= startNumeric && currentTime <= endNumeric;
                    } else {
                        // Handle the case where the time slot spans midnight
                        return currentTime >= startNumeric || currentTime <= endNumeric;
                    }
                }

                if (cycleToUpdate) {
                    // Find the checkpoint with the matching checkpointName
                    const checkpointToUpdate = cycleToUpdate.checkpoint.find(
                        checkpoint => checkpoint.checkpointName === checkpointName
                    );

                    if (checkpointToUpdate) {
                        // Get the current time in numeric format (e.g., HHmm)
                        const currentTimeNumeric1 = moment.utc().add(8, 'hours').format('HH:mm:ss')
                        const currentTime1 = parseInt(
                            currentTimeNumeric1.replace(':', ''),
                            10
                        );

                        const inputString = checkUser.fullname;

                        // Update the time in the found checkpoint with the current time
                        checkpointToUpdate.time = currentTime1 + 'HRS';
                        checkpointToUpdate.logReport =
                            checkpointName +
                            ' have been patrol by ' +
                            inputString +
                            ' at ' +
                            currentTime1 +
                            'HRS';
                        checkpointToUpdate.username = checkUser.username;
                        checkpointToUpdate.fullName = inputString;

                        // Save the changes to the database
                        await patrolReport.save();

                        console.log('Successful update using QR scanner!');

                        res.render('submit-success');
                    } else {
                        console.log('Checkpoint not found in the cycle.');
                        res.render('submit-failed');
                    }
                } else {
                    console.log('Cycle not found.');
                    res.render('submit-failed');
                }
            } else {
                console.log(
                    'No patrol report found for the user or the patrol report is already closed.'
                );
                res.render('submit-failed');
            }
        }
    }
);

// SUBMIT SUCCESS

app.get('/submit-success', async function (req, res) {
    res.render('submit-success');
});

app.get('/submit-failed', async function (req, res) {
    res.render('submit-failed');
});

//NOTIFICATIONS
app.get('/notifications/history', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    // init day using moment

    const today = moment().utcOffset(8).startOf('day').toDate();
    const tomorrow = moment(today).add(1, 'days').toDate();
    const yesterday = moment(today).subtract(1, 'days').toDate();
    const firstDayOfWeek = moment(today).startOf('isoWeek').toDate();
    const lastDayOfWeek = moment(today).endOf('isoWeek').toDate();
    const firstDayOfMonth = moment(today).startOf('month').toDate();
    const lastDayOfMonth = moment(today).endOf('month').toDate();


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

//FILES

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
            const today = moment().utcOffset(8).startOf('day').toDate();
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
        const otherFile = await File.find({ name: deleted.name, size: deleted.size });

        if (otherFile.length > 0) {
            console.log('Only delete the file database');
        } else {
            const filePath = __dirname + '/public/uploads/' + deleted.name;
            console.log('File selected is deleted!');
            await fs.unlink(filePath);
        }

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

        res.redirect('/leave/request');
    } else {
        console.log('No files found or there was an error deleting files.');
        res.redirect('/');
    }
});

// FECTH API

// STATUS UPDATE
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

// ATTENDACE TODAY DATA FOR ALL
app.get('/api/all-attendance/today/all', async function (req, res) {
    try {
        // Get today's date
        const today = moment().utcOffset(8).startOf('day').toDate();// Set hours, minutes, seconds, and milliseconds to 0 to get the start of the day

        // Get the current time
        const currentTime = moment().utcOffset(8);

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
                datetime: formatDateTime(moment(entry.date.signInTime).utcOffset(8).toDate()),
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

// ATTENDACE TODAY DATA FOR HR
app.post('/api/data/all-attendance/today/human-resources', isAuthenticated, async function (req, res) {
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 5; // Number of items per page
    const skip = (page - 1) * limit;

    const username = req.user.username;
    const user = await User.findOne({ username: username });

    // Get today's date
    const today = moment().startOf('day').toDate(); // Start of today in local time

    try {
        // Query attendance records for today
        const attendanceData = await Attendance.aggregate([
            // Match attendance records for today
            {
                $match: {
                    timestamp: {
                        $gte: today, // Find records where timestamp is greater than or equal to today
                        $lt: moment().endOf('day').toDate() // Less than end of today
                    }
                }
            },
            // Group by user and status, include attendance type, sign-in time, and sign-out time
            {
                $group: {
                    _id: '$user',
                    status: { $first: '$status' },
                    type: { $first: '$type' },
                    signInTime: { $first: '$date.signInTime' },
                    signOutTime: { $first: '$date.signOutTime' },
                    timestamp: { $first: '$timestamp' },
                    location: { $first: '$location' },
                    remarks: { $first: '$remarks' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Collect unique user IDs from attendanceData
        const userIds = attendanceData.map(record => record._id);

        // Query all users in the same department or section as the logged-in user, excluding the logged-in user
        const allUser = await User.find();

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
                record._id.equals(user._id)
            );
            return attendanceRecord
                ? {
                    _id: attendanceRecord._id,
                    user: userMap[user._id],
                    status: attendanceRecord.status,
                    type: attendanceRecord.type,
                    signInTime: attendanceRecord.signInTime,
                    signOutTime: attendanceRecord.signOutTime,
                    timestamp: attendanceRecord.timestamp,
                    location: attendanceRecord.location,
                    remarks: attendanceRecord.remarks,
                    count: attendanceRecord.count
                }
                : null;
        }).filter(item => item !== null); // Filter out null entries (users without attendance records)

        // Sort combinedData based on timestamp, placing users without attendance records at the end
        combinedData.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return moment(b.timestamp).diff(moment(a.timestamp));
        });

        // Filter combinedData based on the search query
        const filteredData = combinedData.filter(item => {
            const { fullname, section, department, username } = item.user;
            const { status, type, signInTime, signOutTime, remarks, location } = item;
            const regex = new RegExp(searchQuery, 'i');
            return (
                regex.test(fullname) ||
                regex.test(section) ||
                regex.test(department) ||
                regex.test(username) ||
                regex.test(status) ||
                regex.test(type) ||
                regex.test(location) ||
                regex.test(remarks) ||
                (signInTime &&
                    regex.test(
                        moment(signInTime).format('LT') // Format sign-in time to 'hh:mm A'
                    )) ||
                (signOutTime &&
                    regex.test(
                        moment(signOutTime).format('LT') // Format sign-out time to 'hh:mm A'
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

// GET ALL ATTENDACNE PER DATE ON SELECTED DATE HR
app.post('/api/data/all-attendance/per-date/human-resources', isAuthenticated, async function (req, res) {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    const username = req.user.username;
    const user = await User.findOne({ username: username });

    try {
        const selectedLocalDate = moment(selectedDate).utcOffset(8).startOf('day');

        // Calculate start and end date in UTC based on local time
        const startDate = selectedLocalDate.clone().utc().toDate();
        const endDate = selectedLocalDate.clone().endOf('day').utc().toDate();

        // Query attendance records for the selected date
        const attendanceData = await Attendance.find({
            timestamp: {
                $gte: startDate,
                $lt: endDate
            }
        });

        // Get all users in the same department or section as the logged-in user
        const allUser = await User.find();

        // Create a map for quick lookup of users
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

        // Create combined data with attendance records
        const combinedData = allUser.map(user => {
            const attendanceRecord = attendanceData.find(record => record.user.equals(user._id));
            if (!attendanceRecord) return null;

            return {
                _id: attendanceRecord._id,
                user: userMap[user._id],
                status: attendanceRecord.status,
                type: attendanceRecord.type,
                signInTime: attendanceRecord.date.signInTime,
                signOutTime: attendanceRecord.date.signOutTime,
                timestamp: attendanceRecord.timestamp,
                location: attendanceRecord.location,
                remarks: attendanceRecord.remarks,
            };
        }).filter(item => item !== null);

        // Sort combinedData based on timestamp
        combinedData.sort((a, b) => {
            const dateA = moment(a.timestamp);
            const dateB = moment(b.timestamp);
            return dateB - dateA; // Sort in descending order
        });

        // Filter combinedData based on the search query
        const filteredData = combinedData.filter(item => {
            const { fullname, section, department, username } = item.user;
            const { status, type, signInTime, signOutTime, remarks, location } = item;
            const regex = new RegExp(searchQuery, 'i');
            return (
                regex.test(fullname) ||
                regex.test(section) ||
                regex.test(department) ||
                regex.test(username) ||
                regex.test(status) ||
                regex.test(type) ||
                regex.test(location) ||
                regex.test(remarks) ||
                (signInTime &&
                    regex.test(moment(signInTime)
                        .utcOffset(8) // Asia/Kuala_Lumpur timezone (UTC+8)
                        .format('h:mm A')
                    )) ||
                (signOutTime &&
                    regex.test(
                        moment(signOutTime)
                            .utcOffset(8) // Asia/Kuala_Lumpur timezone (UTC+8)
                            .format('h:mm A')
                    ))
            );
        });

        // Paginate the filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        if (!paginatedData || paginatedData.length === 0) {
            return res.status(404).json({ message: 'No paginated attendance data found' });
        }

        const response = {
            data1: paginatedData,
            data2: filteredData
        };

        // Respond with the paginated and filtered attendance data
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//GET ALL ATTENDANCE DATA PER MONTH ON SELECTED DATE HR
app.post('/api/data/all-attendance/per-month/human-resources', isAuthenticated, async function (req, res) {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    // Extract month and year from the selected date
    const [month, year] = selectedDate.split('/');

    try {
        // Create a set of all possible status types
        const allStatusTypes = ['Present', 'Absent', 'Late', 'Invalid', 'Leave', 'Non Working Day'];
        const allUser = await User.find();

        // Query attendance records based on the month and year
        const attendanceData = await Attendance.aggregate([
            // Match attendance records for the selected month and year
            {
                $match: {
                    timestamp: {
                        $gte: moment([year, month - 1]).startOf('month').toDate(),
                        $lt: moment([year, month]).startOf('month').toDate()
                    }
                }
            },
            // Group by user and status, count occurrences
            {
                $group: {
                    _id: { user: '$user', status: '$status', type: '$type' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const userStatusCounts = {};
        const publicHolidayCounts = {};

        // Initialize status counts and public holiday counts for each user
        allUser.forEach(user => {
            userStatusCounts[user._id] = {};
            allStatusTypes.forEach(statusType => {
                userStatusCounts[user._id][statusType] = 0;
            });
            publicHolidayCounts[user._id] = 0;
        });

        // Update status counts and public holiday counts based on the attendance data
        attendanceData.forEach(({ _id, count }) => {
            const { user, status, type } = _id;
            if (status) {
                userStatusCounts[user][status] = count;
            }
            if (type === 'public holiday') {
                publicHolidayCounts[user] = count;
            }
        });

        // Combine populated attendance data with user status counts and public holiday counts
        const combinedData = allUser.map(user => {
            const statusCounts = userStatusCounts[user._id];
            const publicHolidayCount = publicHolidayCounts[user._id];
            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    section: user.section,
                    department: user.department
                },
                statusCounts: statusCounts,
                publicHolidayCount: publicHolidayCount
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

        console.log(paginatedData);

        // Respond with the paginated and filtered attendance data
        res.json(response);
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ATTENDACE TODAY DATA FOR DEPARTMENT AND SECTION
app.post('/api/data/all-attendance/today/department-section', isAuthenticated, async function (req, res) {
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 5; // Number of items per page
    const skip = (page - 1) * limit;

    const username = req.user.username;
    const user = await User.findOne({ username: username });

    // Get today's date
    const today = moment().startOf('day').toDate(); // Start of today in local time

    try {
        // Query attendance records for today
        const attendanceData = await Attendance.aggregate([
            // Match attendance records for today
            {
                $match: {
                    timestamp: {
                        $gte: today, // Find records where timestamp is greater than or equal to today
                        $lt: moment().endOf('day').toDate() // Less than end of today
                    }
                }
            },
            // Group by user and status, include attendance type, sign-in time, and sign-out time
            {
                $group: {
                    _id: '$user',
                    status: { $first: '$status' },
                    type: { $first: '$type' },
                    signInTime: { $first: '$date.signInTime' },
                    signOutTime: { $first: '$date.signOutTime' },
                    timestamp: { $first: '$timestamp' },
                    location: { $first: '$location' },
                    remarks: { $first: '$remarks' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Collect unique user IDs from attendanceData
        const userIds = attendanceData.map(record => record._id);

        // Query all users in the same department or section as the logged-in user, excluding the logged-in user
        let allUser;
        if (user.isHeadOfDepartment) {
            allUser = await User.find({ department: user.department, _id: { $ne: user._id } });
        } else if (user.isHeadOfSection) {
            allUser = await User.find({ section: user.section, _id: { $ne: user._id } });
        } else {
            return res.status(403).json({ error: 'Unauthorized access' });
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
                record._id.equals(user._id)
            );
            return attendanceRecord
                ? {
                    _id: attendanceRecord._id,
                    user: userMap[user._id],
                    status: attendanceRecord.status,
                    type: attendanceRecord.type,
                    signInTime: attendanceRecord.signInTime,
                    signOutTime: attendanceRecord.signOutTime,
                    timestamp: attendanceRecord.timestamp,
                    location: attendanceRecord.location,
                    remarks: attendanceRecord.remarks,
                    count: attendanceRecord.count
                }
                : null;
        }).filter(item => item !== null); // Filter out null entries (users without attendance records)

        // Sort combinedData based on timestamp, placing users without attendance records at the end
        combinedData.sort((a, b) => {
            // Check if either timestamp is missing
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;

            // Convert timestamps to Moment.js objects
            const dateA = moment(a.timestamp);
            const dateB = moment(b.timestamp);

            // Compare Moment.js objects
            return dateB.diff(dateA);
        });

        // Filter combinedData based on the search query
        const filteredData = combinedData.filter(item => {
            const { fullname, section, department, username } = item.user;
            const { status, type, signInTime, signOutTime, remarks, location } = item;
            const regex = new RegExp(searchQuery, 'i');
            return (
                regex.test(fullname) ||
                regex.test(section) ||
                regex.test(department) ||
                regex.test(username) ||
                regex.test(status) ||
                regex.test(type) ||
                regex.test(location) ||
                regex.test(remarks) ||
                (signInTime &&
                    regex.test(
                        moment(signInTime).format('LT') // Format sign-in time to 'hh:mm A'
                    )) ||
                (signOutTime &&
                    regex.test(
                        moment(signOutTime).format('LT') // Format sign-out time to 'hh:mm A'
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
});

app.post('/api/data/all-attendance/per-date/department-section', isAuthenticated, async function (req, res) {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    const username = req.user.username;
    const user = await User.findOne({ username: username });

    try {
        const selectedLocalDate = moment(selectedDate).utcOffset(8).startOf('day');

        // Calculate start and end date in UTC based on local time
        const startDate = selectedLocalDate.clone().utc().toDate();
        const endDate = selectedLocalDate.clone().endOf('day').utc().toDate();

        // Query attendance records for the selected date
        const attendanceData = await Attendance.find({
            timestamp: {
                $gte: startDate,
                $lt: endDate
            }
        });

        // Get all users in the same department or section as the logged-in user
        let allUser;
        if (user.isHeadOfDepartment) {
            allUser = await User.find({ department: user.department });
        } else if (user.isHeadOfSection) {
            allUser = await User.find({ section: user.section });
        } else {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Create a map for quick lookup of users
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

        // Create combined data with attendance records
        const combinedData = allUser.map(user => {
            const attendanceRecord = attendanceData.find(record => record.user.equals(user._id));
            if (!attendanceRecord) return null;

            return {
                _id: attendanceRecord._id,
                user: userMap[user._id],
                status: attendanceRecord.status,
                type: attendanceRecord.type,
                signInTime: attendanceRecord.date.signInTime,
                signOutTime: attendanceRecord.date.signOutTime,
                timestamp: attendanceRecord.timestamp,
                location: attendanceRecord.location,
                remarks: attendanceRecord.remarks,
            };
        }).filter(item => item !== null);

        combinedData.sort((a, b) => {
            // Convert timestamps to Moment.js objects
            const dateA = moment(a.timestamp);
            const dateB = moment(b.timestamp);

            // Compare Moment.js objects in descending order
            return dateB.diff(dateA);
        });

        // Filter combinedData based on the search query
        const filteredData = combinedData.filter(item => {
            const { fullname, section, department, username } = item.user;
            const { status, type, signInTime, signOutTime, remarks, location } = item;
            const regex = new RegExp(searchQuery, 'i');
            return (
                regex.test(fullname) ||
                regex.test(section) ||
                regex.test(department) ||
                regex.test(username) ||
                regex.test(status) ||
                regex.test(type) ||
                regex.test(location) ||
                regex.test(remarks) ||
                (signInTime &&
                    regex.test(
                        moment(signInTime)
                            .utcOffset(8) // Asia/Kuala_Lumpur timezone (UTC+8)
                            .format('h:mm A')
                    )) ||
                (signOutTime &&
                    regex.test(
                        moment(signOutTime)
                            .utcOffset(8) // Asia/Kuala_Lumpur timezone (UTC+8)
                            .format('h:mm A')
                    ))
            );
        });

        // Paginate the filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        if (!paginatedData || paginatedData.length === 0) {
            return res.status(404).json({ message: 'No paginated attendance data found' });
        }

        const response = {
            data1: paginatedData,
            data2: filteredData
        };

        // Respond with the paginated and filtered attendance data
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/api/data/all-attendance/per-month/department-section', isAuthenticated, async function (req, res) {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || ''; // Get search query from request query params
    const page = parseInt(req.query.page) || 1; // Get page number from request query params
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    const username = req.user.username;
    const user = await User.findOne({ username: username });

    // Extract month and year from the selected date
    const [month, year] = selectedDate.split('/');

    try {
        // Determine the users to query based on the user's role
        let allUser;
        if (user.isHeadOfDepartment) {
            allUser = await User.find({ department: user.department });
        } else if (user.isHeadOfSection) {
            allUser = await User.find({ section: user.section });
        } else {
            allUser = await User.find();
        }

        // Create a set of all possible status types
        const allStatusTypes = ['Present', 'Absent', 'Late', 'Invalid', 'Leave', 'Non Working Day'];

        // Query attendance records based on the month and year
        const attendanceData = await Attendance.aggregate([
            // Match attendance records for the selected month and year
            {
                $match: {
                    timestamp: {
                        $gte: moment(`${year}-${month}-01`)
                            .utcOffset(8) // Apply UTC+8 offset
                            .startOf('day') // Start of the day (00:00:00)
                            .toDate(),
                        $lt: moment(`${year}-${month + 1}-01`)
                            .utcOffset(8) // Apply UTC+8 offset
                            .startOf('day') // Start of the day (00:00:00)
                            .toDate()
                    }
                }
            },
            // Group by user and status, count occurrences
            {
                $group: {
                    _id: { user: '$user', status: '$status', type: '$type' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const userStatusCounts = {};
        const publicHolidayCounts = {};

        // Initialize status counts and public holiday counts for each user
        allUser.forEach(user => {
            userStatusCounts[user._id] = {};
            allStatusTypes.forEach(statusType => {
                userStatusCounts[user._id][statusType] = 0;
            });
            publicHolidayCounts[user._id] = 0;
        });

        // Update status counts and public holiday counts based on the attendance data
        attendanceData.forEach(({ _id, count }) => {
            const { user, status, type } = _id;
            // Ensure userStatusCounts[user] is defined before updating
            if (userStatusCounts[user]) {
                if (status) {
                    userStatusCounts[user][status] = count;
                }
                if (type === 'public holiday') {
                    publicHolidayCounts[user] = count;
                }
            }
        });

        // Combine populated attendance data with user status counts and public holiday counts
        const combinedData = allUser.map(user => {
            const statusCounts = userStatusCounts[user._id];
            const publicHolidayCount = publicHolidayCounts[user._id];
            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    section: user.section,
                    department: user.department
                },
                statusCounts: statusCounts,
                publicHolidayCount: publicHolidayCount
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

        console.log(paginatedData);

        // Respond with the paginated and filtered attendance data
        res.json(response);
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).send('Internal Server Error');
    }
}
);

// QR CODE API
app.get('/api/qrcode/generate', async (req, res) => {
    const uniqueIdentifier = generateUniqueIdentifier();
    const clientIP = req.clientIp;

    try {
        const qrCodeImage = await qr.toDataURL(uniqueIdentifier + "-" + clientIP, {
            type: 'image/png',
            errorCorrectionLevel: 'H',
            color: { dark: '#3874ff', light: '#f5f7fa' }, // Set the color (dark is the main color, light is the background color)
            width: 400,
            margin: 0 // Set the width of the QR code
        });

        res.json({ qrCodeImage, uniqueIdentifier });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/qrcode/save-data', async function (req, res) {
    const qrData = req.body.qrData;
    // console.log('Received QR code data:', qrData);

    // Save the raw URL in the database
    await QRCode.create({
        uniqueId: qrData,
        createdAt: moment().utcOffset(8).toDate()
    });

    res.status(200).send('QR code data received and saved successfully');
});

app.post('/api/qrcode/process-data', isAuthenticated, async function (req, res) {
    const scannedData = req.body.scannedData;
    const id = req.body.id;

    console.log('Received scanned data from client:', scannedData);
    console.log('Id received is:', id);

    const uniqueIdentifier = scannedData.substring(0, scannedData.indexOf('-'));
    const clientIp = scannedData.substring(scannedData.indexOf('-') + 1);

    console.log('Unique Identifier:', uniqueIdentifier);
    console.log('clientIp:', clientIp);

    const checkUser = await User.findOne({ _id: id });

    var log = '';
    var location = '';

    if (clientIp === '175.140.45.73' || clientIp === '104.28.242.42') {
        location = 'BMI';
    } else if (clientIp === '210.186.48.79') {
        location = 'JM';
    } else if (clientIp === '60.50.17.102') {
        location = 'CM';
    } else if (clientIp === '175.144.217.244') {
        location = 'RS';
    } else {
        location = 'Invalid';
    }

    console.log(location);

    if (checkUser) {
        const now = moment().utcOffset(8).toDate();
        const today = moment().utcOffset(8).startOf('day').toDate();

        const checkQrCode = await QRCode.findOne({ uniqueId: uniqueIdentifier });

        if (checkQrCode) {
            console.log('You qr code is invalid, try to scan latest qr code!');

            log = 'You qr code is invalid, try to scan latest qr code!';
        } else {
            const existingAttendance = await Attendance.findOne({
                user: checkUser._id,
                timestamp: {
                    $gte: today,
                    $lte: now
                }
            });

            console.log(existingAttendance);

            if (existingAttendance) {
                if (existingAttendance.date.signInTime !== null && existingAttendance.date.signOutTime === null) {
                    // Check for non-office hour users (e.g., night shift)
                    if (checkUser.isNonOfficeHour) {
                        const startShift = moment(existingAttendance.signInTime).utcOffset(8);

                        // Calculate endShift: one day after startShift, at 07:00 of the next day
                        const endShift = moment(startShift)
                            .add(1, 'days') // Add one day
                            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set time to 07:00:00.000
                            .toDate(); // 07:00 of the next day

                        if (now > endShift) {
                            // If current time is past the end shift time, it means it's a sign-out for the previous day's shift
                            await Attendance.findOneAndUpdate(
                                {
                                    user: checkUser._id,
                                    signInTime: {
                                        $gte: startShift,
                                        $lt: endShift
                                    }
                                },
                                {
                                    $set: {
                                        'date.signOutTime': now,
                                        type: 'sign out',
                                        status: 'Present',
                                        timestamp: now,
                                        'location.signOut': location
                                    }
                                },
                                {
                                    upsert: true,
                                    new: true
                                }
                            );

                            console.log('You have successfully signed out for today, thank you');

                            const tempAttendance = new TempAttendance({
                                user: checkUser._id,
                                timestamp: now,
                                type: 'sign out'
                            });

                            await tempAttendance.save();

                            // activity
                            const activityUser = new Activity({
                                user: checkUser._id,
                                date: now,
                                title: 'Sign out for today',
                                type: 'Attendance',
                                description: checkUser.fullname + ' has signed out for ' + getDateFormat2(today)
                            });

                            await activityUser.save();

                            console.log('New activity submitted', activityUser);

                            log = 'You have successfully signed out for today, thank you!';
                        }
                    } else {
                        // Regular shift sign-out
                        await Attendance.findOneAndUpdate(
                            {
                                user: checkUser._id,
                                timestamp: {
                                    $gte: today,
                                    $lte: moment().utcOffset(8).toDate()
                                }
                            },
                            {
                                $set: {
                                    'date.signOutTime': now,
                                    type: 'sign out',
                                    status: 'Present',
                                    timestamp: now,
                                    'location.signOut': location
                                }
                            },
                            {
                                upsert: true,
                                new: true
                            }
                        );

                        console.log('You have successfully signed out for today, thank you');

                        const tempAttendance = new TempAttendance({
                            user: checkUser._id,
                            timestamp: now,
                            type: 'sign out'
                        });

                        await tempAttendance.save();

                        // activity
                        const activityUser = new Activity({
                            user: checkUser._id,
                            date: now,
                            title: 'Sign out for today',
                            type: 'Attendance',
                            description: checkUser.fullname + ' has signed out for ' + getDateFormat2(today)
                        });

                        await activityUser.save();

                        console.log('New activity submitted', activityUser);

                        log = 'You have successfully signed out for today, thank you!';
                    }
                } else if (
                    existingAttendance.date.signInTime === null &&
                    existingAttendance.date.signOutTime === null
                ) {
                    if (checkUser.isNonOfficeHour === true) {
                        await Attendance.findOneAndUpdate(
                            {
                                user: checkUser._id,
                                timestamp: {
                                    $gte: today, // Greater than or equal to the start of today
                                    $lte: moment().utcOffset(8).toDate() // Less than the current time
                                }
                            },
                            {
                                $set: {
                                    status: 'Present',
                                    type: 'sign in',
                                    'date.signInTime': moment().utcOffset(8).toDate(),
                                    timestamp: moment().utcOffset(8).toDate(),
                                    'location.signIn': location
                                }
                            },
                            { upsert: true, new: true }
                        );

                        const tempAttendance = new TempAttendance({
                            user: checkUser._id,
                            timestamp: moment().utcOffset(8).toDate(),
                            type: 'sign in'
                        });

                        await tempAttendance.save();

                        // activity
                        const activityUser = new Activity({
                            user: checkUser._id,
                            date: moment().utcOffset(8).toDate(),
                            title: 'Sign in for today',
                            type: 'Attendance',
                            description:
                                checkUser.fullname +
                                ' has sign in for ' + getDateFormat2(today)
                        });

                        activityUser.save();

                        console.log('New activity submitted', activityUser);

                        log = 'You have successfully signed in for today, thank you!';
                    } else {
                        const currentTime = moment().utcOffset(8).toDate();
                        const pstTime = currentTime.toLocaleString('en-MY', {
                            timeZone: 'Asia/Kuala_Lumpur',
                            hour12: false
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
                                        $lte: moment().utcOffset(8).toDate() // Less than the current time
                                    }
                                },
                                {
                                    $set: {
                                        status: 'Late',
                                        type: 'sign in',
                                        'date.signInTime': moment().utcOffset(8).toDate(),
                                        timestamp: moment().utcOffset(8).toDate(),
                                        'location.signIn': location
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            const tempAttendance = new TempAttendance({
                                user: checkUser._id,
                                timestamp: moment().utcOffset(8).toDate(),
                                type: 'sign in'
                            });

                            await tempAttendance.save();

                            // activity
                            const activityUser = new Activity({
                                user: checkUser._id,
                                date: moment().utcOffset(8).toDate(),
                                title: 'Sign in late for today',
                                type: 'Attendance',
                                description:
                                    checkUser.fullname +
                                    ' has sign in late for ' + getDateFormat2(today)
                            });

                            activityUser.save();

                            console.log('New activity submitted', activityUser);

                            log =
                                'You have successfully signed in as late for today, thank you!';
                        } else {

                            await Attendance.findOneAndUpdate(
                                {
                                    user: checkUser._id,
                                    timestamp: {
                                        $gte: today, // Greater than or equal to the start of today
                                        $lte: moment().utcOffset(8).toDate() // Less than the current time
                                    }
                                },
                                {
                                    $set: {
                                        status: 'Present',
                                        type: 'sign in',
                                        'date.signInTime': moment().utcOffset(8).toDate(),
                                        timestamp: moment().utcOffset(8).toDate(),
                                        'location.signIn': location
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            const tempAttendance = new TempAttendance({
                                user: checkUser._id,
                                timestamp: moment().utcOffset(8).toDate(),
                                type: 'sign in'
                            });

                            await tempAttendance.save();

                            // activity
                            const activityUser = new Activity({
                                user: checkUser._id,
                                date: moment().utcOffset(8).toDate(),
                                title: 'Sign in for today',
                                type: 'Attendance',
                                description:
                                    checkUser.fullname +
                                    ' has sign in for ' + getDateFormat2(today)
                            });

                            activityUser.save();

                            console.log('New activity submitted', activityUser);

                            log = 'You have successfully signed in for today, thank you!';
                        }
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

        res.json(response);
    }
});

app.get('/api/qrcode/get-latest', async function (req, res) {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        const tempAttendance = await TempAttendance.findOne({
            timestamp: {
                $gte: today, // Greater than or equal to the start of today
                $lte: moment().utcOffset(8).toDate() // Less than the current time
            }
        })
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

// ECHARTS
// USER'S LEAVE TYPE
app.get('/api/echarts/leaveType/:id', isAuthenticated, async function (req, res) {
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
                'timestamp': {
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

app.get('/api/leave/pending-invalid', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user) {

        // Get the current date and seven days ago with UTC+8 offset
        const currentDate = moment().utcOffset(8).startOf('day');
        const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').startOf('day');

        // Assuming 'Leave' is your Mongoose model
        const leaveData = await Leave.find({
            'date.start': {
                $gte: sevenDaysAgo.toDate(),
                $lte: currentDate.toDate()
            }
        }).select('date.start status invalid');

        // Create an object to store counts for each date
        const dateCounts = {};

        // Initialize counts for all dates in the range
        let currentDatePointer = sevenDaysAgo.clone();
        while (currentDatePointer.isSameOrBefore(currentDate, 'day')) {
            const formattedDate = currentDatePointer.format('YYYY-MM-DD');
            dateCounts[formattedDate] = { pending: 0, invalid: 0, percentage: 0 };
            currentDatePointer.add(1, 'days');
        }

        // Process the retrieved data
        leaveData.forEach(entry => {
            const formattedDate = moment(entry.date.start).utcOffset(8).format('YYYY-MM-DD');

            // Update counts for the date
            if (dateCounts[formattedDate]) {
                dateCounts[formattedDate].pending += entry.status === 'pending' ? 1 : 0;
                dateCounts[formattedDate].invalid += entry.status === 'invalid' ? 1 : 0;
            }
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

        // Find previous 7 days
        const fourteenDaysAgo = sevenDaysAgo.clone().subtract(7, 'days');

        const leaveDataPrevious7Days = await Leave.find({
            'date.start': {
                $gte: fourteenDaysAgo.toDate(),
                $lt: sevenDaysAgo.toDate()
            }
        }).select('date.start status invalid');

        const dateCountsPrevious7Days = {};

        let currentDatePointerPrevious7Days = fourteenDaysAgo.clone();
        while (currentDatePointerPrevious7Days.isBefore(sevenDaysAgo, 'day')) {
            const formattedDate = currentDatePointerPrevious7Days.format('YYYY-MM-DD');
            dateCountsPrevious7Days[formattedDate] = { pending: 0, invalid: 0, percentage: 0 };
            currentDatePointerPrevious7Days.add(1, 'days');
        }

        leaveDataPrevious7Days.forEach(entry => {
            const formattedDate = moment(entry.date.start).utcOffset(8).format('YYYY-MM-DD');

            if (!dateCountsPrevious7Days[formattedDate]) {
                dateCountsPrevious7Days[formattedDate] = { pending: 0, invalid: 0, percentage: 0 };
            }

            // Update counts for the date
            dateCountsPrevious7Days[formattedDate].pending += entry.status === 'pending' ? 1 : 0;
            dateCountsPrevious7Days[formattedDate].invalid += entry.status === 'invalid' ? 1 : 0;
        });

        Object.keys(dateCountsPrevious7Days).forEach(date => {
            const total = dateCountsPrevious7Days[date].pending + dateCountsPrevious7Days[date].invalid;
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
                ? (totalPendingPrevious7Days / (totalPendingPrevious7Days + totalInvalidPrevious7Days)) * 100
                : 0;

        const differencePending = totalPercentagePending - totalPercentagePendingPrevious7Days;

        const formattedDifferencePending =
            (differencePending >= 0 ? '+' : '-') + Math.abs(differencePending).toFixed(2);

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

            // Get the current date with UTC+8 offset
            const currentDate = moment().utcOffset(8).startOf('day');
            const fourteenDaysAgo = moment().utcOffset(8).subtract(14, 'days').startOf('day');
            const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').startOf('day');

            // Assuming 'Leave' is your Mongoose model
            const leaveDataLast14Days = await Leave.find({
                timestamp: {
                    $gte: fourteenDaysAgo.toDate(),
                    $lte: sevenDaysAgo.toDate()
                },
                status: 'submitted'
            });

            const leaveDataLast7Days = await Leave.find({
                timestamp: {
                    $gte: sevenDaysAgo.toDate(),
                    $lte: currentDate.toDate()
                },
                status: 'submitted'
            });

            // Create an object to store submitted counts for each day
            const submittedCountsLast14Days = {};
            const submittedCountsLast7Days = {};

            // Initialize counts for all dates in the range
            let currentDatePointerLast14Days = fourteenDaysAgo.clone();
            let currentDatePointerLast7Days = sevenDaysAgo.clone();

            while (currentDatePointerLast14Days.isSameOrBefore(currentDate, 'day')) {
                const formattedDate = currentDatePointerLast14Days.format('YYYY-MM-DD');
                submittedCountsLast14Days[formattedDate] = 0;
                currentDatePointerLast14Days.add(1, 'days');
            }

            while (currentDatePointerLast7Days.isSameOrBefore(currentDate, 'day')) {
                const formattedDate = currentDatePointerLast7Days.format('YYYY-MM-DD');
                submittedCountsLast7Days[formattedDate] = 0;
                currentDatePointerLast7Days.add(1, 'days');
            }

            // Process the retrieved data for the last 14 days
            leaveDataLast14Days.forEach(entry => {
                const formattedDate = moment(entry.timestamp).utcOffset(8).format('YYYY-MM-DD');

                // Update submitted counts for the date
                if (submittedCountsLast14Days[formattedDate] !== undefined) {
                    submittedCountsLast14Days[formattedDate]++;
                }
            });

            // Process the retrieved data for the last 7 days
            leaveDataLast7Days.forEach(entry => {
                const formattedDate = moment(entry.timestamp).utcOffset(8).format('YYYY-MM-DD');

                // Update submitted counts for the date
                if (submittedCountsLast7Days[formattedDate] !== undefined) {
                    submittedCountsLast7Days[formattedDate]++;
                }
            });

            const totalSubmittedLast14Days = leaveDataLast14Days.length;
            const totalSubmitted = leaveDataLast7Days.length;
            const totalPercentageLast7 =
                (totalSubmitted / (totalSubmitted + totalSubmittedLast14Days)) * 100;
            const totalPercentageLast14 =
                (totalSubmittedLast14Days / (totalSubmitted + totalSubmittedLast14Days)) * 100;
            const differencePercentage = totalPercentageLast7 - totalPercentageLast14;
            const formattedDifference =
                totalSubmitted > 0
                    ? (differencePercentage >= 0 ? '+' : '-') + Math.abs(differencePercentage).toFixed(2) + '%'
                    : '0%';

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

        // Get the current date with UTC+8 offset
        const currentDate = moment().utcOffset(8).startOf('day');
        const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').startOf('day');

        // Assuming 'Leave' is your Mongoose model
        const leaveDataLast7Days = await Leave.find({
            timestamp: {
                $gte: sevenDaysAgo.toDate(),
                $lte: currentDate.toDate()
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
        const percentageSubmitted = totalLeaves > 0 ? ((submittedCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentagePending = totalLeaves > 0 ? ((pendingCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageInvalid = totalLeaves > 0 ? ((invalidCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageDenied = totalLeaves > 0 ? ((deniedCount / totalLeaves) * 100).toFixed(0) : 0;
        const percentageApproved = totalLeaves > 0 ? ((approvedCount / totalLeaves) * 100).toFixed(0) : 0;

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

app.get('/api/staff/overview/department-section', isAuthenticated, async function (req, res) {
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

app.get('/api/auxiliary-police/schedule/calendar-data', async (req, res) => {
    try {
        const { date, location } = req.query;

        console.log(date, 'This is the date for find the schedule');

        const selectedDate = moment(date);
        const startOfMonth = selectedDate.startOf('month').toDate();
        const endOfMonth = selectedDate.endOf('month').toDate();
        console.log(endOfMonth);

        const schedules = await ScheduleAux.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                    location: location
                }
            },
            {
                $unwind: "$shift"
            },
            {
                $group: {
                    _id: { date: "$date" },
                    shifts: { $push: "$shift" },
                    totalCount: { $sum: { $size: "$shift.staff" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$_id.date" } },
                    shifts: 1,
                    totalCount: 1
                }
            }
        ]);

        // Format the data as required
        const formattedData = schedules.map(schedule => ({
            date: schedule.date,
            shifts: schedule.shifts,
            totalCount: schedule.totalCount
        }));

        console.log(formattedData);
        // Send the formatted data as JSON response
        res.json(formattedData);
    } catch (err) {
        res.status(500).send(err);
    }
});

//EMAIL
app.get('/email', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    }).populate('sender');

    res.render('email', {
        user: user,
        notifications: notifications,
        uuid: uuidv4(),
    });
});

//SUPER ADMIN
app.get('/super-admin/update', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user.isSuperAdmin) {

        try {
            const result = await User.updateMany({}, { isTeaLady: false });

            if (result) {
                console.log('Done update tealady');
            } else {
                console.log('Failed update tealady');
            }
        } catch (error) {
            console.error('Error creating Info documents:', error);
        }

        console.log('Done update');
        res.redirect('/');
    }
});

app.get('/super-admin/logout', isAuthenticated, async function (req, res) {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (user.isSuperAdmin) {

        try {

        } catch (error) {
            console.error('error logging out all user', error);
        }

        console.log('All users have been logged out.');
        res.redirect('/');
    }
});

//TEMPORARY PAGE
app.get('/temp', async (req, res) => {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        res.render('temp', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        });
    }
});

app.get('/testing', async (req, res) => {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const notifications = await Notification.find({
        recipient: user._id,
        read: false
    })
        .populate('sender')
        .sort({ timestamp: -1 });

    if (user) {
        const leaveId = new mongoose.Types.ObjectId('66ab487a9db48ec2da0f9433');
        const leave = await Leave.findOne(
            { _id: leaveId },
        );

        console.log(leave);

        leave.status = 'invalid';

        // Find the index of the last valid approval
        let lastValidIndex = -1;
        leave.approvals.forEach((approval, index) => {
            if (approval.status === 'approved' || approval.status === 'submitted') {
                lastValidIndex = index;
            }
        });

        // Determine the index of the next approval after the last valid approval
        let nextApprovalIndex = lastValidIndex + 1;

        // Remove the next approval after the last valid approval if it exists and is not a Human Resource approval
        if (nextApprovalIndex < leave.approvals.length) {
            const nextApproval = leave.approvals[nextApprovalIndex];
            if (nextApproval.role !== 'Human Resource') {
                leave.approvals.splice(nextApprovalIndex, 1);
            }
        }

        // Update the leave with the modified approvals list
        await leave.save();

        res.render('testing', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        });
    }
});


app.post('/search-schedule-temp', async (req, res) => {
    try {
        const { date, location } = req.body;
        const query = {};

        if (date) {
            // Use moment to handle dates with UTC+8 offset
            const startDate = moment(date).utcOffset(8).startOf('month').toDate();
            const endDate = moment(date).utcOffset(8).endOf('month').toDate();

            query.date = { $gte: startDate, $lte: endDate };
        }

        if (location) {
            query.location = location;
        }

        const schedules = await ScheduleAux.find(query);

        // Collect all staff details with their corresponding dates
        const staffDetails = schedules.flatMap(schedule =>
            schedule.shift.map(shiftDetail => ({
                shift: shiftDetail.shiftName,
                staff: shiftDetail.staff,
                time: shiftDetail.time,
                date: schedule.date
            }))
        );

        // Remove duplicates based on staff name and date
        const uniqueStaffDetails = Array.from(new Map(
            staffDetails.map(detail => [`${detail.staff}-${detail.date}`, detail])
        ).values());

        console.log(schedules[0]);

        res.json({ schedules, staffDetails: uniqueStaffDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

//SCHEDULER

// Check every minutes a session for user
cron.schedule('* * * * *', async () => {
    console.log('Running cron job to remove expired sessions');

    try {
        // Get the current date in Asia/Kuala_Lumpur timezone
        const now = moment().utcOffset(8).toDate();
        console.log('Current time:', now);

        // Ensure you are using the correct database and collection
        const sessions = sessionDatabase.collection('sessions');

        // Retrieve all sessions
        const allSessions = await sessions.find().toArray();

        if (allSessions.length > 0) {
            console.log(`${allSessions.length} sessions found.`);

            // Filter expired sessions
            const expiredSessions = allSessions.filter(session => session.expires < now);

            if (expiredSessions.length > 0) {
                console.log(`${expiredSessions.length} expired sessions found.`);

                // Iterate over expired sessions
                for (const session of expiredSessions) {
                    if (session.session && session.session.passport && session.session.passport.user) {
                        const userId = session.session.passport.user;

                        // Update the Info document for the user
                        const infoUpdate = await InfoCollection.findOneAndUpdate(
                            { user: mongoose.Types.ObjectId(userId) }, // Ensure userId is in ObjectId format
                            { $set: { isOnline: false, lastSeen: now } },
                            { returnOriginal: false } // Ensure new document is returned
                        );

                        if (infoUpdate.value) {
                            console.log(`Info updated for user: ${userId}`);
                        } else {
                            console.log(`Info not found for user: ${userId}`);
                        }
                    } else {
                        console.log('Session does not contain passport user information:', session._id);
                    }
                }

                // Delete all expired sessions
                const deleteResult = await sessions.deleteMany({ expires: { $lt: now } });
                console.log(`${deleteResult.deletedCount} expired sessions deleted.`);
            } else {
                console.log('No expired sessions found.');
            }
        } else {
            console.log('No sessions found.');
        }
    } catch (error) {
        console.error('Error removing expired sessions:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
});

// CHECK EACH LEAVE VALIDITY
cron.schedule(
    '0 0 * * *',
    async () => {

        const threeDaysAgo = moment().utcOffset(8).subtract(3, 'days');
        const threeDaysFromNow = moment().utcOffset(8).add(3, 'days');

        // Find invalid leaves
        const invalidLeaves = await Leave.find({
            timestamp: { $lte: threeDaysAgo.toDate() },
            status: 'pending'
        });

        console.log(invalidLeaves);

        // Update the status of invalid leaves
        for (const leave of invalidLeaves) {
            const user = await User.findById(leave.user);

            // Check if the user is a Deputy Chief Executive
            if (user.isDeputyChiefExec) {
                leave.status = 'invalid';
                await leave.save();
            } else {
                leave.status = 'invalid';

                // Find the index of the last valid approval
                let lastValidIndex = -1;
                leave.approvals.forEach((approval, index) => {
                    if (approval.status === 'approved' || approval.status === 'submitted') {
                        lastValidIndex = index;
                    }
                });

                // Determine the index of the next approval after the last valid approval
                let nextApprovalIndex = lastValidIndex + 1;

                // Remove the next approval after the last valid approval if it exists and is not a Human Resource approval
                if (nextApprovalIndex < leave.approvals.length) {
                    const nextApproval = leave.approvals[nextApprovalIndex];
                    if (nextApproval.role !== 'Human Resource') {
                        leave.approvals.splice(nextApprovalIndex, 1);
                    }
                }

                // Update the leave with the modified approvals list
                await leave.save();

                // Send notifications
                const sendNoti = leave.approvals.map(approval => approval.recipient);

                if (sendNoti.length > 0) {
                    for (const recipientId of sendNoti) {
                        const newNotification = new Notification({
                            sender: user._id,
                            recipient: new mongoose.Types.ObjectId(recipientId),
                            type: 'Leave request',
                            url: '/leave/details/' + leave._id,
                            message: 'Leave has become invalid due to it already past 3 days of approval, please do check the leave request.'
                        });

                        await newNotification.save();
                    }

                    console.log('Done sending notifications!');
                }
            }
        }

        // Find pending leaves
        const pendingLeaves = await Leave.find({
            estimated: { $lte: threeDaysFromNow.toDate() },
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
                const currentTime = moment();
                const sessionExpirationTime = moment(session.expires);

                if (currentTime.isAfter(sessionExpirationTime)) {
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

// UPDATE ATTENDANCE AT 12:00AM
cron.schedule(
    '0 0 * * *',
    () => {
        console.log('Running cron job to update attendance at 1200AM at my times');
        updateAbsentAttendance();
        updateAttendanceForApprovedLeaves();
        updateTodayAttendance();
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

// UPDATE ATTENDANCE TO INVALID AT 
cron.schedule(
    '59 23 * * *',
    async () => {
        console.log('Running cron job to update attendance');
        updateAttendanceEndOfDays();

        const clearQr = await QRCode.deleteMany();

        if (clearQr) {
            console.log('QR codes cleared');
        } else {
            console.log('QR codes not cleared');
        }
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

// PATROL UNIT

cron.schedule(
    '0 8 * * *',
    () => {
        console.log('Running cron job to update patrol unit status');

        const checkpointData = [
            {
                checkpointName: 'Mufti Residence',
                logReport: '',
                time: ''
            },
            {
                checkpointName: 'Encik Drahman Residence',
                logReport: '',
                time: ''
            },
            {
                checkpointName: 'Ceo Residence',
                logReport: '',
                time: ''
            },
            {
                checkpointName: 'Sicc',
                logReport: '',
                time: ''
            }
        ];

        const patrolUnitData = {
            reportId: uuidv4(),
            type: 'Patrol Unit',
            date: moment().utcOffset(8).toDate(),
            status: 'Open',
            startShift: '08:00',
            endShift: '17:00',
            remarks: '',
            patrolUnit: checkpointData
        };

        scheduler(patrolUnitData);

    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur' // Adjust timezone accordingly
    }
);

cron.schedule(
    '0 17 * * *',
    async () => {
        try {
            const dateToday = dateLocal.getDate();

            console.log(dateToday);

            // Update status of Patrol Reports with today's date to 'Closed'
            const patrolUnit = await PatrolAux.findOneAndUpdate(
                { date: dateToday, status: 'Open' },
                { $set: { status: 'Closed' } }
            );

            if (patrolUnit) {
                console.log(
                    `Patrol Reports for date ${dateToday} updated and closed at 5 PM`
                );
            } else {
                console.log(`Failed to update`);
            }
        } catch (error) {
            console.error('Error in scheduled task at 5 PM:', error);
        }
    },
    {
        scheduled: true,
        timezone: 'Asia/Kuala_Lumpur'
    }
);

// SCHEDULER SUBMIT EVERYDAY 8 AM
const scheduler = async data => {
    const submitData = await PatrolAux.create(data);

    if (submitData) {
        console.log('Patrol unit submitted');
    } else {
        console.log('Error');
    }
};

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

getDateFormat3 = function (date) {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

const defaultPublicHolidays = ['2024-02-16', '2024-05-01', '2024-05-07'];
const allPublicHolidays = defaultPublicHolidays.map(date => moment(date).startOf('day').toDate());

function calculateBusinessDays(startDateString, endDateString) {
    let count = 0;
    let start = moment(startDateString).startOf('day');
    let end = moment(endDateString).startOf('day');

    // If start and end dates are the same, return 1 if it's a business day
    if (start.isSame(end)) {
        const dayOfWeek = start.day();
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isPublicHoliday(start.toDate(), allPublicHolidays)) {
            return 1;
        } else {
            return 0;
        }
    }

    const increment = start.isBefore(end) ? 1 : -1;

    // Loop through each day between the start and end date
    while ((increment === 1 && start.isSameOrBefore(end)) || (increment === -1 && start.isSameOrAfter(end))) {
        const dayOfWeek = start.day();

        // Check if the current day is a business day (Monday to Friday) and not a public holiday
        if (
            dayOfWeek >= 1 &&
            dayOfWeek <= 5 &&
            !isPublicHoliday(start.toDate(), allPublicHolidays)
        ) {
            count++;
        }

        if (start.isSame(end)) {
            break;
        }

        start.add(increment, 'days');
    }

    // Adjust the count based on the direction of the increment
    return increment === -1 ? -count : count;
}


function isPublicHoliday(date, allPublicHolidays) {
    return allPublicHolidays.some(holiday => moment(date).isSame(moment(holiday), 'day'));
}

const formatDate = function (date) {
    return moment(date).format('YYYY-MM-DD');
};

isWeekend = function (date) {
    const dayOfWeek = moment(date).day();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

setOrCheckTodayHolidayOrWeekend = function () {
    const today = moment().utcOffset(8).startOf('day').toDate();

    const defaultPublicHolidays = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-16', '2024-07-07', '2024-07-08', '2024-07-22'
        , '2024-08-31', '2024-09-16', '2024-12-25'
    ];
    const allPublicHolidays = defaultPublicHolidays;

    const isHoliday = isPublicHoliday(today, allPublicHolidays);
    const isWeekendDay = isWeekend(today);

    return {
        isHoliday,
        isWeekend: isWeekendDay
    };
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
    let approvals = [];

    if (type === 'Emergency Leave') {
        if (user.isOfficer === true) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (headOfSection) {
                approvals.push({
                    recipient: headOfSection._id,
                    role: 'Head of Division',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else if (user.isHeadOfSection === true) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (depChiefExec) {
                approvals.push({
                    recipient: depChiefExec._id,
                    role: 'Deputy Chief Executive Officer',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else if (user.isDeputyChiefExec === true) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (chiefExec) {
                approvals.push({
                    recipient: chiefExec._id,
                    role: 'Chief Executive Officer',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(2, 'days').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (headOfSection) {
                approvals.push({
                    recipient: headOfSection._id,
                    role: 'Head of Division',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        }
    } else {
        // Logic for other leave types
        if (user.isOfficer) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (assignee && assignee.length > 0) {
                assignee.forEach(assigneeItem => {
                    approvals.push({
                        recipient: assigneeItem._id,
                        role: 'Relief Staff',
                        status: 'pending',
                        comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                        estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                        timestamp: ''
                    });
                });
            }

            if (headOfSection) {
                approvals.push({
                    recipient: headOfSection._id,
                    role: 'Head of Division',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else if (user.isHeadOfSection) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (assignee && assignee.length > 0) {
                assignee.forEach(assigneeItem => {
                    approvals.push({
                        recipient: assigneeItem._id,
                        role: 'Relief Staff',
                        status: 'pending',
                        comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                        estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                        timestamp: ''
                    });
                });
            }

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (depChiefExec) {
                approvals.push({
                    recipient: depChiefExec._id,
                    role: 'Deputy Chief Executive Officer',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }


            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else if (user.isDeputyChiefExec) {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (assignee && assignee.length > 0) {
                assignee.forEach(assigneeItem => {
                    approvals.push({
                        recipient: assigneeItem._id,
                        role: 'Relief Staff',
                        status: 'pending',
                        comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                        estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                        timestamp: ''
                    });
                });
            }

            if (chiefExec) {
                approvals.push({
                    recipient: chiefExec._id,
                    role: 'Chief Executive Officer',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(2, 'days').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        } else {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (assignee && assignee.length > 0) {
                assignee.forEach(assigneeItem => {
                    approvals.push({
                        recipient: assigneeItem._id,
                        role: 'Relief Staff',
                        status: 'pending',
                        comment: `Relief Staff for leave by ${assigneeItem.fullname}`,
                        estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                        timestamp: ''
                    });
                });
            }

            if (headOfSection) {
                approvals.push({
                    recipient: headOfSection._id,
                    role: 'Head of Division',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (headOfDepartment) {
                approvals.push({
                    recipient: headOfDepartment._id,
                    role: 'Head of Department',
                    status: 'pending',
                    comment: 'Leave request needs approval',
                    estimated: moment().utcOffset(8).add(1, 'day').toDate(),
                    timestamp: ''
                });
            }

            if (adminHR) {
                approvals.push({
                    recipient: adminHR._id,
                    role: 'Human Resource',
                    status: 'pending',
                    comment: 'Leave request needs to be reviewed',
                    estimated: moment().utcOffset(8).add(3, 'days').toDate(),
                    timestamp: ''
                });
            }
        }
    }

    return approvals;
};

// CHECK DATE TODAY BETWEEN TWO DATES IN RANGE
isDateInRange = function (startDate, endDate) {

    // Initialize current time with UTC offset +8 (if required)
    const currentDate = moment().utcOffset(8);

    // Convert start and end dates to Moment.js objects
    const startDateObj = moment(startDate).utcOffset(8).startOf('day');
    const endDateObj = moment(endDate).utcOffset(8).endOf('day');

    // Check if the current date is between the start and end dates
    return startDateObj.isSameOrBefore(currentDate) && currentDate.isSameOrBefore(endDateObj);
};

// Function to generate a unique identifier (replace this with your own logic)
const generateUniqueIdentifier = () => {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
};

// FOR SCHEDULER
// Function to update attendance
const updateAttendanceEndOfDays = async () => {
    try {
        const now = moment().utcOffset(8);
        const todayStart = now.clone().startOf('day').toDate();
        const todayEnd = now.clone().endOf('day').toDate();

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

        console.log('Attendance updated at 11:59PM');
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
};

// Function to check leave on attendance
const updateAttendanceForApprovedLeaves = async () => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        // Find leave requests with status 'approved' and return date of today
        const approvedLeaves = await Leave.find({
            status: 'approved'
        });

        let todayLeaves = [];

        approvedLeaves.forEach(leave => {
            if (isDateInRange(leave.date.start, leave.date.return)) {
                todayLeaves.push(leave);
            }
        });

        for (const leave of todayLeaves) {

            await Attendance.findOneAndUpdate(
                {
                    user: leave.user,
                    timestamp: {
                        $gte: today, // Greater than or equal to the start of today
                        $lte: moment().utcOffset(8).toDate() // Less than the current time
                    }
                },
                {
                    $set: {
                        status: 'Leave',
                        type: 'manual add',
                        timestamp: moment().utcOffset(8).toDate()
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

const updateTodayAttendance = async () => {

    // Get the current time as a Moment.js object
    const now = moment().utcOffset(8);
    const todayStart = now.clone().startOf('day').toDate();
    const todayEnd = now.clone().endOf('day').toDate();

    const todayStatus = setOrCheckTodayHolidayOrWeekend();
    let updateType, updateStatus;

    if (todayStatus.isWeekend) {
        updateType = 'weekend';
        updateStatus = 'Non Working Day';
    } else if (todayStatus.isHoliday) {
        updateType = 'public holiday';
        updateStatus = 'Non Working Day';
    } else {
        updateType = '';
        updateStatus = '';
    }

    if (updateType === '' && updateStatus === '') {
        console.log('Today is neither a weekend nor a public holiday.');
        return; // Exit if today is neither a weekend nor a public holiday
    } else {

        // Update all attendance records for today
        await Attendance.updateMany(
            { timestamp: { $gte: todayStart, $lt: todayEnd } },
            { $set: { type: updateType, status: updateStatus } }
        );

        console.log(`Attendance records updated for ${updateType}: ${updateStatus}`);
    }
};

// Function to check and update attendance absent
const updateAbsentAttendance = async () => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        // Find all users
        const allUsers = await User.find();

        // Create new attendance records marking them as absent
        for (const user of allUsers) {
            const newAttendance = new Attendance({
                user: user._id,
                type: 'invalid',
                'date.signInTime': null,
                'date.signOutTime': null,
                'location.signIn': null,
                'location.signOut': null,
                status: 'Absent',
                timestamp: today,
                remarks: 'No remarks added'
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

// location mappings
const locationMappings = {
    'Baitul Makmur I': [
        { checkpointName: 'Parameter 1', time: '', logReport: '' },
        { checkpointName: 'Parameter 2', time: '', logReport: '' },
        { checkpointName: 'Parameter 3', time: '', logReport: '' },
        { checkpointName: 'Parameter 4', time: '', logReport: '' },
        { checkpointName: 'Basement 1', time: '', logReport: '' },
        { checkpointName: 'Basement 2', time: '', logReport: '' },
        { checkpointName: 'Basement 3', time: '', logReport: '' },
        { checkpointName: 'Basement 4', time: '', logReport: '' },
        { checkpointName: 'Club House', time: '', logReport: '' },
        { checkpointName: 'Old Cafe', time: '', logReport: '' },
        { checkpointName: 'Level 4', time: '', logReport: '' },
        { checkpointName: 'Level 8', time: '', logReport: '' }
    ],
    'Baitul Makmur II': [
        { checkpointName: 'Basement 1 (a)', time: '', logReport: '' },
        { checkpointName: 'Basement 1 (b)', time: '', logReport: '' },
        { checkpointName: 'Basement 1 (c)', time: '', logReport: '' },
        { checkpointName: 'Basement 2 (a)', time: '', logReport: '' },
        { checkpointName: 'Basement 2 (b)', time: '', logReport: '' },
        { checkpointName: 'Basement 2 (c)', time: '', logReport: '' },
        { checkpointName: 'Ground Floor 1', time: '', logReport: '' },
        { checkpointName: 'Ground Floor 2', time: '', logReport: '' },
        { checkpointName: 'Level 8', time: '', logReport: '' },
        { checkpointName: 'Level 17', time: '', logReport: '' },
        { checkpointName: 'Level 5 (a)', time: '', logReport: '' },
        { checkpointName: 'Level 5 (b)', time: '', logReport: '' },
        {
            checkpointName: 'Genset Outside Building',
            time: '',
            logReport: ''
        },
        { checkpointName: 'Emergency Entrance', time: '', logReport: '' },
        { checkpointName: 'Outside Cafe 1', time: '', logReport: '' },
        { checkpointName: 'Outside Cafe 2', time: '', logReport: '' },
        { checkpointName: 'Service Lift Level 6', time: '', logReport: '' },
        { checkpointName: 'Service Lift Level 10', time: '', logReport: '' },
        { checkpointName: 'Service Lift Level 11', time: '', logReport: '' }
    ],
    'Jamek Mosque': [
        { checkpointName: 'Bilal Area', time: '', logReport: '' },
        { checkpointName: 'Mosque Tower', time: '', logReport: '' },
        { checkpointName: 'Cooling Tower', time: '', logReport: '' },
        { checkpointName: 'Mimbar Area', time: '', logReport: '' },
        { checkpointName: 'First Gate', time: '', logReport: '' }
    ],
    'City Mosque': [
        { checkpointName: 'Main Entrance', time: '', logReport: '' },
        { checkpointName: 'Gate 2', time: '', logReport: '' },
        {
            checkpointName: 'Backside Mosque (cemetery)',
            time: '',
            logReport: ''
        },
        { checkpointName: 'Muslimah Pray Area', time: '', logReport: '' }
    ],
    'Raudhatul Sakinah': [
        { checkpointName: 'Cemetery Area 1', time: '', logReport: '' },
        { checkpointName: 'Cemetery Area 2', time: '', logReport: '' },
        { checkpointName: 'Cemetery Area 3', time: '', logReport: '' },
        { checkpointName: 'Cemetery Area 4', time: '', logReport: '' },
        { checkpointName: 'Office Area 1', time: '', logReport: '' },
        { checkpointName: 'Office Area 2', time: '', logReport: '' },
        { checkpointName: 'Office Area 3', time: '', logReport: '' }
    ]
};

// Helper function to calculate cycle amounts
function calculateCycleAmount(index) {
    return index === 8 ? 8 : 4; // Example logic
}

// Function to create a new patrol report
const createPatrolReport = async (dutyHandoverId, location, date, shift, startTime, selectedNames) => {
    let endTime = '';
    let cycleAmount = '';

    if (startTime === '0700') {
        endTime = '1500';
    } else if (startTime === '1500') {
        endTime = '2300';
    } else if (startTime === '2300') {
        endTime = '0700';
        cycleAmount = 8;
    }

    const confirmLocation = locationMappings[location] || [];
    confirmLocation.forEach(checkpoint => checkpoint.fullName = '');

    const cycles = [];
    const cycleAmounts = { '0700': 4, '1500': 4, '2300': 8 };
    const timeSlotOffsets = { '0700': 0, '1500': 0, '2300': 0 };
    const timeSlotIncrements = { '0700': 200, '1500': 200, '2300': 100 };

    const timeSlotStartOffset = timeSlotOffsets[startTime];
    const timeSlotIncrement = timeSlotIncrements[startTime];

    for (let i = 0; i < cycleAmounts[startTime]; i++) {
        const timeSlotStart = (parseInt(startTime, 10) + i * timeSlotIncrement + timeSlotStartOffset) % 2400;
        const timeSlotEnd = (timeSlotStart + timeSlotIncrement) % 2400;
        const currentCycleAmount = calculateCycleAmount(i + 1);

        cycles.push({
            cycleSeq: i + 1,
            cycleAmount: currentCycleAmount,
            timeSlot: `${timeSlotStart.toString().padStart(4, '0')}-${timeSlotEnd.toString().padStart(4, '0')}`,
            checkpoint: confirmLocation
        });
    }

    const newPatrolReport = new PatrolAux({
        reportId: dutyHandoverId,
        type: 'Shift Member Location',
        shift: shift,
        startShift: startTime,
        endShift: endTime,
        date: moment(date).utcOffset(8).toDate(),
        location: location,
        status: 'Open',
        staff: selectedNames,
        shiftMember: { cycle: cycles },
        timestamp: moment().utcOffset(8).toDate()
    });

    try {
        await newPatrolReport.save();
        return newPatrolReport;
    } catch (error) {
        throw new Error('Error creating patrol report: ' + error.message);
    }
};

// async function archiveOldData() {
//     const archiveDate = moment().subtract(1, 'months').toDate();

//     // Find old records
//     const oldRecords = await Attendance.find({ timestamp: { $lt: archiveDate } }).exec();

//     if (oldRecords.length > 0) {
//         // Insert old records into the archive collection
//         await ArchivedAttendance.insertMany(oldRecords);

//         // Remove old records from the main collection
//         await Attendance.deleteMany({ timestamp: { $lt: archiveDate } });

//         console.log(`Archived ${oldRecords.length} records.`);
//     } else {
//         console.log('No records to archive.');
//     }
// }

// async function fetchArchivedData(userId, startDate, endDate) {
//     const archivedRecords = await ArchivedAttendance.find({
//         user: userId,
//         timestamp: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//         }
//     }).exec();

//     console.log('Archived Records:', archivedRecords);
// }

// async function fetchAllData(userId, startDate, endDate) {
//     const currentRecords = await Attendance.find({
//         user: userId,
//         timestamp: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//         }
//     }).exec();

//     const archivedRecords = await ArchivedAttendance.find({
//         user: userId,
//         timestamp: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//         }
//     }).exec();

//     const allRecords = currentRecords.concat(archivedRecords);

//     console.log('All Records:', allRecords);
// }

//  for restricted-link
const allowedIPs = ['175.140.45.73', '104.28.242.42', '210.186.48.79', '60.50.17.102', '175.144.217.244'];

function restrictAccess(req, res, next) {
    const clientIp = req.clientIp;
    if (allowedIPs.includes(clientIp)) {
        next();
    } else {
        res.render('error');
    }
}

// PORT INITIALIZATION ON CLOUD OR LOCAL (5001)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
