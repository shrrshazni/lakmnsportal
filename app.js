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
const webPush = require('web-push');

const app = express();

// ============================
// Extra comment
// ============================
// const generateVAPIDKeys = () => {
//     const vapidKeys = webPush.generateVAPIDKeys();
//     console.log('Public VAPID Key:', vapidKeys.publicKey);
//     console.log('Private VAPID Key:', vapidKeys.privateKey);
//     return vapidKeys;
// };

// Uncomment the line below to generate VAPID keys once
// const { publicKey, privateKey } = generateVAPIDKeys(); // Uncomment this line to generate keys

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
// const tenderDatabase = mongoose.createConnection(
//     'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/tender'
// );
// const Tender = tenderDatabase.model('Tender', tenderSchema);
// const TenderCompany = tenderDatabase.model('TenderCompany', tenderCompanySchema);

// async function createAllIndexes() {
//     try {
//         await User.createIndexes();
//         await UserLeave.createIndexes();
//         await Notification.createIndexes();
//         await Activity.createIndexes();
//         await Task.createIndexes();
//         await Info.createIndexes();
//         await Leave.createIndexes();
//         await File.createIndexes();
//         await Attendance.createIndexes();
//         await TempAttendance.createIndexes();
//         await QRCode.createIndexes();
//         await PatrolAux.createIndexes();
//         await ScheduleAux.createIndexes();
//         await DutyHandoverAux.createIndexes();
//         await CaseAux.createIndexes();

//         console.log('All indexes created successfully');
//     } catch (err) {
//         console.error('Error creating indexes:', err);
//     }
// }
// // createAllIndexes();

// // Deleted all indexes
// async function deleteAllIndexes(collection) {
//     try {
//         const indexes = await collection.indexes();
//         const indexNames = indexes
//             .filter(index => index.name !== '_id_') // Avoid dropping the default _id index
//             .map(index => index.name);

//         for (const indexName of indexNames) {
//             await collection.dropIndex(indexName);
//             console.log(`Dropped index: ${indexName}`);
//         }
//     } catch (err) {
//         console.error('Error deleting indexes:', err);
//     }
// }
// async function deleteAllIndexesFromCollections() {
//     try {
//         // Define the collections
//         const collections = [
//             User.collection,
//             UserLeave.collection,
//             Notification.collection,
//             Activity.collection,
//             Task.collection,
//             Info.collection,
//             Leave.collection,
//             File.collection,
//             Attendance.collection,
//             TempAttendance.collection,
//             QRCode.collection,
//             PatrolAux.collection,
//             ScheduleAux.collection,
//             DutyHandoverAux.collection,
//             CaseAux.collection
//         ];

//         for (const collection of collections) {
//             await deleteAllIndexes(collection);
//         }

//         console.log('All indexes deleted successfully');
//     } catch (err) {
//         console.error('Error deleting indexes from collections:', err);
//     }
// }
// // deleteAllIndexesFromCollections();

// // Update mongo indexes
// async function updateIndex(collection, indexName, indexSpec) {
//     try {
//         // Drop existing index if it exists
//         const existingIndexes = await collection.indexes();
//         const indexExists = existingIndexes.some(index => index.name === indexName);

//         if (indexExists) {
//             await collection.dropIndex(indexName);
//         }

//         // Create the new index
//         await collection.createIndex(indexSpec.key, {
//             name: indexSpec.name,
//             unique: indexSpec.unique || false,
//             background: true
//         });

//         console.log(`Index updated: ${indexSpec.name}`);
//     } catch (err) {
//         console.error(`Error updating index ${indexSpec.name}:`, err);
//     }
// }
// async function updateAllIndexes() {
//     try {
//         // User Collection
//         await updateIndex(User.collection, 'username_1', { key: { username: 1 }, name: 'username_1', unique: true });
//         await updateIndex(User.collection, 'email_1', { key: { email: 1 }, name: 'email_1', unique: true });

//         // UserLeave Collection
//         await updateIndex(UserLeave.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(UserLeave.collection, 'date_start_1', { key: { 'date.start': 1 }, name: 'date_start_1' });

//         // Notification Collection
//         await updateIndex(Notification.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(Notification.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

//         // Activity Collection
//         await updateIndex(Activity.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(Activity.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

//         // Task Collection
//         await updateIndex(Task.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(Task.collection, 'status_1', { key: { status: 1 }, name: 'status_1' });

//         // Info Collection
//         await updateIndex(Info.collection, 'type_1', { key: { type: 1 }, name: 'type_1' });
//         await updateIndex(Info.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

//         // Leave Collection
//         await updateIndex(Leave.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(Leave.collection, 'status_1', { key: { status: 1 }, name: 'status_1' });

//         // File Collection
//         await updateIndex(File.collection, 'fileId_1', { key: { fileId: 1 }, name: 'fileId_1', unique: true });

//         // Attendance Collection
//         await updateIndex(Attendance.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(Attendance.collection, 'date_signIn_1', { key: { 'date.signInTime': 1 }, name: 'date_signIn_1' });

//         // TempAttendance Collection
//         await updateIndex(TempAttendance.collection, 'user_1', { key: { user: 1 }, name: 'user_1' });
//         await updateIndex(TempAttendance.collection, 'timestamp_1', { key: { timestamp: 1 }, name: 'timestamp_1' });

//         // QRCode Collection
//         await updateIndex(QRCode.collection, 'code_1', { key: { code: 1 }, name: 'code_1', unique: true });

//         // PatrolAux Collection
//         await updateIndex(PatrolAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
//         await updateIndex(PatrolAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

//         // ScheduleAux Collection
//         await updateIndex(ScheduleAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
//         await updateIndex(ScheduleAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

//         // DutyHandoverAux Collection
//         await updateIndex(DutyHandoverAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
//         await updateIndex(DutyHandoverAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

//         // CaseAux Collection
//         await updateIndex(CaseAux.collection, 'date_1', { key: { date: 1 }, name: 'date_1' });
//         await updateIndex(CaseAux.collection, 'location_1', { key: { location: 1 }, name: 'location_1' });

//         console.log('All indexes updated successfully');
//     } catch (err) {
//         console.error('Error updating indexes:', err);
//     }
// }
// // updateAllIndexes();

// async function listIndexes(collection) {
//     try {
//         const indexes = await collection.indexes();
//         console.log(`Indexes for ${collection.collectionName}:`, indexes);
//     } catch (err) {
//         console.error(`Error listing indexes for ${collection.collectionName}:`, err);
//     }
// }
// // Check indexes for all collections
// async function checkIndexes() {
//     try {
//         await listIndexes(User.collection);
//         await listIndexes(UserLeave.collection);
//         await listIndexes(Notification.collection);
//         await listIndexes(Activity.collection);
//         await listIndexes(Task.collection);
//         await listIndexes(Info.collection);
//         await listIndexes(Leave.collection);
//         await listIndexes(File.collection);
//         await listIndexes(Attendance.collection);
//         await listIndexes(TempAttendance.collection);
//         await listIndexes(QRCode.collection);
//         await listIndexes(PatrolAux.collection);
//         await listIndexes(ScheduleAux.collection);
//         await listIndexes(DutyHandoverAux.collection);
//         await listIndexes(CaseAux.collection);

//         console.log('All indexes listed successfully');
//     } catch (err) {
//         console.error('Error listing indexes:', err);
//     }
// }
// // checkIndexes();
// ============================
// Procurement
// ============================

// To be settled later after auxiliary police/itary

// //PROCUREMENT

// //TENDER 

// //TENDER REGISTER
// app.get('/procurement/tender/register', isAuthenticated, async function (req, res) {
//     const username = req.user.username;
//     const user = await User.findOne({ username: username });
//     const notifications = await Notification.find({
//         recipient: user._id,
//         read: false
//     })
//         .populate('sender')
//         .sort({ timestamp: -1 });

//     if (user) {
//         try {
//             res.render('procurement-tender-register', {
//                 user: user,
//                 notifications: notifications,
//                 uuid: uuidv4(),
//             });
//         } catch (renderError) {
//             console.error('Rendering Error:', renderError);
//             next(renderError);
//         }
//     }
// });

// //TENDER LIST
// app.get('/procurement/tender/register', isAuthenticated, async function (req, res) {
//     const username = req.user.username;
//     const user = await User.findOne({ username: username });
//     const notifications = await Notification.find({
//         recipient: user._id,
//         read: false
//     })
//         .populate('sender')
//         .sort({ timestamp: -1 });

//     if (user) {
//         try {
//             res.render('procurement-tender-list', {
//                 user: user,
//                 notifications: notifications,
//                 uuid: uuidv4(),
//             });
//         } catch (renderError) {
//             console.error('Rendering Error:', renderError);
//             next(renderError);
//         }
//     }
// });



// ============================
// Set Up Middleware
// ============================
app.use(fileUpload());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(requestIp.mw());
app.set('trust proxy', true);

// ============================
// Set Up Express Session
// ============================
const sessionDatabase = mongoose.createConnection('mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/session');
const mongoURI = 'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/session';
const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'sessions',
    stringify: false,
    connection: sessionDatabase
});
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

// ============================
// Initialize Web Push 
// ============================
const publicVapidKey = 'BIm9U514rYCkeKfBkFzbt2hw7yUyF9TtWCEuz3SXfCCzSwfIDYk_Wh55nHngMr9TqeT6fwxB9KQ-phAVvmcPzKA';
const privateVapidKey = '_2XQYXRn3GBdELPjlec4d2HHYKUSAs3fJ2cU_lrx1eY';
webPush.setVapidDetails('mailto:protech@lakmns.org', publicVapidKey, privateVapidKey);

// ============================
// Initialize Passport and Session
// ============================
app.use(passport.initialize());
app.use(passport.session());

// ============================
// Connect to MongoDB
// ============================
const userDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/user'
);
const leaveDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/leave'
);
const fileDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/file'
);
const attendanceDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/attendance'
);
const auxPoliceDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/auxipolice'
);
const vmsDatabase = mongoose.createConnection(
    'mongodb+srv://protech-user-1:XCouh0jCtSKzo2EF@cluster-lakmnsportal.5ful3sr.mongodb.net/vms'
);

// ============================
// Define Mongoose Schema and Model
// ============================
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    nric: { type: String },
    phone: { type: String },
    officePhone: { type: String },
    profile: { type: String },
    age: { type: Number, min: 0 },
    address: { type: String },
    gender: { type: String },
    education: { type: String },
    department: { type: String },
    section: { type: String },
    position: { type: String },
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
}, { timestamps: true });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

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
    },
    study: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    },
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
    umrah: {
        leave: { type: Number, default: 7 },
        taken: { type: Number, default: 0 }
    },
    unpaid: {
        taken: { type: Number, default: 0 }
    },
    special: {
        leave: { type: Number, default: 3 },
        taken: { type: Number, default: 0 }
    }
}, { timestamps: true });
userLeaveSchema.index({ user: 1 });

const notificationSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String },
    url: { type: String },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
}, { timestamps: true });
notificationSchema.index({ recipient: 1, read: 1 });

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    title: { type: String },
    type: { type: String },
    description: { type: String }
}, { timestamps: true });
activitySchema.index({ user: 1, date: -1 });

const taskSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    subtask: [{ name: { type: String } }],
    assignee: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reminder: { type: Date }
}, { timestamps: true });
taskSchema.index({ owner: 1, timestamp: -1 });

const infoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date }
}, { timestamps: true });
infoSchema.index({ user: 1 });
infoSchema.index({ status: 1 });
infoSchema.index({ isOnline: 1 });

const approvalSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'submitted'],
        default: 'pending'
    },
    comment: { type: String },
    timestamp: { type: Date },
    estimated: { type: Date }
}, { timestamps: true });

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
    purpose: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'submitted', 'invalid', 'cancelled'],
        default: 'pending'
    },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now },
    estimated: {
        type: Date,
        default: () => {
            return moment().utcOffset(8).add(3, 'days').toDate();
        }
    },
    approvals: [approvalSchema]
}, { timestamps: true });
leaveSchema.index({ status: 1 });
leaveSchema.index({ user: 1 });
leaveSchema.index({ department: 1 });
leaveSchema.index({ 'date.start': 1 });
leaveSchema.index({ 'date.return': 1 });
leaveSchema.index({ timestamp: 1 });

const fileSchema = new mongoose.Schema({
    uuid: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    path: { type: String },
    date: { type: Date },
    type: { type: String },
    origin: { type: String },
    size: { type: String }
}, { timestamps: true });
fileSchema.index({ user: 1 });
fileSchema.index({ date: -1 });

const attendanceSchema = new mongoose.Schema({
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
attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ type: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ location: 1 });

const tempAttendanceSchema = new mongoose.Schema({
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
tempAttendanceSchema.index({ user: 1, timestamp: 1 });

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

const checkpointSchema = new mongoose.Schema({
    latitude: { type: Number },
    longitude: { type: Number },
    checkpointName: { type: String },
    time: { type: String },
    logReport: { type: String, required: true },
    fullName: { type: String, required: true },
    username: { type: String }
}, { _id: false });

const cycleAmountSchema = new mongoose.Schema({
    cycleSeq: { type: Number },
    timeSlot: { type: String },
    checkpoint: [checkpointSchema]
}, { _id: false });

const shiftMemberSchema = new mongoose.Schema({
    cycle: [cycleAmountSchema]
}, { _id: false });

const patrolSchema = new mongoose.Schema({
    reportId: { type: String, required: true },
    shift: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    status: { type: String, required: true },
    startShift: { type: String, required: true },
    endShift: { type: String, required: true },
    remarks: { type: String },
    staff: [{ type: String }],
    shiftMember: shiftMemberSchema,
    patrolUnit: [checkpointSchema],
    timestamp: { type: Date, default: Date.now }
});
patrolSchema.index({ reportId: 1 });
patrolSchema.index({ shift: 1 });
patrolSchema.index({ date: 1 });
patrolSchema.index({ location: 1 });
patrolSchema.index({ status: 1 });

const scheduleAuxSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    location: { type: String },
    shift: [],
    staffRaisedFlag: [],
    staffLoweredFlag: []
});
scheduleAuxSchema.index({ date: 1 });
scheduleAuxSchema.index({ location: 1 });

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
dutyHandoverSchema.index({ date: 1 });
dutyHandoverSchema.index({ location: 1 });
dutyHandoverSchema.index({ status: 1 });
dutyHandoverSchema.index({ shift: 1 });

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
caseSchema.index({ date: 1 });
caseSchema.index({ location: 1 });
caseSchema.index({ fullname: 1 });

const vmsSchema = new mongoose.Schema({
    vis_firstname: String,
    vis_lastname: String,
    no_ic: String,
    address: String,
    level: String,
    no_pas: String,
    no_telephone: String,
    pur_visit: String,
    time_in: Date,
    time_out: Date,
    build_loc: String
});

const subscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    expirationTime: { type: Date },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
subscriptionSchema.index({ endpoint: 1 });

// Integrate passport-local-mongoose and findOrCreate plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Initialize Schema
const User = userDatabase.model('User', userSchema);
const Activity = userDatabase.model('Activity', activitySchema);
const Info = userDatabase.model('Info', infoSchema);
const UserLeave = userDatabase.model('Leave', userLeaveSchema);
const Notification = userDatabase.model('Notification', notificationSchema);
const Task = userDatabase.model('Task', taskSchema);
const Leave = leaveDatabase.model('Leave', leaveSchema);
const File = fileDatabase.model('File', fileSchema);
const Attendance = attendanceDatabase.model('Attendance', attendanceSchema);
const TempAttendance = attendanceDatabase.model('TempAttendance', tempAttendanceSchema);
const QRCode = attendanceDatabase.model('QRCode', qrCodeSchema);
const ScheduleAux = auxPoliceDatabase.model('ScheduleAux', scheduleAuxSchema);
const PatrolAux = auxPoliceDatabase.model('PatrolAux', patrolSchema);
const CaseAux = auxPoliceDatabase.model('CaseAux', caseSchema);
const DutyHandoverAux = auxPoliceDatabase.model('DutyHandoverAux', dutyHandoverSchema);
const Vms = vmsDatabase.model('Visitors', vmsSchema);
const Subscriptions = userDatabase.model('Subscriptions', subscriptionSchema);

// ============================
// Configure Passport Local Strategy
// ============================
passport.use(new LocalStrategy(User.authenticate()));

// Serialize user information into the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// Deserialize user information from the session
passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        if (!user) {
            return done(null, false); // No user found
        }
        return done(null, user); // User found
    } catch (err) {
        return done(err, false); // Error during retrieval
    }
});

// Configure Nodemailer transporter for sending emails
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'protech@lakmns.org',
        pass: 'qlnnmsaexggkkyco' // Consider using environment variables for sensitive information
    }
});

// Global error handler middleware
app.use((err, req, res, next) => {
    // Log the error details to the console
    console.error('Global Error Handler:', err);

    // Respond with a 500 status and render the global error page
    res.status(500).render('global-error', {
        errorMessage: 'Something went wrong!'
    });
});

// ============================
// Utility
// ============================

// save activity toi database
const logActivity = async (userId, title, type, description) => {
    try {
        const activity = new Activity({
            user: userId,
            date: moment().utcOffset(8).toDate(),
            title: title,
            type: type,
            description: description
        });

        await activity.save();
        console.log('Activity logged:', activity);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// save notifcation to database & use push notifcation to other user
const createAndSendNotification = async (userId, recipientId, type, url, message) => {
    try {
        // Create a new notification
        const newNotification = new Notification({
            sender: userId,
            recipient: new mongoose.Types.ObjectId(recipientId),
            type: type,
            url: url,
            message: message
        });

        await newNotification.save();
        console.log('Notification created:', newNotification);

        // Fetch subscriptions for the recipient user
        const subscriptions = await Subscriptions.find({ user: recipientId });

        if (subscriptions.length > 0) {
            // Map through the subscriptions to send notifications
            const sendNotificationPromises = subscriptions.map(async (subscription) => {
                const payload = JSON.stringify({
                    title: type,
                    body: message,
                    url: "https://www.lakmnsportal.com/",
                    vibrate: [100, 50, 100],
                    requireInteraction: true,
                    silent: false
                });

                const options = {
                    vapidDetails: {
                        subject: 'mailto:protech@lakmns.org', // Replace with your email
                        publicKey: publicVapidKey, // Use actual public VAPID key here
                        privateKey: privateVapidKey // Use actual private VAPID key here
                    },
                    TTL: 60 // Time to live for the notification (in seconds)
                };

                try {
                    await webPush.sendNotification(subscription, payload, options);
                    console.log('Push notification sent successfully to:', subscription.endpoint);
                } catch (error) {
                    console.error('Error sending notification to:', subscription.endpoint, error);
                }
            });

            // Wait for all notifications to be sent
            await Promise.all(sendNotificationPromises);
        } else {
            console.log('The user does not subscribe for push notifications');
        }
    } catch (error) {
        console.error('Error creating or sending notification:', error);
    }
};

// save notifcation to database & send email to other user using transporter
const sendEmailNotification = async (recipientEmail, emailData) => {
    try {
        // Generate the HTML content for the email using EJS template rendering
        const emailHTML = await new Promise((resolve, reject) => {
            app.render('email-template', { emailData }, (err, html) => {
                if (err) reject(err);
                else resolve(html);
            });
        });

        console.log('Generated email HTML:', emailHTML);
        console.log('Email data:', emailData);

        // Define the mail options for sending the email
        let mailOptions = {
            from: 'protech@lakmns.org', // Replace with your sender email address
            to: recipientEmail,
            subject: 'lakmnsportal - Leave Request Approval',
            html: emailHTML
        };

        // Send the email using the Nodemailer transporter
        const info = await transporter.sendMail(mailOptions);

        if (info) {
            console.log('Email sent successfully to:', recipientEmail);
        } else {
            console.log('Email sending failed');
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Allowed IP addresses for restricted access
const allowedIPs = [
    '175.140.45.73', '104.28.242.42', '210.186.48.79',
    '60.50.17.102', '175.144.217.244', '203.106.120.240'
];

// Middleware to restrict access based on IP address
const restrictAccess = (req, res, next) => {
    const clientIp = req.clientIp;

    if (allowedIPs.includes(clientIp)) {
        next();
    } else {
        res.render('error');
    }
};

// ============================
// Routes
// ============================

// Landing page route
app.get('/landing', async (req, res, next) => {
    try {
        // Render the landing page
        res.render('landing-page');
    } catch (renderError) {
        // Log any errors that occur during rendering
        console.error('Rendering Error:', renderError);

        // Pass the error to the global error handler middleware
        next(renderError);
    }
});

// ============================
// Authentication
// ============================

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            const user = await User.findOne({ username: req.user.username });
            const notifications = await Notification.find({
                recipient: user._id,
                read: false
            }).populate('sender').sort({ timestamp: -1 });

            req.user = user; // Attach user to req object
            req.notifications = notifications; // Attach notifications to req object

            return next(); // User is authenticated, proceed to the next middleware
        } catch (error) {
            console.error('Error in isAuthenticated middleware:', error);
            return res.redirect('/landing'); // Handle error and redirect if necessary
        }
    }
    res.redirect('/landing'); // Redirect to the landing page if not authenticated
};

// Sign in routes
app.get('/sign-in', async (req, res, next) => {
    try {
        res.render('sign-in', {
            // Initial validation states
            validationUsername: '',
            validationPassword: '',
            // Input values
            username: '',
            password: '',
            // Toast notification
            toastShow: '',
            toastMsg: ''
        });
    } catch (renderError) {
        // Log rendering errors and pass to global error handler
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/sign-in', async (req, res, next) => {
    const { username, password, rememberMe } = req.body;

    // Start measuring sign-in process time
    console.time('Sign-in Process');

    // Calculate expiration date based on rememberMe checkbox
    const expirationDate = rememberMe
        ? moment().utcOffset(8).add(7, 'days').toDate()  // 7 days if rememberMe is checked
        : moment().utcOffset(8).add(1, 'hour').toDate(); // 1 hour otherwise

    const passwordRegex = /^(?:\d+|[a-zA-Z0-9]{2,})/; // Password validation regex

    try {
        // Find user by username
        const user = await User.findByUsername(username);

        // Validate username and password
        const validationUsername = username && user ? 'is-valid' : 'is-invalid';
        const validationPassword = password && passwordRegex.test(password) ? 'is-valid' : 'is-invalid';

        // Check if both username and password are valid
        if (validationUsername === 'is-valid' && validationPassword === 'is-valid') {
            user.authenticate(password, async (err, authenticatedUser) => {
                if (err || !authenticatedUser) {
                    // End timing and log for invalid authentication
                    console.timeEnd('Sign-in Process');

                    return res.render('sign-in', {
                        validationUsername,
                        validationPassword: 'is-invalid',
                        username,
                        password,
                        toastShow: 'show',
                        toastMsg: 'Incorrect password'
                    });
                }

                // Password is correct, log in the user
                req.logIn(authenticatedUser, async err => {
                    if (err) {
                        // End timing and log for login error
                        console.timeEnd('Sign-in Process');
                        return next(err);
                    }

                    // Update user info
                    await Info.findOneAndUpdate(
                        { user: user._id },
                        { isOnline: true, lastSeen: moment().utcOffset(8).toDate() },
                        { new: true }
                    );

                    // Set session expiration date
                    req.session.cookie.expires = expirationDate;
                    console.log(`Current Session expires: ${req.session.cookie.expires}`);

                    // End timing and redirect to home
                    console.timeEnd('Sign-in Process');
                    return res.redirect('/');
                });
            });
        } else {
            // End timing and render sign-in page with validation errors
            console.timeEnd('Sign-in Process');

            res.render('sign-in', {
                validationUsername,
                validationPassword,
                username,
                password,
                toastShow: 'show',
                toastMsg: 'There is an error, please check your input'
            });
        }
    } catch (error) {
        // End timing and handle unexpected errors
        console.timeEnd('Sign-in Process');
        console.error('Sign-in Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Forgot password routes
app.get('/forgot-password', async (req, res, next) => {
    try {
        res.render('forgot-password', {
            show: '',
            alert: ''
        });
    } catch (renderError) {
        // Log rendering errors and pass to global error handler
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/forgot-password', async (req, res, next) => {
    const email = req.body.email;

    // Find the user by email
    const checkEmail = await User.findOne({ email });

    // Generate a random alphanumeric code for the reset link
    const randomUUID = uuidv4();
    const randomAlphaNumeric = randomUUID
        .replace(/-/g, '')
        .substring(0, 5)
        .toUpperCase();

    const emailData = {
        checkEmail,
        uuid: randomAlphaNumeric,
    };

    console.log('User Email:', emailData.checkEmail);
    console.log('Generated Code:', emailData.uuid);

    // Render the email HTML content
    const emailHTML = await new Promise((resolve, reject) => {
        app.render('email', { uuid: randomAlphaNumeric, checkEmail }, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });

    console.log('Email HTML:', emailHTML);

    if (checkEmail) {
        // Define mail options
        const mailOptions = {
            from: 'protech@lakmns.org',
            to: checkEmail.email,
            subject: 'lakmnsportal - Reset Password',
            html: emailHTML,
        };

        // Send the reset password email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email Send Error:', error);

                // Render forgot password page with error alert
                return res.render('forgot-password', {
                    show: 'show',
                    alert: 'The email you submitted is invalid or does not belong to any user in our web app.'
                });
            }

            console.log('Message sent:', info.messageId, info.response);

            // Render forgot password page with success alert
            return res.render('forgot-password', {
                show: 'show',
                alert: 'We have sent a reset password link and a 5-character alpha-numeric code to your email. Please check it.'
            });
        });
    } else {
        // Render forgot password page with email not found alert
        return res.render('forgot-password', {
            show: 'show',
            alert: 'The email address you entered is not registered in lakmnsportal. Please check your email again.'
        });
    }
});

// Reset password routes
app.get('/reset-password/:id', async (req, res, next) => {
    const id = req.params.id;
    console.log('Reset Password ID:', id);

    try {
        res.render('reset-password', {
            id,
            show: '',
            alert: ''
        });
    } catch (renderError) {
        // Log rendering errors and pass to global error handler
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/reset-password/:id', async (req, res, next) => {
    const id = req.params.id;
    const { password, confirmPassword } = req.body;

    // Find the user by ID
    const user = await User.findOne({ _id: id });

    if (!user) {
        // If the user is not found, render the page with an error message
        return res.render('reset-password', {
            id,
            show: 'show',
            alert: 'User not found!'
        });
    }

    if (password === confirmPassword) {
        try {
            // Set the new password and save the user
            await user.setPassword(password);
            const updatePassword = await user.save();

            if (updatePassword) {
                // Render the sign-in page with a success message
                return res.render('sign-in', {
                    validationUsername: '',
                    validationPassword: '',
                    username: '',
                    password: '',
                    toastShow: 'show',
                    toastMsg: 'Reset password successful!'
                });
            } else {
                // Render the reset password page with an error message
                return res.render('reset-password', {
                    id,
                    show: 'show',
                    alert: 'Update password failed!'
                });
            }
        } catch (renderError) {
            // Log errors during password update and rendering
            console.error('Rendering Error:', renderError);
            next(renderError);
        }
    } else {
        // Render the reset password page with a mismatch alert
        return res.render('reset-password', {
            id,
            show: 'show',
            alert: 'New password and confirm password do not match!'
        });
    }
});

// Sign out route
app.get('/sign-out/:id', async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Find the user by ID
        const user = await User.findOne({ _id: userId });

        if (!user) {
            // If user is not found, handle the error (could also redirect to an error page)
            return res.redirect('/');
        }

        // Update user info to mark as offline
        const updateInfo = await Info.findOneAndUpdate(
            { user: user._id },
            { isOnline: false, lastSeen: moment().utcOffset(8).toDate() },
            { new: true }
        );

        // Log the sign-out time or failure message
        if (updateInfo) {
            console.log('Sign out at ' + moment().utcOffset(8).toDate());
        } else {
            console.log('Failed to update user info');
        }

        // Destroy the session and redirect to home
        req.session.destroy((err) => {
            if (err) {
                // Pass any session destruction errors to the global error handler
                return next(err);
            }
            res.redirect('/');
        });
    } catch (error) {
        // Handle any unexpected errors
        console.error('Sign-out Error:', error);
        next(error);
    }
});

// ============================
// Main
// ============================

// Dashboard route
app.get('/', isAuthenticated, async (req, res, next) => {
    const user = req.user; // User data from the middleware
    const notifications = req.notifications; // Notifications data from the middleware

    const startTotal = performance.now();

    // Helper function to log execution time
    const logTime = (label, start) => {
        const end = performance.now();
        console.log(`${label} took ${end - start}ms`);
    };

    try {
        // Remove notifications older than one month
        const oneMonthAgo = moment().subtract(1, 'months').toDate();
        await Notification.deleteMany({ createdAt: { $lt: oneMonthAgo } });

        // Start fetching data in parallel
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

        // Process leave data
        const startLeaveProcessing = performance.now();
        let todayLeaves = [];
        let weekLeaves = [];
        let monthLeaves = [];
        const today = moment().utcOffset(8).startOf('day');
        const firstDayOfWeek = today.clone().startOf('isoWeek');
        const lastDayOfWeek = today.clone().endOf('isoWeek');
        const firstDayOfMonth = today.clone().startOf('month');
        const lastDayOfMonth = today.clone().endOf('month');

        staffOnLeave.forEach(leave => {
            if (isDateInRange(leave.date.start, leave.date.return)) {
                todayLeaves.push(leave);
            }
            if (leave.date.start <= lastDayOfWeek && leave.date.return >= firstDayOfWeek) {
                weekLeaves.push(leave);
            }
            if (leave.date.start <= lastDayOfMonth && leave.date.return >= firstDayOfMonth) {
                monthLeaves.push(leave);
            }
        });
        logTime('Leave Processing', startLeaveProcessing);

        // Filter approval leaves based on user role
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

        // Collect unique departments and sections
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

        // Render the home page
        res.render('home', {
            user,
            notifications,
            uuid: uuidv4(),
            userTeamMembers,
            otherTasks: otherTask,
            otherActivities,
            todayLeaves,
            weekLeaves,
            monthLeaves,
            filteredApprovalLeaves,
            departments,
            sections,
            allUser,
            allUserLeave,
            allLeave,
            allInfo,
            userLeave,
            leave,
            tasks: task,
            files: file,
            activities,
            selectedNames: '',
            info,
            show: '',
            alert: '',
            clientIp: req.clientIp // Assuming clientIp middleware is in use
        });

        logTime('Total', startTotal);
    } catch (error) {
        // Pass any unexpected errors to the global error handler middleware
        console.error('Route Error:', error);
        next(error);
    }
});

// Guide route
app.get('/guide', isAuthenticated, async (req, res, next) => {
    try {
        // Get the authenticated user and their unread notifications
        const user = req.user;
        const notifications = req.notifications;

        // Render the guide page
        res.render('guide', {
            user: user,
            notifications: notifications,
            uuid: uuidv4() // Generate a unique ID for the session or content
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass errors to the global error handler
    }
});

// Changelog route
app.get('/changelog', isAuthenticated, async (req, res, next) => {
    try {
        // Get the authenticated user and their unread notifications
        const user = req.user;
        const notifications = req.notifications;

        // Render the changelog page
        res.render('changelog', {
            user: user,
            notifications: notifications,
            uuid: uuidv4() // Generate a unique ID for the session or content
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass errors to the global error handler
    }
});

// Calendar route
app.get('/calendar', isAuthenticated, async (req, res, next) => {
    try {
        // Get the authenticated user and their unread notifications from the middleware
        const user = req.user;
        const notifications = req.notifications;

        // Render the calendar page with the user and notifications data
        res.render('calendar', {
            user: user,
            notifications: notifications
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass errors to the global error handler
    }
});

// ============================
// Profile
// ============================

// Profile route
app.get('/profile', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = req.notifications;

        const userLeave = await UserLeave.find({ user: user._id });
        const leave = await Leave.find({
            user: user._id,
            status: { $nin: ['denied', 'cancelled'] }
        }).sort({ timestamp: -1 });

        const activities = await Activity.find({ user: user._id }).sort({ date: -1 });
        const allUser = await User.find();
        const file = await File.find({ type: { $ne: 'leave' } }).sort({ date: -1 });
        const attendance = await Attendance.find({ user: user._id }).sort({ timestamp: -1 });

        // Calculate user's age and update if needed
        const date = getDateFormat2();
        const age = calculateAge(user.birthdate);
        await User.updateOne(
            { username: user.username },
            { $set: { age } }
        );

        // Fetch additional info
        const info = await Info.findOne({ user: user._id });

        res.render('profile', {
            user,
            notifications,
            leave,
            userLeave,
            activities,
            info,
            today: date,
            allUser,
            files: file,
            attendance
        });
    } catch (error) {
        console.error('Route Error:', error);
        next(error);
    }
});

// ============================
// Settings
// ============================

// Settings route - get
app.get('/settings', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = req.notifications;
        const info = await Info.findOne({ user: user._id });
        const sub = await Subscriptions.findOne({ user: user._id });

        res.render('settings', {
            user,
            uuid: uuidv4(),
            notifications,
            info,
            subscriptions: sub,
            show: '',
            alert: ''
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Settings route - post
app.post('/settings', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = req.notifications;
        const info = await Info.findOne({ user: user._id });
        const sub = await Subscriptions.findOne({ user: user._id });

        // Collect fields to update from request body
        const updateFields = {};
        if (req.body.officenumber) updateFields.officenumber = req.body.officenumber;
        if (req.body.email) updateFields.email = req.body.email;
        if (req.body.phone) updateFields.phone = req.body.phone;
        if (req.body.dateEmployed) updateFields.dateEmployed = moment(req.body.dateEmployed).utcOffset(8).toDate();
        if (req.body.birthdate) updateFields.birthdate = moment(req.body.birthdate).utcOffset(8).toDate();
        if (req.body.nric) updateFields.nric = req.body.nric;
        if (req.body.marital && req.body.marital !== 'Select your marital status') updateFields.marital = req.body.marital;
        if (req.body.education && req.body.education !== 'Select your highest education') updateFields.education = req.body.education;
        if (req.body.address) updateFields.address = req.body.address;
        if (req.body.children && req.body.children !== 'Select your number of children') updateFields.children = parseInt(req.body.children);

        // Handle cases with no updates
        if (Object.keys(updateFields).length === 0) {
            res.render('settings', {
                user,
                uuid: uuidv4(),
                notifications,
                info,
                subscriptions: sub,
                show: 'show',
                alert: 'Update unsuccessful, there is no input to be updated'
            });
            return;
        }

        // Check if email already exists
        if (updateFields.email) {
            const emailExists = await User.findOne({ email: updateFields.email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                res.render('settings', {
                    user,
                    uuid: uuidv4(),
                    notifications,
                    info,
                    subscriptions: sub,
                    show: 'show',
                    alert: 'The email address is already in use by another account.'
                });
                return;
            }
        }

        // Update user fields
        const updateUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: updateFields },
            { upsert: true, new: true }
        );

        if (updateUser) {
            // Update info fields if email or phone are changed
            const updateInfoFields = {};
            if (updateFields.phone) updateInfoFields.phoneVerified = false;
            if (updateFields.email) updateInfoFields.emailVerified = false;

            if (Object.keys(updateInfoFields).length > 0) {
                await Info.findOneAndUpdate(
                    { user: user._id },
                    { $set: updateInfoFields },
                    { upsert: true, new: true }
                );
            }

            // Log the activity
            const activityUser = new Activity({
                user: user._id,
                date: moment().utcOffset(8).toDate(),
                title: 'Update profile',
                type: 'Profile',
                description: `${user.fullname} has updated their profile on ${moment().format('YYYY-MM-DD')}`
            });
            await activityUser.save();

            res.render('settings', {
                user,
                uuid: uuidv4(),
                notifications,
                info,
                subscriptions: sub,
                show: 'show',
                alert: 'Update successful. Please check your profile to see the changes.'
            });
        } else {
            res.render('settings', {
                user,
                uuid: uuidv4(),
                notifications,
                info,
                subscriptions: sub,
                show: 'show',
                alert: 'Update unsuccessful. Please check your profile to see the changes.'
            });
        }
    } catch (error) {
        console.error('Route Error:', error);
        next(error);
    }
});

// Settings route - change password
app.post('/settings/change-password', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = req.notifications;
        const info = await Info.findOne({ user: user._id });
        const sub = await Subscriptions.findOne({ user: user._id });

        // Validate old password and new password
        const isPasswordValid = await user.authenticate(req.body.oldPassword);
        const newPasswordMatch = req.body.newPassword === req.body.newPassword2;

        if (!isPasswordValid.user) {
            res.render('settings', {
                user,
                uuid: uuidv4(),
                notifications,
                info,
                subscriptions: sub,
                show: 'show',
                alert: 'Update unsuccessful, maybe you entered a wrong current password'
            });
            return;
        }

        if (!newPasswordMatch) {
            res.render('settings', {
                user,
                uuid: uuidv4(),
                notifications,
                info,
                subscriptions: sub,
                show: 'show',
                alert: 'Update unsuccessful, new password and confirm password do not match'
            });
            return;
        }

        // Set and save new password
        await user.setPassword(req.body.newPassword);
        await user.save();

        res.render('settings', {
            user,
            uuid: uuidv4(),
            notifications,
            info,
            subscriptions: sub,
            show: 'show',
            alert: 'Update successful on new password, you can use it onwards'
        });
    } catch (error) {
        console.error('Route Error:', error);
        next(error);
    }
});

// Setting route - upload/change profile image
app.post('/settings/upload/profile-image', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        if (!req.files || Object.keys(req.files).length === 0) {
            console.log('No files selected');
            return res.redirect('/settings');
        }

        for (const file of Object.values(req.files)) {
            const uploadPath = __dirname + '/public/uploads/' + file.name;
            const pathUpload = '/uploads/' + file.name;
            const today = moment().utcOffset(8).startOf('day').toDate();

            await file.mv(uploadPath);

            // Log the activity
            const activityUser = new Activity({
                user: user._id,
                date: moment().utcOffset(8).toDate(),
                title: 'Update profile',
                type: 'Profile',
                description: `${user.fullname} has updated their profile at ${getDateFormat2(today)}`
            });
            await activityUser.save();

            await User.findOneAndUpdate(
                { username: user.username },
                { profile: pathUpload },
                { upsert: true, new: true }
            );
        }

        res.redirect('/settings');
    } catch (error) {
        console.error('Route Error:', error);
        next(error);
    }
});

// Info route - method
app.get('/info/:type/:method/:id', async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = req.notifications;
        const type = req.params.type;
        const method = req.params.method;
        const id = req.params.id;

        const info = await Info.findOne({ user: user._id });
        const sub = await Subscriptions.findOne({ user: user._id });

        // Fetch requested info based on type and method
        let requestedInfo = [];
        if (type === 'info') {
            if (method === 'admin') {
                requestedInfo = await Info.find();
            } else if (method === 'personal') {
                requestedInfo = await Info.find({ user: id });
            }
        } else if (type === 'subscription') {
            if (method === 'admin') {
                requestedInfo = await Subscriptions.find();
            } else if (method === 'personal') {
                requestedInfo = await Subscriptions.find({ user: id });
            }
        }

        res.render('info', {
            user,
            notifications,
            info,
            subscriptions: sub,
            requestedInfo
        });
    } catch (error) {
        console.error('Route Error:', error);
        next(error);
    }
});

// Info route - status update
app.post('/status-update', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const { username } = user;
        const { status } = req.body;

        // Find the user and update their status
        const updatedInfo = await Info.findOneAndUpdate(
            { user: user._id },
            { $set: { status } },
            { upsert: true, new: true, useFindAndModify: false }
        );

        if (updatedInfo) {
            console.log('Status update accomplished!');
            res.redirect('/');
        } else {
            console.log('Status update failed!');
            res.redirect('/');
        }
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// Staff details route
app.get('/staff/details/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch otherUser first since other queries depend on it
        const otherUser = await User.findOne({ _id: id });

        // Execute all asynchronous operations concurrently
        const [
            tasks,
            files,
            allUsers,
            info,
            leave,
            activities,
            attendance
        ] = await Promise.all([
            Task.find({ assignee: { $in: [otherUser._id] } }).populate('assignee'),
            File.find(),
            User.find(),
            Info.findOne({ user: otherUser._id }),
            Leave.find({ user: otherUser._id, status: { $nin: ['denied', 'cancelled'] } }).sort({ timestamp: -1 }),
            Activity.find({ user: otherUser._id }).sort({ date: -1 }),
            Attendance.find({ user: otherUser._id }).sort({ timestamp: -1 })
        ]);

        res.render('staff-details', {
            user: req.user,              // Use req.user set by isAuthenticated middleware
            notifications: req.notifications, // Use req.notifications set by middleware
            otherUser,
            tasks,
            files,
            allUsers,
            info,
            leave,
            activities,
            attendance
        });

    } catch (error) {
        console.error('Error fetching staff details:', error);
        next(error); // Pass the error to the global error handler
    }
});

// ============================
// Notification Handling
// ============================

// Notification history route
app.get('/notifications/history', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const { _id: userId } = user;

        // Fetch all notifications
        const notifications = await Notification.find({
            recipient: userId,
            read: false
        }).populate('sender').sort({ timestamp: -1 });

        // Define date ranges using moment
        const today = moment().utcOffset(8).startOf('day').toDate();
        const tomorrow = moment(today).add(1, 'days').toDate();
        const yesterday = moment(today).subtract(1, 'days').toDate();
        const firstDayOfWeek = moment(today).startOf('isoWeek').toDate();
        const lastDayOfWeek = moment(today).endOf('isoWeek').toDate();
        const firstDayOfMonth = moment(today).startOf('month').toDate();
        const lastDayOfMonth = moment(today).endOf('month').toDate();

        // Fetch notifications based on date ranges
        const notificationsToday = await Notification.find({
            recipient: userId,
            timestamp: { $gte: today, $lt: tomorrow }
        }).populate('sender').sort({ timestamp: -1, read: -1 });

        const notificationsYesterday = await Notification.find({
            recipient: userId,
            timestamp: { $gte: yesterday, $lt: today }
        }).populate('sender').sort({ timestamp: -1, read: -1 });

        const notificationsThisWeek = await Notification.find({
            recipient: userId,
            timestamp: { $gte: firstDayOfWeek, $lte: lastDayOfWeek }
        }).populate('sender').sort({ timestamp: -1, read: -1 });

        const notificationsThisMonth = await Notification.find({
            recipient: userId,
            timestamp: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }).populate('sender').sort({ timestamp: -1, read: -1 });

        // Render notifications page
        res.render('notifications', {
            user,
            notifications,
            notificationsToday,
            notificationsYesterday,
            notificationsThisWeek,
            notificationsThisMonth
        });
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// Notification route - mark as read
app.get('/markAsRead/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Update the notification status
        const update = await Notification.findByIdAndUpdate(
            id,
            { read: true },
            { new: true }
        );

        // Redirect based on update success
        if (update) {
            res.redirect(update.url);
        } else {
            console.log('Error updating notification');
            res.redirect('/');
        }
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// Notification route - mark all as read
app.get('/markAllAsRead', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const { _id: userId } = user;

        // Update all unread notifications
        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );

        res.redirect('/');
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// Web push notification route - send public vapid key
app.get('/vapidPublicKey', (req, res) => {
    res.send(publicVapidKey);
});

// Web push notification route - subscription
app.post('/subscribe', async (req, res, next) => {
    const { endpoint, expirationTime, keys, userId } = req.body;

    if (!endpoint || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: 'Missing required subscription details.' });
    }

    try {
        const subscription = new Subscriptions({
            endpoint,
            expirationTime,
            keys,
            user: userId
        });

        await subscription.save();
        res.status(201).json({ message: 'Subscription saved successfully.' });
    } catch (error) {
        console.error('Failed to save subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription.' });
    }
});

// Web push notification route - check existed subscription
app.post('/check-subscription', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const { _id: userId } = user;
        const subscription = req.body;

        const existingSubscription = await Subscriptions.findOne({
            endpoint: subscription.endpoint,
            user: userId
        });

        const isSubscribed = existingSubscription &&
            existingSubscription.keys.p256dh === subscription.keys.p256dh &&
            existingSubscription.keys.auth === subscription.keys.auth;

        res.json({ isSubscribed: !!isSubscribed });
    } catch (error) {
        next(error);  // Use global error handler
    }
});


// ============================
// File Handling
// ============================

// File route - upload
app.post('/files/upload', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const { username } = user;
        const { uuid, origin } = req.body;
        const files = req.files;

        if (!files || Object.keys(files).length === 0) {
            console.log('No files selected');
            return res.status(400).send('No files selected');
        }

        console.log('Files being uploaded');

        for (const file of Object.values(files)) {
            const uploadPath = __dirname + '/public/uploads/' + file.name;
            const pathUpload = '/uploads/' + file.name;
            const today = moment().utcOffset(8).startOf('day').toDate();
            const type = path.extname(file.name);

            // Move file to upload directory
            await file.mv(uploadPath);

            // Calculate file size in megabytes
            const fileSizeInBytes = (await fs.stat(uploadPath)).size;
            const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

            console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);

            const newFile = new File({
                uuid,
                user: user._id,
                name: file.name,
                path: pathUpload,
                date: today,
                type,
                origin,
                size: `${fileSizeInMB.toFixed(2)} MB`
            });

            await newFile.save();
        }

        console.log('Files uploaded successfully');
        res.redirect('/');
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// File route - downlaod
app.get('/files/download/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id);

        if (file) {
            const filePath = __dirname + '/public/uploads/' + file.name;
            res.download(filePath, file.name);
            console.log('Downloading file');
        } else {
            console.log('File not found');
            res.status(404).send('File not found');
        }
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// File route - delete by id
app.get('/files/delete/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const deletedFile = await File.findByIdAndDelete(id);

        if (deletedFile) {
            const otherFiles = await File.find({
                name: deletedFile.name,
                size: deletedFile.size
            });

            if (otherFiles.length > 0) {
                console.log('File removed from database only');
            } else {
                const filePath = __dirname + '/public/uploads/' + deletedFile.name;
                console.log('File deleted from filesystem and database');
                await fs.unlink(filePath);
            }

            res.redirect('/');
        } else {
            console.log('Error deleting the file');
            res.status(404).send('Error deleting the file');
        }
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// File route - delete by uuid
app.get('/files/delete/cancel/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;

        const filesToDelete = await File.find({ uuid });
        const result = await File.deleteMany({ uuid });

        if (result.deletedCount > 0) {
            console.log(`${result.deletedCount} files deleted`);

            for (const file of filesToDelete) {
                const filePath = __dirname + '/public/uploads/' + file.name;
                await fs.unlink(filePath);
            }

            res.redirect('/leave/request');
        } else {
            console.log('No files found or error occurred');
            res.status(404).send('No files found or error occurred');
        }
    } catch (error) {
        next(error);  // Use global error handler
    }
});

// ============================
// Search query
// ============================

// Search staff - assignee relief
app.get('/search/staff/assignee-relief', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const query = req.query.query;

    try {
        let results = [];

        if (query && query.trim() !== '') {
            // Define common query options
            const commonQuery = { fullname: { $regex: query, $options: 'i' } };

            // Define user-specific query options based on roles
            const queries = [];

            if (user.isChiefExec) {
                queries.push({ isDeputyChiefExec: true }, { isManagement: true }, { isPersonalAssistant: true });
            } else if (user.isDeputyChiefExec) {
                queries.push({ isHeadOfDepartment: true }, { isManagement: true }, { isPersonalAssistant: true });
            } else if (user.isHeadOfDepartment) {
                queries.push({ department: user.department });
            } else if (user.isPersonalAssistant) {
                queries.push({ department: user.department }, { isPersonalAssistant: true });
            } else if (user.isDriver) {
                queries.push({ department: user.department }, { isDriver: true });
            } else if (user.isTeaLady) {
                queries.push({ department: user.department }, { isTeaLady: true });
            } else if (user.isAdmin) {
                queries.push({ department: user.department }, { isAdmin: true });
            } else {
                queries.push({ department: user.department });
            }

            // Execute the query with role-based conditions
            results = await User.find({
                $or: queries.map(query => ({ ...query, ...commonQuery }))
            });
        }

        res.json(results);
    } catch (err) {
        console.error('Error searching staff (assignee relief):', err);
        res.status(500).send('Internal Server Error');
    }
});

// Search Staff - Auxiliary Police
app.get('/search/staff/auxiliary-police', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = await User.findOne({ username: username });
    const query = req.query.query;

    try {
        let results = [];

        if (query && query.trim() !== '') {
            // Define common query options
            const commonQuery = { fullname: { $regex: query, $options: 'i' } };

            // Define user-specific query options based on roles
            const queries = [];

            if (user.isChiefExec) {
                queries.push({ isDeputyChiefExec: true }, { isManagement: true }, { isPersonalAssistant: true });
            } else if (user.isDeputyChiefExec) {
                queries.push({ isHeadOfDepartment: true }, { isManagement: true }, { isPersonalAssistant: true });
            } else if (user.isHeadOfDepartment) {
                queries.push({ department: user.department });
            } else if (user.isPersonalAssistant) {
                queries.push({ department: user.department }, { isPersonalAssistant: true });
            } else if (user.isAdmin) {
                queries.push({ department: user.department }, { isAdmin: true });
            } else {
                queries.push({ section: user.section });
            }

            // Execute the query with role-based conditions
            results = await User.find({
                $or: queries.map(query => ({ ...query, ...commonQuery }))
            });
        }

        res.json(results);
    } catch (err) {
        console.error('Error searching staff (auxiliary police):', err);
        res.status(500).send('Internal Server Error');
    }
});

// ============================
// Task
// ============================

// Task route - add
app.post('/task/add', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user; // User object is already available from isAuthenticated middleware

        const {
            name,
            description,
            status,
            due,
            reminder,
            selectedNames = '',
            uuid: fileId
        } = req.body;

        const selectedNamesArray = selectedNames ? selectedNames.split(',') : [];

        if (name && description && status && due && reminder && selectedNamesArray.length > 0) {
            // Fetch assignees based on selected names
            const assignees = await User.find({ fullname: { $in: selectedNamesArray } }, '_id');

            // Create new task
            const newTask = new Task({
                owner: user._id,
                name,
                description,
                status,
                due,
                reminder,
                assignee: assignees,
                fileId
            });

            await newTask.save();  // Save task to database

            // Loop through each assignee to create and send notifications
            for (const assignee of assignees) {
                // Send push notification
                await createAndSendNotification(
                    user._id, // Sender
                    assignee._id, // Recipient
                    'Task Assignment',
                    `/`,
                    `You have been assigned to a new task: ${name}`
                );

                // Send email notification
                await sendEmailNotification(assignee.email, {
                    content: `You have been assigned to a new task: ${name}. Please check the task details.`,
                    id: newTask._id
                });
            }

            console.log('New task added');
            res.redirect('/');
        } else {
            console.log('Input was not valid or complete, please try again!');
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        next(error);  // Pass error to global error handler
    }
});

// Task route - update
app.post('/update/:content/:id', isAuthenticated, async (req, res, next) => {
    const user = req.user; // Directly use the authenticated user from the middleware
    const notifications = req.notifications; // Access notifications if needed
    const content = req.params.content;
    const id = req.params.id;

    if (user) {
        try {
            let notificationMessage = '';
            if (content === 'description') {
                const description = req.body.description;
                const update = await Task.findOneAndUpdate(
                    { _id: id },
                    { $set: { description: description } },
                    { new: true }
                );

                if (update) {
                    await logActivity(
                        user._id,
                        'Update Task Description',
                        'Task',
                        `${user.fullname} has updated task description ${update.name} at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                    );

                    // Create notification message
                    notificationMessage = `${user.fullname} has updated the description of the task ${update.name}`;

                    // Create and send notifications to all assignees
                    const notificationPromises = update.assignee.map(async (assignee) => {
                        await createAndSendNotification(
                            user._id,
                            assignee._id, // Assuming assignee._id is the recipient user ID
                            'Task Update',
                            `/`,
                            notificationMessage
                        );

                        // Prepare email data
                        const emailData = {
                            content: notificationMessage,
                            url: 'https://www.lakmnsportal.com/'
                        };

                        // Send email notification to each assignee
                        await sendEmailNotification(assignee.email, emailData); // Assuming assignee.email is the recipient email
                    });

                    // Wait for all notifications and emails to be sent
                    await Promise.all(notificationPromises);

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
                    await logActivity(
                        user._id,
                        'Update/Add Task Subtask',
                        'Task',
                        `${user.fullname} has updated/added subtask ${update.name} at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                    );

                    // Create notification message
                    notificationMessage = `${user.fullname} has added a new subtask to the task ${update.name}`;

                    // Create and send notifications to all assignees
                    const notificationPromises = update.assignee.map(async (assignee) => {
                        await createAndSendNotification(
                            user._id,
                            assignee._id, // Assuming assignee._id is the recipient user ID
                            'Subtask Update',
                            `/`,
                            notificationMessage
                        );

                        // Prepare email data
                        const emailData = {
                            content: notificationMessage,
                            url: 'https://www.lakmnsportal.com/'
                        };

                        // Send email notification to each assignee
                        await sendEmailNotification(assignee.email, emailData); // Assuming assignee.email is the recipient email
                    });

                    // Wait for all notifications and emails to be sent
                    await Promise.all(notificationPromises);

                    console.log('Subtask added');
                    res.redirect('/');
                } else {
                    console.log('Subtask failed to be added.');
                    res.redirect('/');
                }
            } else if (content === 'task') {
                const subtask = req.body.subtaskCheckbox;
                const status = req.body.status;
                const due = req.body.due;
                const reminder = req.body.reminder;
                const updateFields = {};

                if (due) updateFields.due = moment(due).utcOffset(8).toDate();
                if (reminder) updateFields.reminder = moment(reminder).utcOffset(8).toDate();
                if (status !== undefined && status !== null && status !== '') updateFields.status = status;

                if (subtask && subtask.length > 0) {
                    await Task.findByIdAndUpdate(
                        { _id: id },
                        { $pull: { subtask: { _id: { $in: subtask } } } },
                        { new: true }
                    );
                    console.log('Selected subtasks have been deleted.');
                }

                const update = await Task.findByIdAndUpdate(
                    { _id: id },
                    { $set: updateFields },
                    { new: true }
                );

                if (update) {
                    await logActivity(
                        user._id,
                        'Update Task Content',
                        'Task',
                        `${user.fullname} has updated task content ${update.name} at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                    );

                    // Create notification message
                    notificationMessage = `${user.fullname} has updated the task ${update.name}`;

                    // Create and send notifications to all assignees
                    const notificationPromises = update.assignee.map(async (assignee) => {
                        await createAndSendNotification(
                            user._id,
                            assignee._id, // Assuming assignee._id is the recipient user ID
                            'Task Update',
                            `/`,
                            notificationMessage
                        );

                        // Prepare email data
                        const emailData = {
                            content: notificationMessage,
                            url: 'https://www.lakmnsportal.com/'
                        };

                        // Send email notification to each assignee
                        await sendEmailNotification(assignee.email, emailData); // Assuming assignee.email is the recipient email
                    });

                    // Wait for all notifications and emails to be sent
                    await Promise.all(notificationPromises);

                    console.log('Update task success');
                    res.redirect('/');
                } else {
                    console.log('There must be something wrong in the update');
                    res.redirect('/');
                }
            } else if (content === 'file') {
                if (!req.files || Object.keys(req.files).length === 0) {
                    console.log('No files selected');
                } else {
                    console.log('Files being uploaded');
                    const uuid = req.body.uuid;
                    const origin = req.body.origin;

                    for (const file of Object.values(req.files)) {
                        const uploadPath = __dirname + '/public/uploads/' + file.name;
                        const pathUpload = '/uploads/' + file.name;
                        const today = moment().utcOffset(8).startOf('day').toDate();
                        const type = path.extname(file.name);

                        await file.mv(uploadPath);
                        const fileSizeInBytes = (await fs.stat(uploadPath)).size;
                        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

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

                        await newFile.save();
                    }

                    await logActivity(
                        user._id,
                        'Upload File for Task',
                        'Task',
                        `${user.fullname} has uploaded a file at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                    );

                    // Create notification message
                    notificationMessage = `${user.fullname} has uploaded a file for the task.`;

                    // Create and send notifications to all assignees
                    const notificationPromises = update.assignee.map(async (assignee) => {
                        await createAndSendNotification(
                            user._id,
                            assignee._id, // Assuming assignee._id is the recipient user ID
                            'File Upload',
                            `/`,
                            notificationMessage
                        );

                        // Prepare email data
                        const emailData = {
                            content: notificationMessage,
                            url: 'https://www.lakmnsportal.com/'
                        };

                        // Send email notification to each assignee
                        await sendEmailNotification(assignee.email, emailData); // Assuming assignee.email is the recipient email
                    });

                    // Wait for all notifications and emails to be sent
                    await Promise.all(notificationPromises);

                    console.log('Files uploaded successfully');
                }
            }
        } catch (error) {
            console.error('Error in update route:', error);
            next(error); // Pass the error to the global error handler
        }
    } else {
        res.redirect('/landing');
    }
});

// Task route - delete
app.get('/delete/:content/:id', isAuthenticated, async (req, res, next) => {
    const user = req.user; // Directly use the authenticated user from the middleware
    const content = req.params.content;
    const id = req.params.id;

    if (user) {
        try {
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

                        // Create notification message
                        const notificationMessage = `${user.fullname} has deleted the task ${deletedTask.name}`;

                        // Create and send notifications and emails to all assignees
                        const notificationPromises = deletedTask.assignee.map(async (assignee) => {
                            await createAndSendNotification(
                                user._id,
                                assignee._id, // Assuming assignee._id is the recipient user ID
                                'Task Deletion',
                                `/`,
                                notificationMessage
                            );

                            // Prepare email data
                            const emailData = {
                                content: notificationMessage,
                                url: 'https://www.lakmnsportal.com/'
                            };

                            // Send email notification to each assignee
                            await sendEmailNotification(assignee.email, emailData); // Assuming assignee.email is the recipient email
                        });

                        // Wait for all notifications and emails to be sent
                        await Promise.all(notificationPromises);

                        await logActivity(
                            user._id,
                            'Delete Task',
                            'Task',
                            `${user.fullname} has deleted task ${deletedTask.name} at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                        );

                        console.log('Task and related files deleted');
                        res.redirect('/');
                    } else {
                        await logActivity(
                            user._id,
                            'Delete Task',
                            'Task',
                            `${user.fullname} has deleted task ${deletedTask.name} at ${getDateFormat2(moment().utcOffset(8).toDate())}`
                        );

                        console.log('Task deleted');
                        res.redirect('/');
                    }
                } else {
                    console.log('Task not found for deletion');
                    res.redirect('/');
                }
            }
        } catch (error) {
            console.error('Error in delete route:', error);
            next(error); // Pass the error to the global error handler
        }
    } else {
        res.redirect('/landing');
    }
});

// ============================
// Leave
// ============================

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

            try {
                res.render('leave-request', {
                    user: user,
                    uuid: uuidv4(),
                    notifications: notifications,
                    leave: currentLeave,
                    userLeave: userLeave,
                    selectedNames: '',
                    selectedSupervisors: '',
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
            } catch (renderError) {
                console.error('Rendering Error:', renderError);
                next(renderError);
            }
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
            const selectedSupervisors = req.body.selectedSupervisors
                ? req.body.selectedSupervisors.split(',')
                : [];

            // init to submit the leave req
            var leaveBalance = '';
            var approvals = '';
            var sendNoti = [];
            var sendEmail = [];
            var headOfDepartment = '';
            var headOfSection = '';

            if (user.username === 'P549' || user.username === 'P548') {
                headOfSection = await User.findOne({
                    isHeadOfSection: true,
                    section: 'Administration and Communication Division'
                });
                headOfDepartment = await User.findOne({
                    isHeadOfDepartment: true,
                    department: 'Management and Services Department'
                });
            } else {
                headOfSection = await User.findOne({
                    isHeadOfSection: true,
                    section: user.section
                });
                headOfDepartment = await User.findOne({
                    isHeadOfDepartment: true,
                    department: user.department
                });
            }

            const chiefExec = await User.findOne({ isChiefExec: true });
            const depChiefExec = await User.findOne({ isDeputyChiefExec: true });

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
            const supervisors = await User.find({ fullname: { $in: selectedSupervisors } });

            // leave for the user
            const leave = await Leave.find({ user: user._id });

            const newDate = {
                start: moment(startDate).utcOffset(8).toDate(),
                return: moment(returnDate).utcOffset(8).toDate()
            };

            const today = moment().utcOffset(8).startOf('day').toDate();

            // Calculate the difference in hours between the two dates
            var numberOfDays = '';
            var leaveBalance = '';
            var leaveTaken = '';
            var approvals = [];

            if (type === 'Annual Leave') {
                if (user.isNonOfficeHour) {
                    numberOfDays = moment(returnDate).diff(moment(startDate), 'days') + 1;
                } else {
                    numberOfDays = calculateBusinessDays(startDate, returnDate);
                }
            } else if (type === 'Half Day Leave') {
                if (user.isNonOfficeHour) {
                    numberOfDays = (moment(returnDate).diff(moment(startDate), 'days') + 1) / 2;
                } else {
                    numberOfDays = calculateBusinessDays(startDate, returnDate) / 2;
                }
            } else if (type === 'Emergency Leave') {
                numberOfDays = moment(returnDate).diff(moment(startDate), 'days') + 1
            } else if (
                type === 'Marriage Leave' ||
                type === 'Paternity Leave' ||
                type === 'Maternity Leave' ||
                type === 'Attend Exam Leave' ||
                type === 'Hajj Leave' ||
                type === 'Unpaid Leave' ||
                type === 'Special Leave' ||
                type === 'Extended Sick Leave' ||
                type === 'Sick Leave' ||
                type === 'Umrah Leave'
            ) {
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
                            supervisors,
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
                            supervisors,
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
                                supervisors,
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
                                supervisors,
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
                            supervisors,
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
                                supervisors,
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
                                supervisors,
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
                    if (findFile.length > 0) {
                        approvals = generateApprovals(
                            user,
                            headOfSection,
                            headOfDepartment,
                            depChiefExec,
                            chiefExec,
                            adminHR,
                            assignee,
                            supervisors,
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
                                supervisors,
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
                                supervisors,
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
            } else if (type === 'Umrah Leave') {
                leaveBalance = userLeave.umrah.leave;
                leaveTaken = userLeave.umrah.taken;
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
                                supervisors,
                                type
                            );
                        } else {
                            console.log('There is no file attached for umrah leave!');

                            renderDataError.show = 'show';
                            renderDataError.alert =
                                'There is no file attached for umrah leave!';
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
                        'Insufficient umrah balance for the requested duration'
                    );

                    renderDataError.show = 'show';
                    renderDataError.alert =
                        'Insufficient umrah leave balance for the requested duration with maximum taken up to 1 only';
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
                                supervisors,
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
                    supervisors,
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
                    try {
                        res.render('leave-request', {
                            user: user,
                            uuid: uuid,
                            notifications: notifications,
                            leave: leave,
                            userLeave: userLeave,
                            selectedNames: '',
                            selectedSupervisors: '',
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
                    } catch (renderError) {
                        console.error('Rendering Error:', renderError);
                        next(renderError);
                    }
                } else {
                    try {
                        res.render('leave-request', {
                            user: user,
                            uuid: uuid,
                            notifications: notifications,
                            leave: leave,
                            userLeave: userLeave,
                            selectedNames: '',
                            selectedSupervisors: '',
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
                    } catch (renderError) {
                        console.error('Rendering Error:', renderError);
                        next(renderError);
                    }
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

                const nextRecipient = approvals[1].recipient;
                sendNoti.push(nextRecipient);
                console.log(sendNoti);

                let i = 0;
                // set user id to be send
                for (const approval of approvals) {
                    const recipientId = approval.recipient;

                    // Fetch the user by recipient ID
                    const email = await User.findById(recipientId);

                    // Check if the user is found and has an email
                    if (email && user.email) {
                        // Add the user's email to sendEmail
                        sendEmail.push(email.email);
                    }

                    i++;
                }

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

                        // Fetch subscriptions for the recipient user
                        const subscriptions = await Subscriptions.find({ user: recipientId });

                        if (subscriptions) {
                            // Map through the subscriptions to send notifications
                            const sendNotificationPromises = subscriptions.map(async (subscription) => {
                                const payload = JSON.stringify({
                                    "title": "Leave request",
                                    "body": "Leave request need your attention and approval.",
                                    "url": "https://www.lakmnsportal.com/",
                                    "vibrate": [100, 50, 100],
                                    "requireInteraction": true,
                                    "silent": false
                                });

                                const options = {
                                    vapidDetails: {
                                        subject: 'mailto:protech@lakmns.org', // Replace with your email
                                        publicKey: publicVapidKey, // Use actual public VAPID key here
                                        privateKey: privateVapidKey // Use actual private VAPID key here
                                    },
                                    TTL: 60 // Time to live for the notification (in seconds)
                                };

                                try {
                                    await webPush.sendNotification(subscription, payload, options);
                                    console.log('Push notification sent successfully to:', subscription.endpoint);
                                } catch (error) {
                                    console.error('Error sending notification to:', subscription.endpoint, error);
                                }
                            });

                            // Wait for all notifications to be sent
                            await Promise.all(sendNotificationPromises);
                        } else {
                            console.log('The user doesnt subscribe for push notifications');
                        }

                    }

                    console.log('Done send notifications!');
                }

                // send via email
                const emailData = {
                    content: 'The leave request has been submitted by ' + user.fullname + ' with work ID ' + user.username + ' , please click the button above to open the leave details.',
                    id: currentLeave._id,
                };

                const emailHTML = await new Promise((resolve, reject) => {
                    app.render('email-leave', { emailData: emailData }, (err, html) => {
                        if (err) reject(err);
                        else resolve(html);
                    });
                });

                console.log(emailHTML);

                let mailOptions = {
                    from: 'protech@lakmns.org',
                    to: sendEmail,
                    subject: 'lakmnsportal - Leave Request Approval',
                    html: emailHTML,
                };

                const sendEmailTo = transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    }

                    console.log('Message %s sent: %s', info.messageId, info.response);
                });

                if (sendEmailTo) {
                    console.log('Email sent successfully to:', sendEmail);
                } else {
                    console.log('Email sending failed');
                }

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

                try {
                    res.render('home', renderDataSuccess);
                } catch (renderError) {
                    console.error('Rendering Error:', renderError);
                    next(renderError);
                }
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
            'timestamp': -1
        });
        const userLeave = await UserLeave.findOne({ user: user._id })
            .populate('user')
            .exec();
        try {
            res.render('leave-history', {
                user: user,
                notifications: notifications,
                leave: leave,
                userLeave: userLeave
            });
        } catch (renderError) {
            console.error('Rendering Error:', renderError);
            next(renderError);
        }
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
        try {
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
        } catch (renderError) {
            console.error('Rendering Error:', renderError);
            next(renderError);
        }
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

        const recipientIndices = checkLeave.approvals
            .map((approval, index) => approval.recipient.equals(user._id) ? index : -1)
            .filter(index => index !== -1);

        console.log(checkLeave.approvals[humanResourceIndex].recipient);

        const userOnLeave = await User.findOne({ _id: checkLeave.approvals[0].recipient });

        if (approval === 'approved') {
            let indexOfRecipient = recipientIndices[0]; // Default to the first found recipient

            // If there are multiple recipients, choose the one with a null timestamp
            if (recipientIndices.length > 1) {
                indexOfRecipient = recipientIndices.find(index => checkLeave.approvals[index].timestamp === null);
            }

            const isReliefStaff = checkLeave.approvals[indexOfRecipient].role === 'Relief Staff';
            const isSupervisor = checkLeave.approvals[indexOfRecipient].role === 'Supervisor';


            await Leave.findOneAndUpdate(
                {
                    _id: id,
                    'approvals.recipient': user._id,
                    'approvals.timestamp': null // Ensure to update the correct approval with null timestamp
                },
                {
                    $set: {
                        'approvals.$.status': 'approved',
                        'approvals.$.comment': 'The request has been approved' + (isReliefStaff ? ' by ' + user.fullname : ''),
                        'approvals.$.comment': 'The request has been approved' + (isSupervisor ? ' by ' + user.fullname : ''),
                        'approvals.$.timestamp': moment().utcOffset(8).toDate(),
                        status: 'pending'
                    }
                },
                { new: true }
            );

            // Determine the next approval recipient for notification
            const nextIndex = indexOfRecipient + 1;
            const nextApprovalRecipientId = checkLeave.approvals[nextIndex]?.recipient;

            if (nextApprovalRecipientId) {
                // send notification
                const newNotification = new Notification({
                    sender: user._id,
                    recipient: new mongoose.Types.ObjectId(nextApprovalRecipientId),
                    type: 'Leave',
                    url: '/leave/details/' + id,
                    message:
                        'Previous approval has been submitted, please check the leave request for approval'
                });

                await newNotification.save();

                // Fetch subscriptions for the recipient user
                const subscriptions = await Subscriptions.find({ user: nextApprovalRecipientId });

                if (subscriptions) {
                    // Map through the subscriptions to send notifications
                    const sendNotificationPromises = subscriptions.map(async (subscription) => {
                        const payload = JSON.stringify({
                            "title": "Leave request",
                            "body": "Leave request need your attention and approval.",
                            "url": "https://www.lakmnsportal.com/",
                            "vibrate": [100, 50, 100],
                            "requireInteraction": true,
                            "silent": false
                        });

                        const options = {
                            vapidDetails: {
                                subject: 'mailto:protech@lakmns.org', // Replace with your email
                                publicKey: publicVapidKey, // Use actual public VAPID key here
                                privateKey: privateVapidKey // Use actual private VAPID key here
                            },
                            TTL: 60 // Time to live for the notification (in seconds)
                        };

                        try {
                            await webPush.sendNotification(subscription, payload, options);
                            console.log('Push notification sent successfully to:', subscription.endpoint);
                        } catch (error) {
                            console.error('Error sending notification to:', subscription.endpoint, error);
                        }
                    });

                    // Wait for all notifications to be sent
                    await Promise.all(sendNotificationPromises);
                } else {
                    console.log('The user doesnt subscribe for push notifications');
                }

                // log activity
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Leave application approved',
                    type: 'Leave request',
                    description: 'Approved a leave request'
                });

                await activityUser.save();

                // Fetch next approval recipient's email
                const nextApprovalRecipientEmail = await User.findOne({ _id: nextApprovalRecipientId });

                // send via email
                const emailData = {
                    content: 'The leave request has been approved by ' + user.fullname + ' with work ID ' + user.username + ' , please click the button above to open the leave details.',
                    id: checkLeave._id,
                };

                const emailHTML = await new Promise((resolve, reject) => {
                    app.render('email-leave', { emailData: emailData }, (err, html) => {
                        if (err) reject(err);
                        else resolve(html);
                    });
                });

                console.log(emailHTML);

                let mailOptions = {
                    from: 'protech@lakmns.org',
                    to: nextApprovalRecipientEmail.email,
                    subject: 'lakmnsportal - Leave Request Approval',
                    html: emailHTML,
                };

                const sendEmailTo = transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    }

                    console.log('Message %s sent: %s', info.messageId, info.response);
                });

                if (sendEmailTo) {
                    console.log('Email sent successfully to:', sendEmail);
                } else {
                    console.log('Email sending failed');
                }

                console.log('The leave has been approved and notification sent to the next recipient.');
            } else {
                console.log('The leave has been approved.');
            }

            res.redirect('/leave/details/' + id);
        } else if (approval === 'denied') {
            let indexOfRecipient = recipientIndices[0]; // Default to the first found recipient

            // If there are multiple recipients, choose the one with a null timestamp
            if (recipientIndices.length > 1) {
                indexOfRecipient = recipientIndices.find(index => checkLeave.approvals[index].timestamp === null);
            }

            let leaveDenied;
            if (checkLeave.approvals[indexOfRecipient].role === 'Relief Staff') {
                leaveDenied = await Leave.findOneAndUpdate(
                    {
                        _id: id,
                        'approvals.recipient': user._id,
                        'approvals.timestamp': null // Ensure to update the correct approval with null timestamp
                    },
                    {
                        $set: {
                            status: 'denied',
                            'approvals.$.status': 'denied',
                            'approvals.$.comment': 'The request has been denied by ' + user.fullname,
                            'approvals.$.timestamp': moment().utcOffset(8).toDate()
                        }
                    },
                    { new: true }
                );
            } else {
                leaveDenied = await Leave.findOneAndUpdate(
                    {
                        _id: id,
                        'approvals.recipient': user._id,
                        'approvals.timestamp': null // Ensure to update the correct approval with null timestamp
                    },
                    {
                        $set: {
                            status: 'denied',
                            'approvals.$.status': 'denied',
                            'approvals.$.comment': 'The request has been denied',
                            'approvals.$.timestamp': moment().utcOffset(8).toDate()
                        }
                    },
                    { new: true }
                );
            }

            if (leaveDenied) {
                const firstRecipientId =
                    indexOfRecipient !== -1
                        ? checkLeave.approvals[indexOfRecipient].recipient
                        : null;

                const userLeave = await UserLeave.findOne({
                    user: firstRecipientId
                });

                let daysDifference = '';
                if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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

                const recipientIds = checkLeave.approvals.map(approval => approval.recipient);

                const sendNoti = recipientIds.filter(recipientId => !recipientId.equals(user._id));

                // Sending notifications
                if (sendNoti.length > 0) {
                    for (const recipientId of sendNoti) {
                        const newNotification = new Notification({
                            sender: user._id,
                            recipient: new mongoose.Types.ObjectId(recipientId),
                            type: 'Leave',
                            url: '/leave/details/' + id,
                            message: 'Leave request has been denied.'
                        });

                        await newNotification.save();

                        // Fetch subscriptions for the recipient user
                        const subscriptions = await Subscriptions.find({ user: recipientId });

                        if (subscriptions) {
                            // Map through the subscriptions to send notifications
                            const sendNotificationPromises = subscriptions.map(async (subscription) => {
                                const payload = JSON.stringify({
                                    "title": "Leave request",
                                    "body": "Leave request has been denied.",
                                    "url": "https://www.lakmnsportal.com/",
                                    "vibrate": [100, 50, 100],
                                    "requireInteraction": true,
                                    "silent": false
                                });

                                const options = {
                                    vapidDetails: {
                                        subject: 'mailto:protech@lakmns.org', // Replace with your email
                                        publicKey: publicVapidKey, // Use actual public VAPID key here
                                        privateKey: privateVapidKey // Use actual private VAPID key here
                                    },
                                    TTL: 60 // Time to live for the notification (in seconds)
                                };

                                try {
                                    await webPush.sendNotification(subscription, payload, options);
                                    console.log('Push notification sent successfully to:', subscription.endpoint);
                                } catch (error) {
                                    console.error('Error sending notification to:', subscription.endpoint, error);
                                }
                            });

                            // Wait for all notifications to be sent
                            await Promise.all(sendNotificationPromises);
                        } else {
                            console.log('The user doesnt subscribe for push notifications');
                        }

                    }

                    console.log('Done sending notifications!');
                }

                // Activity log
                const activityUser = new Activity({
                    user: user._id,
                    date: moment().utcOffset(8).toDate(),
                    title: 'Leave application denied',
                    type: 'Leave request',
                    description: 'Denied a leave request'
                });

                await activityUser.save();

                const users = await User.find({ _id: { $in: sendNoti } });
                const sendEmail = users.map(user => user.email);
                console.log(sendEmail);

                // send via email
                const emailData = {
                    content: 'The leave request has been denied by ' + user.fullname + ' with work ID ' + user.username + ' , please click the button above to open the leave details.',
                    id: checkLeave._id,
                };

                const emailHTML = await new Promise((resolve, reject) => {
                    app.render('email-leave', { emailData: emailData }, (err, html) => {
                        if (err) reject(err);
                        else resolve(html);
                    });
                });

                console.log(emailHTML);

                let mailOptions = {
                    from: 'protech@lakmns.org',
                    to: sendEmail,
                    subject: 'lakmnsportal - Leave Request Approval',
                    html: emailHTML,
                };

                const sendEmailTo = transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    }

                    console.log('Message %s sent: %s', info.messageId, info.response);
                });

                if (sendEmailTo) {
                    console.log('Email sent successfully to:', sendEmail);
                } else {
                    console.log('Email sending failed');
                }

                console.log('The leave has been denied.');
                res.redirect('/leave/details/' + id);
            }
        } else if (approval === 'cancelled') {
            const firstRecipientId = checkLeave.approvals[0].recipient;
            const lastRecipientId =
                checkLeave.approvals[checkLeave.approvals.length - 1].recipient;

            if (checkLeave.status === 'approved') {

                const userLeave = await UserLeave.findOne({
                    user: firstRecipientId
                });

                const startDate = checkLeave.date.start;
                const returnDate = checkLeave.date.return;

                var daysDifference = '';

                // Calculate the difference in hours between the two dates
                if (
                    checkLeave.type === 'Annual Leave'
                ) {
                    if (userOnLeave.isNonOfficeHour) {
                        daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
                    } else {
                        daysDifference = calculateBusinessDays(startDate, returnDate);
                    }
                } else if (checkLeave.type === 'Half Day Leave') {
                    if (userOnLeave.isNonOfficeHour) {
                        daysDifference = (moment(returnDate).diff(moment(startDate), 'days') + 1) / 2;
                    } else {
                        daysDifference = calculateBusinessDays(startDate, returnDate) / 2;
                    }
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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
                            checkLeave.approvals[indexOfRecipient].role + ' ' + user.username
                    }
                },
                { new: true }
            );

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

            // Fetch subscriptions for the recipient user
            const subscriptions = await Subscriptions.find({ user: firstRecipientId });

            if (subscriptions) {
                // Map through the subscriptions to send notifications
                const sendNotificationPromises = subscriptions.map(async (subscription) => {
                    const payload = JSON.stringify({
                        "title": "Leave request",
                        "body": "Leave request has been denied.",
                        "url": "https://www.lakmnsportal.com/",
                        "vibrate": [100, 50, 100],
                        "requireInteraction": true,
                        "silent": false
                    });

                    const options = {
                        vapidDetails: {
                            subject: 'mailto:protech@lakmns.org', // Replace with your email
                            publicKey: publicVapidKey, // Use actual public VAPID key here
                            privateKey: privateVapidKey // Use actual private VAPID key here
                        },
                        TTL: 60 // Time to live for the notification (in seconds)
                    };

                    try {
                        await webPush.sendNotification(subscription, payload, options);
                        console.log('Push notification sent successfully to:', subscription.endpoint);
                    } catch (error) {
                        console.error('Error sending notification to:', subscription.endpoint, error);
                    }
                });

                // Wait for all notifications to be sent
                await Promise.all(sendNotificationPromises);
            } else {
                console.log('The user doesnt subscribe for push notifications');
            }

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

            // send via email
            const emailData = {
                content: 'The leave request has been cancelled by ' + user.fullname + ' with work ID ' + user.username + ' , please click the button above to open the leave details.',
                id: checkLeave._id,
            };

            const emailHTML = await new Promise((resolve, reject) => {
                app.render('email-leave', { emailData: emailData }, (err, html) => {
                    if (err) reject(err);
                    else resolve(html);
                });
            });

            console.log(emailHTML);

            let mailOptions = {
                from: 'protech@lakmns.org',
                to: firstRecipientEmail.email,
                subject: 'lakmnsportal - Leave Request Approval',
                html: emailHTML,
            };

            const sendEmailTo = transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                }

                console.log('Message %s sent: %s', info.messageId, info.response);
            });

            if (sendEmailTo) {
                console.log('Email sent successfully to:', sendEmail);
            } else {
                console.log('Email sending failed');
            }

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
                    if (checkUser.isNonOfficeHour) {
                        daysDifference = (moment(returnDate).diff(moment(startDate), 'days') + 1) / 2;
                    } else {
                        daysDifference = (calculateBusinessDays(startDate, returnDate)) / 2;
                    }
                } else if (checkLeave.type === 'Emergency Leave') {
                    daysDifference = moment(returnDate).diff(moment(startDate), 'days') + 1;
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

                // send noti
                const newNotification = new Notification({
                    sender: user._id,
                    recipient: new mongoose.Types.ObjectId(firstRecipientId),
                    type: 'Leave',
                    url: '/leave/details/' + id,
                    message: 'Your leave request have been approved'
                });

                newNotification.save();

                // Fetch subscriptions for the recipient user
                const subscriptions = await Subscriptions.find({ user: firstRecipientId });

                if (subscriptions) {
                    // Map through the subscriptions to send notifications
                    const sendNotificationPromises = subscriptions.map(async (subscription) => {
                        const payload = JSON.stringify({
                            "title": "Leave request",
                            "body": "Leave request has been approved",
                            "url": "https://www.lakmnsportal.com/",
                            "vibrate": [100, 50, 100],
                            "requireInteraction": true,
                            "silent": false
                        });

                        const options = {
                            vapidDetails: {
                                subject: 'mailto:protech@lakmns.org', // Replace with your email
                                publicKey: publicVapidKey, // Use actual public VAPID key here
                                privateKey: privateVapidKey // Use actual private VAPID key here
                            },
                            TTL: 60 // Time to live for the notification (in seconds)
                        };

                        try {
                            await webPush.sendNotification(subscription, payload, options);
                            console.log('Push notification sent successfully to:', subscription.endpoint);
                        } catch (error) {
                            console.error('Error sending notification to:', subscription.endpoint, error);
                        }
                    });

                    // Wait for all notifications to be sent
                    await Promise.all(sendNotificationPromises);
                } else {
                    console.log('The user doesnt subscribe for push notifications');
                }

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

                // send via email
                const emailData = {
                    content: 'The leave request has been approved by the Human Resource, please click the button above to open the leave details.',
                    id: checkLeave._id,
                };

                const emailHTML = await new Promise((resolve, reject) => {
                    app.render('email-leave', { emailData: emailData }, (err, html) => {
                        if (err) reject(err);
                        else resolve(html);
                    });
                });

                console.log(emailHTML);

                let mailOptions = {
                    from: 'protech@lakmns.org',
                    to: firstRecipientEmail.email,
                    subject: 'lakmnsportal - Leave Request Approval',
                    html: emailHTML,
                };

                const sendEmailTo = transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    }

                    console.log('Message %s sent: %s', info.messageId, info.response);
                });

                if (sendEmailTo) {
                    console.log('Email sent successfully to:', sendEmail);
                } else {
                    console.log('Email sending failed');
                }

                console.log('The leave has been officially approved');
            } else {
                console.log('The user is not an admin');
            }

            res.redirect('/leave/details/' + id);
        }
    }
});

// ============================
// Attendance
// ============================

// Main attendance route
app.get('/attendance', async function (req, res, next) {
    const uniqueIdentifier = generateUniqueIdentifier();
    try {
        res.render('attendance', {
            uuid: uuidv4(),
            uniqueIdentifier: uniqueIdentifier
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass error to global error handler
    }
});

// Scan QR route
app.get('/scan-qr', isAuthenticated, async function (req, res, next) {
    try {
        res.render('scan', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4()
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass error to global error handler
    }
});

// Attendance records route - HOD only
app.get('/attendance/today/department/section', isAuthenticated, async function (req, res, next) {
    try {
        res.render('attendance-records', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4()
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError); // Pass error to global error handler
    }
});

// Update attendance remarks
app.post('/attendance/update/remarks/:id', isAuthenticated, async function (req, res, next) {
    const id = req.params.id;
    const remarks = req.body.remarks;
    const userId = req.user._id;

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { _id: id },
            { $set: { remarks: remarks } },
            { upsert: true }
        );

        if (attendance) {
            console.log('Update remark success:', remarks);

            // Log activity
            await logActivity(userId, 'Attendance Updated', 'Update', `Remarks updated to: ${remarks}`);

            // Create and send notification
            const user = await User.findById(userId);
            const message = 'Your attendance record has been updated.';
            await createAndSendNotification(userId, user._id, 'Attendance Updated', `/profile`, message);

            // Prepare email data
            const emailData = {
                content: message,
                url: 'https://www.lakmnsportal.com/profile'
            };
            await sendEmailNotification(user.email, emailData);

            res.redirect('/profile');
        } else {
            throw new Error('Attendance record not found');
        }
    } catch (error) {
        console.error('Error updating remarks:', error);
        next(error); // Pass error to global error handler
    }
});

// Acknowledge attendance
app.get('/attendance/acknowledged/:id', isAuthenticated, async function (req, res, next) {
    const id = req.params.id;
    const userId = req.user._id;

    try {
        const findAttendance = await Attendance.findOne({ _id: id });
        if (!findAttendance) {
            throw new Error('Attendance record not found');
        }

        const updatedAttendance = await Attendance.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    status: 'Present',
                    type: 'manual add',
                    remarks: `${findAttendance.remarks} - Acknowledged by ${req.user.position}`
                }
            },
            { new: true, upsert: true }
        );

        if (updatedAttendance) {
            console.log('Update attendance status success:', updatedAttendance.remarks);

            // Log activity
            await logActivity(userId, 'Attendance Acknowledged', 'Acknowledgment', `Attendance acknowledged by ${req.user.position}`);

            // Create and send notification
            const user = await User.findById(userId);
            const message = 'Your attendance record has been acknowledged.';
            await createAndSendNotification(userId, user._id, 'Attendance Acknowledged', `/`, message);

            // Send email notification
            const emailData = {
                content: message,
                url: 'https://www.lakmnsportal.com/profile'
            };
            await sendEmailNotification(user.email, emailData);

            res.redirect('/');
        } else {
            throw new Error('Failed to update attendance status');
        }
    } catch (error) {
        console.error('Error during attendance update:', error);
        next(error); // Pass error to global error handler
    }
});

// ============================
// Human Resource Management
// ============================

// Staff members route - overview
app.get('/human-resource/staff-members/overview', isAuthenticated, async function (req, res, next) {
    const { user, notifications } = req;

    try {
        const allUser = await User.find();
        const uniqueDepartments = new Set();
        const uniqueSections = new Set();

        allUser.forEach(user => {
            if (user.department) {
                uniqueDepartments.add(user.department);
            }
            if (user.section) {
                uniqueSections.add(user.section);
            }
        });

        const departments = Array.from(uniqueDepartments);
        const sections = Array.from(uniqueSections);

        res.render('hr-staffmembers-overview', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            departments: departments,
            sections: sections,
            allUser: allUser,
            show: '',
            alert: ''
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Staff members route - update
app.get('/human-resource/staff-members/overview/update/:id', isAuthenticated, async function (req, res, next) {
    const { user, notifications } = req;
    const userId = req.params.id;

    try {
        const otherUser = await User.findOne({ _id: userId });

        res.render('hr-staffmembers-overview-update', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            otherUser: otherUser
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/human-resource/staff-members/overview/update/:id', isAuthenticated, async function (req, res) {
    const userId = req.params.id;
    const {
        fullname, classification, grade, position, department, section, dateEmployed, gender,
        isOfficer, isAdmin, isHeadOfDepartment, isHeadOfSection, isManagement, isPersonalAssistant, isDriver, isTeaLady, isNonOfficeHour
    } = req.body;

    const updatedFields = { fullname, classification, grade, position, department, section, dateEmployed, gender };

    const filterEmptyFields = (fields) => {
        const filteredFields = {};
        for (const key in fields) {
            if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
                filteredFields[key] = fields[key];
            }
        }
        return filteredFields;
    };

    const nonEmptyUpdatedFields = filterEmptyFields(updatedFields);

    const isFieldTrue = (field) => field && field !== 'no' && field !== 'Select an option';

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

    const headOfDepartment = await User.findOne({ section: 'Human Resource Management Division', isHeadOfSection: true });

    if (updatedUser) {
        await logActivity(req.user._id, 'Update Staff Data', 'Admin',
            `${req.user.fullname} has updated staff ${updatedUser.username} at ${getDateFormat2(moment().utcOffset(8).toDate())}`);

        await createAndSendNotification(req.user._id, headOfDepartment._id, 'Staff Updated', `/human-resource/staff-members/overview/update/${userId}`,
            `${req.user.fullname} has updated staff ${updatedUser.username}`);

        const message = `${updatedUser.fullname}, your staff (${req.user.fullname}) data has been updated  at ${getDateFormat2(moment().utcOffset(8).toDate())}.`

        // Prepare email data
        const emailData = {
            content: message,
            url: `https://www.lakmnsportal.com/human-resource/staff-members/overview/update/${userId}`
        };

        await sendEmailNotification(headOfDepartment.email, emailData);
    } else {
        console.log('Failed to update');
    }

    res.redirect('/human-resource/staff-members/overview/update/' + userId);
});

// Staff members route - add employees 
app.get('/human-resource/staff-members/add-staff', isAuthenticated, async function (req, res, next) {
    const { user, notifications } = req;
    try {
        res.render('hr-staffmembers-add-staff', {
            user: user,
            notifications: notifications,
            uuid: uuidv4()
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/human-resource/staff-members/add-staff', isAuthenticated, async function (req, res) {
    const { user, notifications } = req;

    // For successful rendering
    const allUser = await User.find();
    const uniqueDepartments = new Set();
    const uniqueSection = new Set();

    allUser.forEach(user => {
        if (user.department) uniqueDepartments.add(user.department);
        if (user.section) uniqueSection.add(user.section);
    });

    const departments = Array.from(uniqueDepartments);
    const sections = Array.from(uniqueSection);

    if (!req.body.fullname ||
        !req.body.username ||
        !req.body.email ||
        !req.body.password ||
        !req.body.position ||
        !req.body.grade ||
        !req.body.department ||
        !req.body.gender) {
        return res.render('hr-staffmembers-addstaff', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            show: 'show',
            alert: 'Sign up unsuccessful'
        });
    }

    // Process boolean fields
    const isFieldTrue = field => field && field !== 'no' && field !== 'Select an option';

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
            return res.render('hr-staffmembers-addstaff', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: err
            });
        }

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

        // send notification via email and web push 
        const headOfDepartment = await User.findOne({ section: 'Human Resource Management Division', isHeadOfSection: true });

        await logActivity(user._id, 'Register new staff', 'Admin',
            `${user.fullname} has registered staff ${newUser.username} at ${getDateFormat2(moment().utcOffset(8).toDate())}`);

        await createAndSendNotification(user._id, headOfDepartment._id, 'Staff Registered', `/human-resource/staff-members/overview/`,
            `${user.fullname} has registered staff ${newUser.username}`);

        const message = `Your staff (${user.fullname}) has registered new staff, ${newUser.fullname} (${newUser.username}) at ${getDateFormat2(moment().utcOffset(8).toDate())}.`

        // Prepare email data
        const emailData = {
            content: message,
            url: `https://www.lakmnsportal.com/human-resource/staff-members/overview/`
        };

        await sendEmailNotification(headOfDepartment.email, emailData);

        passport.authenticate('local')(req, res, function () {
            res.render('hr-staffmembers-overview', {
                user: user,
                notifications: notifications,
                uuid: uuidv4(),
                departments: departments,
                sections: sections,
                allUser: allUser,
                show: 'show',
                alert: 'Register new staff successful'
            });
        });
    });
});

// Leave route - overview
app.get('/human-resource/leave/overview', isAuthenticated, async function (req, res) {
    const { user, notifications } = req;

    try {
        const allLeave = await Leave.find().sort({ timestamp: -1 });
        const allUser = await User.find();

        res.render('hr-leave-overview', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            allLeave: allLeave,
            allUser: allUser
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Leave route - balances
app.get('/human-resource/leave/balances', isAuthenticated, async function (req, res) {
    const { user, notifications } = req;

    try {
        const allUserLeave = await UserLeave.find();
        const allUser = await User.find();

        res.render('hr-leave-balances', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            allUserLeave: allUserLeave,
            allUser: allUser,
            show: '',
            alert: ''
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Leave route - balances update
app.get('/human-resource/leave/balances/update/:id', isAuthenticated, async function (req, res) {
    const { user, notifications } = req;
    const userId = req.params.id;

    try {
        const userLeave = await UserLeave.findOne({ user: userId }).populate('user').exec();

        res.render('hr-leave-balances-update', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            userLeave: userLeave
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/human-resource/leave/balances/update/:id', isAuthenticated, async function (req, res) {
    const { user, notifications } = req;
    const userId = req.params.id;
    const {
        annualtotal, annualtaken, sicktotal, sicktaken,
        sickExtendedTotal, sickExtendedTaken, emergency,
        attendexam, marriage, paternity, unpaid, special, hajj
    } = req.body;

    const allUserLeave = await UserLeave.find();
    const allUser = await User.find();
    const userLeave = await UserLeave.findOne({ user: userId }).populate('user').exec();

    const updatedFields = {};

    const addFieldIfExists = (field, value) => {
        if (value !== undefined && value !== '') {
            updatedFields[field] = parseFloat(value, 10).toFixed(1);
        }
    };

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

        const headOfDepartment = await User.findOne({ section: 'Human Resource Management Division', isHeadOfSection: true });

        if (updatedLeave) {
            const findUser = await User.findOne({ _id: userId });

            // send notification via email and web push 
            await logActivity(user._id, 'Update Leave Balance', 'Admin',
                `${user.fullname} has update leave balances ${findUser.username} at ${getDateFormat2(moment().utcOffset(8).toDate())}`);

            await createAndSendNotification(user._id, headOfDepartment._id, 'Leave Balances Updated', `/human-resource/leave/balances/update/${upddatedLeave._id}`,
                `${user.fullname} has registered staff ${findUser.username}`);

            const message = `Your staff (${user.fullname}) has registered new staff, ${findUser.fullname} (${findUser.username}) at ${getDateFormat2(moment().utcOffset(8).toDate())}.`

            // Prepare email data
            const emailData = {
                content: message,
                url: `https://www.lakmnsportal.com/human-resource/leave/balances/update/`
            };

            await sendEmailNotification(headOfDepartment.email, emailData);
        } else {
            console.log('Failed to update');
        }

        res.redirect(`/human-resource/leave/balances/update/${userId}`);
    } catch (err) {
        console.error('Error:', err);
        res.render('hr-leave-balances', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
            allUserLeave: allUserLeave,
            allUser: allUser,
            show: 'show',
            alert: `${userLeave.user.fullname} leave balances update failed!`
        });
    }
});

// Attendance route - overview
app.get('/human-resource/attendance/overview', isAuthenticated, async (req, res, next) => {
    const { user, notifications } = req;

    try {
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
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// ============================
// Auxiliary Police
// ============================

// Duty handover route - view
app.get('/auxiliary-police/duty-handover/view', isAuthenticated, async (req, res, next) => {
    try {
        const bmi = await DutyHandoverAux.find({ location: 'Baitul Makmur I' }).sort({ date: -1 });
        const bmii = await DutyHandoverAux.find({ location: 'Baitul Makmur II' }).sort({ date: -1 });
        const jm = await DutyHandoverAux.find({ location: 'Jamek Mosque' }).sort({ date: -1 });
        const cm = await DutyHandoverAux.find({ location: 'City Mosque' }).sort({ date: -1 });
        const rs = await DutyHandoverAux.find({ location: 'Raudhatul Sakinah' }).sort({ date: -1 });

        res.render('auxiliarypolice-dutyhandover-view', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            bmi: bmi,
            bmii: bmii,
            jm: jm,
            cm: cm,
            rs: rs
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Duty handover route - submission
app.get('/auxiliary-police/duty-handover/submit', isAuthenticated, async (req, res, next) => {
    try {
        res.render('auxiliarypolice-dutyhandover-submit', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            show: '',
            alert: '',
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/auxiliary-police/duty-handover/submit', isAuthenticated, async (req, res, next) => {
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

            console.log('Existing handover updated');
            res.render('auxiliarypolice-dutyhandover-submit', {
                user: req.user,
                notifications: req.notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'Existing handover updated',
            });
        } else {
            // Update duty handover based on ID and create a new one if needed
            await DutyHandoverAux.findByIdAndUpdate(dutyHandoverId, { status: 'completed' }, { new: true });

            dutyHandover = new DutyHandoverAux({
                headShift: req.user.fullname,
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
                user: req.user,
                notifications: req.notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'New duty handover and patrol report created',
            });
        }
    } catch (error) {
        console.error('Error updating duty handover:', error);
        next(error);
    }
});

// Schedule route - view
app.get('/auxiliary-police/schedule/view', isAuthenticated, async (req, res, next) => {
    try {
        res.render('auxiliarypolice-schedule-view', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Schedule route - GET add
app.get('/auxiliary-police/schedule/add', isAuthenticated, async (req, res, next) => {
    try {
        res.render('auxiliarypolice-schedule-add', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            show: '',
            alert: ''
        });
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/auxiliary-police/schedule/add', isAuthenticated, async (req, res, next) => {
    const {
        location,
        date,
        selectedNames1,
        selectedNames2,
        selectedNames3,
        selectedNames4 = '',
        time1,
        time2,
        time3,
        time4 = '',
        selectedNames5 = '',
        selectedNames6 = ''
    } = req.body;

    console.log('Received form data:', { location, date, selectedNames1, selectedNames2, selectedNames3, selectedNames4, time1, time2, time3, time4, selectedNames5, selectedNames6 });

    if (!location || !date || !selectedNames1 || !selectedNames2 || !selectedNames3 || time1 === 'Select shift time' || time2 === 'Select shift time' || time3 === 'Select shift time' || (selectedNames4 && time4 === 'Select shift time')) {
        console.log('Failed to add auxiliary police schedule');
        res.render('auxiliarypolice-schedule-add', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            show: 'show',
            alert: 'All form fields must be filled, there is an empty input'
        });
        return;
    }

    const selectedNames1Array = selectedNames1.split(',');
    const selectedNames2Array = selectedNames2.split(',');
    const selectedNames3Array = selectedNames3.split(',');
    const selectedNames4Array = selectedNames4 ? selectedNames4.split(',') : [];
    const staffRaisedFlagArray = selectedNames5 ? selectedNames5.split(',') : [];
    const staffLoweredFlagArray = selectedNames6 ? selectedNames6.split(',') : [];

    const shifts = [
        { shiftName: 'Shift A', staff: selectedNames1Array, time: time1 },
        { shiftName: 'Shift B', staff: selectedNames2Array, time: time2 },
        { shiftName: 'Shift C', staff: selectedNames3Array, time: time3 },
        ...(selectedNames4Array.length > 0 ? [{ shiftName: 'Shift D', staff: selectedNames4Array, time: time4 }] : [])
    ];

    console.log('Constructed shifts array:', shifts);

    try {
        const findSchedule = await ScheduleAux.findOne({ location: location, date: moment(date).utcOffset(8).toDate() });

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
                    user: req.user,
                    notifications: req.notifications,
                    uuid: uuidv4(),
                    show: 'show',
                    alert: 'Successfully updated auxiliary police schedule'
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
                    user: req.user,
                    notifications: req.notifications,
                    uuid: uuidv4(),
                    show: 'show',
                    alert: 'Successfully added auxiliary police schedule on ' + date
                });
            } else {
                console.log('Failed to add auxiliary police schedule on ' + date);
                res.render('auxiliarypolice-schedule-add', {
                    user: req.user,
                    notifications: req.notifications,
                    uuid: uuidv4(),
                    show: 'show',
                    alert: 'Failed to add auxiliary police schedule on ' + date
                });
            }
        }
    } catch (error) {
        console.error('Error handling schedule add:', error);
        next(error);
    }
});

// Duty handover route - search
app.get('/search-duty-handover', isAuthenticated, async (req, res, next) => {
    try {
        const { location, date, shift, time } = req.query;

        let shiftTime;
        let adjustedDate = moment(date).utcOffset(8).toDate(); // Adjust date to Kuala Lumpur time

        // Determine previous shift's time and adjust the date if necessary
        if (time === '0700') {
            shiftTime = '2300';
            adjustedDate.setDate(adjustedDate.getDate() - 1); // Subtract one day
        } else if (time === '1500') {
            shiftTime = '0700';
        } else if (time === '2300') {
            shiftTime = '1500';
        }

        // Fetch the duty handover and shift schedule details
        const [results, resultsSchedule] = await Promise.all([
            DutyHandoverAux.findOne({
                location: location,
                date: adjustedDate,
                time: shiftTime
            }),
            ScheduleAux.findOne({
                location: location,
                date: moment(date).utcOffset(8).toDate(),
                'shift.shiftName': shift
            })
        ]);

        const response = {
            dutyHandover: results,
            shiftSchedule: resultsSchedule
        };

        console.log(response.shiftSchedule);

        res.json(response);
    } catch (error) {
        console.error('Error searching duty handover:', error);
        next(error);
    }
});

// Case report route - view
app.get('/auxiliary-police/case/view', isAuthenticated, async (req, res, next) => {
    try {
        // Fetch all case reports, sorted by date in descending order.
        const caseReport = await CaseAux.find().sort({ date: -1 });

        // Render the case view page with the user data, notifications, and case reports.
        res.render('auxiliarypolice-case-view', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            caseReport: caseReport
        });
    } catch (renderError) {
        // Log and handle any rendering errors.
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Case report route - details
app.get('/auxiliary-police/case/details/:id', isAuthenticated, async (req, res, next) => {
    try {
        const id = req.params.id; // Extract case ID from the request parameters.

        // Fetch the specific case report using the provided ID.
        const caseReport = await CaseAux.findOne({ _id: id });

        // Render the case detail page with the user data, notifications, and specific case report.
        res.render('auxiliarypolice-case-detail', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            caseReport: caseReport
        });
    } catch (renderError) {
        // Log and handle any rendering errors.
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Case report route - add
app.get('/auxiliary-police/case/add', isAuthenticated, async (req, res, next) => {
    try {
        // Render the case add page with the user data and notifications.
        res.render('auxiliarypolice-case-add', {
            user: req.user,
            notifications: req.notifications,
            uuid: uuidv4(),
            show: '',
            alert: ''
        });
    } catch (renderError) {
        // Log and handle any rendering errors.
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
}).post('/auxiliary-police/schedule/add', isAuthenticated, async (req, res, next) => {
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

    // Validate required fields; if any are missing, show an alert.
    if (!location || !date || !selectedNames1 || !selectedNames2 || !selectedNames3 || time1 === 'Select shift time' || time2 === 'Select shift time' || time3 === 'Select shift time' || (selectedNames4 && time4 === 'Select shift time')) {
        console.log('Failed to add auxiliary police schedule');
        try {
            res.render('auxiliarypolice-schedule-add', {
                user: req.user,
                notifications: req.notifications,
                uuid: uuidv4(),
                show: 'show',
                alert: 'All form fields must be filled; there is an empty input.'
            });
        } catch (renderError) {
            console.error('Rendering Error:', renderError);
            next(renderError);
        }
        return;
    }

    // Ensure the selected names are split into arrays.
    const selectedNames1Array = selectedNames1 ? selectedNames1.split(',') : [];
    const selectedNames2Array = selectedNames2 ? selectedNames2.split(',') : [];
    const selectedNames3Array = selectedNames3 ? selectedNames3.split(',') : [];
    const selectedNames4Array = selectedNames4 ? selectedNames4.split(',') : [];  // Handle new shift
    const staffRaisedFlagArray = selectedNames5 ? selectedNames5.split(',') : [];  // Handle raised flag duty
    const staffLoweredFlagArray = selectedNames6 ? selectedNames6.split(',') : [];  // Handle lowered flag duty

    // Construct the shifts array.
    const shifts = [
        { shiftName: 'Shift A', staff: selectedNames1Array, time: time1 },
        { shiftName: 'Shift B', staff: selectedNames2Array, time: time2 },
        { shiftName: 'Shift C', staff: selectedNames3Array, time: time3 },
        ...(selectedNames4Array.length > 0 ? [{ shiftName: 'Shift D', staff: selectedNames4Array, time: time4 }] : [])
    ];

    console.log('Constructed shifts array:', shifts);

    try {
        // Check if a schedule already exists for the provided location and date.
        const findSchedule = await ScheduleAux.findOne({
            location: location,
            date: moment(date).utcOffset(8).toDate()
        });

        if (findSchedule) {
            // Update existing schedule if found.
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
                try {
                    res.render('auxiliarypolice-schedule-add', {
                        user: req.user,
                        notifications: req.notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully updated auxiliary police schedule.'
                    });
                } catch (renderError) {
                    console.error('Rendering Error:', renderError);
                    next(renderError);
                }
            }
        } else {
            // If no existing schedule is found, create a new schedule.
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
                try {
                    res.render('auxiliarypolice-schedule-add', {
                        user: req.user,
                        notifications: req.notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Successfully added auxiliary police schedule on ' + date
                    });
                } catch (renderError) {
                    console.error('Rendering Error:', renderError);
                    next(renderError);
                }
            } else {
                console.log('Failed to add auxiliary police schedule on ' + date);
                try {
                    res.render('auxiliarypolice-schedule-add', {
                        user: req.user,
                        notifications: req.notifications,
                        uuid: uuidv4(),
                        show: 'show',
                        alert: 'Failed to add auxiliary police schedule on ' + date
                    });
                } catch (renderError) {
                    console.error('Rendering Error:', renderError);
                    next(renderError);
                }
            }
        }
    } catch (error) {
        // Log and handle any errors during schedule processing.
        console.error('Error handling schedule add:', error);
        next(error);
    }
});

// Shift member lcoation route - view
app.get('/auxiliary-police/patrol/shift-member-location/view', isAuthenticated, async (req, res, next) => {
    try {
        const { user, notifications } = req;

        // Query all locations for shift member location
        const [bmi, bmii, jm, cm, rs] = await Promise.all([
            PatrolAux.find({ location: 'Baitul Makmur I', type: 'Shift Member Location' }).sort({ date: -1 }),
            PatrolAux.find({ location: 'Baitul Makmur II', type: 'Shift Member Location' }).sort({ date: -1 }),
            PatrolAux.find({ location: 'Jamek Mosque', type: 'Shift Member Location' }).sort({ date: -1 }),
            PatrolAux.find({ location: 'City Mosque', type: 'Shift Member Location' }).sort({ date: -1 }),
            PatrolAux.find({ location: 'Raudhatul Sakinah', type: 'Shift Member Location' }).sort({ date: -1 })
        ]);

        res.render('auxiliarypolice-patrol-shiftmemberlocation-view', {
            user,
            notifications,
            uuid: uuidv4(),
            bmi,
            bmii,
            jm,
            cm,
            rs
        });
    } catch (error) {
        console.error('Error fetching shift member location data:', error);
        next(error);
    }
});

// Shift member location route - details
app.get('/auxiliary-police/patrol/shift-member-location/details/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { user, notifications } = req;
        const id = req.params.id;

        // Find the report and its shift member cycles
        const checkReport = await PatrolAux.findOne({ _id: id });
        const shiftMemberCycles = checkReport.shiftMember.cycle;

        // Calculate the current time and determine the current time slot
        const currentTime = moment.utc().add(8, 'hours').format('HH:mm:ss');
        const currentTimeNumeric = parseInt(currentTime.replace(':', ''), 10);
        let currentTimeSlot;

        for (const cycle of shiftMemberCycles) {
            const [start, end] = cycle.timeSlot.split('-').map(Number);
            if ((cycle.timeSlot === '2300-0000' && currentTimeNumeric >= start && currentTimeNumeric >= end) ||
                (currentTimeNumeric >= start && currentTimeNumeric <= end)) {
                currentTimeSlot = cycle.timeSlot;
                break;
            }
        }

        // Calculate the percentage of times with values
        const totalTimesWithValuesInShift = shiftMemberCycles.reduce((acc, cycle) =>
            acc + cycle.checkpoint.filter(checkpoint => checkpoint.time && checkpoint.time.trim() !== '').length, 0);

        const totalTimesInShift = shiftMemberCycles.reduce((acc, cycle) => acc + cycle.checkpoint.length, 0);
        const percentageTimesWithValuesInShift = (totalTimesWithValuesInShift / totalTimesInShift) * 100;

        res.render('auxiliarypolice-patrol-shiftmemberlocation-detail', {
            user,
            notifications,
            uuid: uuidv4(),
            patrolReport: checkReport,
            reportId: id,
            cycle: shiftMemberCycles,
            currentTimeSlot,
            progressReport: percentageTimesWithValuesInShift.toFixed(0),
        });
    } catch (error) {
        console.error('Error fetching shift member location details:', error);
        next(error);
    }
});

// Shift member location - POST update remarks
app.post('/auxiliary-police/patrol/remarks/update/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { user } = req;
        const id = req.params.id;

        // Update the remarks for a patrol report
        const patrol = await PatrolAux.findOneAndUpdate(
            { _id: id },
            { $set: { remarks: req.body.remarks } },
            { new: true }
        );

        if (patrol) {
            console.log('Successfully updated remarks on this patrol report');
            res.redirect('/auxiliary-police/patrol/patrol-unit/' + patrol._id);
        } else {
            console.log('Failed to update remarks on this patrol report');
            res.redirect('/auxiliary-police/patrol/patrol-unit/' + patrol._id);
        }
    } catch (error) {
        console.error('Error updating patrol remarks:', error);
        next(error);
    }
});

// Shift member location - find shift member 
app.get('/shift-member/fullname-submit/:location/:checkpointName', async (req, res, next) => {
    try {
        const location = _.startCase(req.params.location.replace(/-/g, ' '));
        const checkpointName = _.startCase(req.params.checkpointName.replace(/-/g, ' '));

        const today = moment().utcOffset(8).startOf('day').toDate();
        const kualaLumpurTimeZoneOffset1 = 8;
        const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60);

        const currentTimeNumeric = now1.format('HHmm');
        const isNightShift = currentTimeNumeric >= 2300 || currentTimeNumeric < 700;

        // Fetch reports based on whether it's a night shift or not
        if (isNightShift) {
            const filteredReports1 = await PatrolAux.findOne({
                location: location,
                startShift: '2300',
                $or: [{ date: today }, { date: moment(today).subtract(1, 'days').toDate() }]
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
                date: { $gte: today },
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
    } catch (error) {
        console.error('Error selecting fullname:', error);
        next(error);
    }
});

// Shift member location route - submit patrol qr
app.get('/shift-member/checkpoint-submit/:location/:checkpointName/:shiftMember/:reportId', async (req, res, next) => {
    try {
        const checkUser = await User.findOne({ fullname: req.params.shiftMember });
        const reportId = req.params.reportId;

        // Parse location and checkpoint name from URL parameters
        const checkpointName = _.startCase(req.params.checkpointName.replace(/-/g, ' '));
        const location = _.startCase(req.params.location.replace(/-/g, ' '));

        if (checkUser) {
            const patrolReport = await PatrolAux.findOne({ _id: reportId });

            if (patrolReport && patrolReport.status === 'Pending') {
                // Find the relevant cycle based on checkpoint name and time slot
                const cycleToUpdate = patrolReport.shiftMember.cycle.find(cycle =>
                    cycle.checkpoint.some(
                        checkpoint =>
                            checkpoint.checkpointName === checkpointName &&
                            isWithinTimeSlot(cycle.timeSlot)
                    )
                );

                if (cycleToUpdate) {
                    const checkpointToUpdate = cycleToUpdate.checkpoint.find(
                        checkpoint => checkpoint.checkpointName === checkpointName
                    );

                    if (checkpointToUpdate) {
                        const currentTimeNumeric1 = moment.utc().add(8, 'hours').format('HH:mm:ss');
                        const currentTime1 = parseInt(currentTimeNumeric1.replace(':', ''), 10);

                        const inputString = checkUser.fullname;

                        // Update the checkpoint details
                        checkpointToUpdate.time = currentTime1 + 'HRS';
                        checkpointToUpdate.logReport = `${checkpointName} have been patrol by ${inputString} at ${currentTime1}HRS`;
                        checkpointToUpdate.username = checkUser.username;
                        checkpointToUpdate.fullName = inputString;

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
                console.log('No patrol report found for the user or the patrol report is already closed.');
                res.render('submit-failed');
            }
        } else {
            console.log('User not found.');
            res.render('submit-failed');
        }
    } catch (error) {
        console.error('Error submitting checkpoint data using QR scanner:', error);
        next(error);
    }
});

// Patrol unit route- view
app.get('/auxiliary-police/patrol/patrol-unit/view', isAuthenticated, async (req, res, next) => {
    try {
        const { user, notifications } = req;

        // Query all patrol units
        const patrolUnit = await PatrolAux.find({ type: 'Patrol Unit' }).sort({ date: -1 });

        res.render('auxiliarypolice-patrol-patrolunit-view', {
            user,
            notifications,
            uuid: uuidv4(),
            patrolUnit
        });
    } catch (error) {
        console.error('Error fetching patrol unit data:', error);
        next(error);
    }
});

// Patrol unit route - details
app.get('/auxiliary-police/patrol/patrol-unit/details/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { user, notifications } = req;
        const reportId = req.params.id;

        // Find the report and calculate percentage of non-empty times
        const checkReport = await PatrolAux.findOne({ _id: reportId });
        const totalPatrolUnits = checkReport.patrolUnit.length;
        const nonEmptyTimeCount = checkReport.patrolUnit.filter(unit => unit.time && unit.time.trim() !== '').length;
        const percentageNonEmptyTime = (nonEmptyTimeCount / totalPatrolUnits) * 100;

        res.render('auxiliarypolice-patrol-patrolunit-detail', {
            user,
            notifications,
            uuid: uuidv4(),
            patrolReport: checkReport,
            percentage: percentageNonEmptyTime.toFixed(0),
            reportId
        });
    } catch (error) {
        console.error('Error fetching patrol unit details:', error);
        next(error);
    }
});

// Patrol unit route - submit patrol qr
app.get('/patrol-unit/checkpoint-submit/:checkpointName/:longitude/:latitude', async (req, res, next) => {
    try {
        const dateToday = moment().utcOffset(8).toDate();
        const kualaLumpurTimeZoneOffset1 = 8;
        const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60);
        const time = now1.format('HHmm') + 'HRS';

        const checkpointName = _.startCase(req.params.checkpointName.replace(/-/g, ' '));
        const currentLongitude = req.params.longitude;
        const currentLatitude = req.params.latitude;

        const logReport = `Have patrol this area at ${time}`;

        // Update the patrol unit checkpoint details in the database
        const checkPatrolUnit = await PatrolAux.findOneAndUpdate(
            {
                type: 'Patrol Unit',
                date: moment().utcOffset(8).toDate(),
                'patrolUnit.checkpointName': checkpointName
            },
            {
                $set: {
                    'patrolUnit.$.time': time,
                    'patrolUnit.$.longitude': currentLongitude,
                    'patrolUnit.$.latitude': currentLatitude,
                    'patrolUnit.$.logReport': logReport
                }
            },
            { new: true, useFindAndModify: false }
        );

        if (checkPatrolUnit && checkPatrolUnit.status === 'Open') {
            console.log(checkPatrolUnit._id);
            console.log(`Successfully updated patrol unit for ${checkpointName}`);
            res.render('submit-success');
        } else {
            console.log('Unsuccessful update the QR data due to closed status!');
            res.render('submit-failed');
        }
    } catch (error) {
        console.error('Error submitting checkpoint data with QR scan:', error);
        next(error);
    }
});

// Patrol unit route - get map coordinates
app.get('/map-coordinates/:reportId', async (req, res, next) => {
    const reportId = req.params.reportId;

    try {
        const patrolReport = await PatrolAux.findOne({ _id: reportId });

        if (!patrolReport) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Extract and format checkpoint coordinates from the patrol report
        const checkpointCoordinates = patrolReport.patrolUnit.map(checkpoint => [
            checkpoint.longitude,
            checkpoint.latitude
        ]);

        res.json(checkpointCoordinates);
    } catch (error) {
        console.error('Error fetching map coordinates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Success route - patrol unit/shift member location
app.get('/submit-success', async (req, res, next) => {
    try {
        res.render('submit-success');
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// Failed route - patrol unit/shift member location
app.get('/submit-failed', async (req, res, next) => {
    try {
        res.render('submit-failed');
    } catch (renderError) {
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});


// // ============================
// // Visitor Management System
// // ============================

// // VMS
// // ROUTE FOR DISPLAYING THE FORM
// app.get('/visitor/submit', (req, res) => {
//     try {
//         try {
//             res.render('visitor_form', {
//                 thank_you_message: null,
//                 fields: {
//                     vis_firstname: '',
//                     vis_lastname: '',
//                     no_ic: '',
//                     address: '',
//                     level: '',
//                     no_pas: '',
//                     no_telephone: '',
//                     pur_visit: ''
//                 },
//                 errors: {}
//             });
//         } catch (renderError) {
//             console.error('Rendering Error:', renderError);
//             next(renderError);
//         }
//     } catch (renderError) {
//         console.error('Rendering Error:', renderError);
//         next(renderError);
//     }
// }).post('/visitor/submit', async (req, res) => {
//     const kualaLumpurTimeZoneOffset1 = 8; // Kuala Lumpur is UTC+8
//     const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60); // Convert hours to minutes

//     const fields = {
//         vis_firstname: req.body.vis_firstname.trim(),
//         vis_lastname: req.body.vis_lastname.trim(),
//         no_ic: req.body.no_ic.trim(),
//         address: req.body.address.trim(),
//         level: req.body.level.trim(),
//         no_pas: req.body.no_pas.trim(),
//         no_telephone: req.body.no_telephone.trim(),
//         pur_visit: req.body.pur_visit.trim(),
//         time_in: now1.format('YYYY-MM-DD HH:mm:ss'), // Format as 'YYYY-MM-DD HH:mm:ss' for time_in
//         build_loc: req.body.build_loc
//     };

//     let errors = {};
//     if (!/^[a-zA-Z\s]+$/.test(fields.vis_firstname)) errors.vis_firstname = "Invalid first name format.";
//     if (!/^[a-zA-Z\s]+$/.test(fields.vis_lastname)) errors.vis_lastname = "Invalid last name format.";
//     if (!/^\d{12}$/.test(fields.no_ic)) errors.no_ic = "IC number must be 12 digits.";
//     if (fields.address === '') errors.address = "Address is required.";
//     if (!/^\d+$/.test(fields.level)) errors.level = "Level must be a number.";
//     if (fields.no_pas === '') errors.no_pas = "No Pas is required.";
//     if (!/^\d{10,15}$/.test(fields.no_telephone)) errors.no_telephone = "Phone number must be between 10 and 15 digits.";
//     if (fields.pur_visit === '') errors.pur_visit = "Purpose of visit is required.";

//     if (Object.keys(errors).length === 0) {
//         const newVisitor = new Vms(fields);
//         try {
//             await newVisitor.save();
//             try {
//                 res.render('visitor_form', {
//                     thank_you_message: 'Thank you for your submission!',
//                     fields: fields,
//                     errors: {}
//                 });
//             } catch (renderError) {
//                 console.error('Rendering Error:', renderError);
//                 next(renderError);
//             }
//         } catch (err) {
//             console.error('Error saving visitor:', err);
//             try {
//                 res.render('visitor_form', {
//                     thank_you_message: '',
//                     fields: fields,
//                     errors: {}
//                 });
//             } catch (renderError) {
//                 console.error('Rendering Error:', renderError);
//                 next(renderError);
//             }
//         }
//     } else {
//         try {
//             res.render('visitor_form', {
//                 thank_you_message: '',
//                 fields: fields,
//                 errors: errors
//             });
//         } catch (renderError) {
//             console.error('Rendering Error:', renderError);
//             next(renderError);
//         }
//     }
// });

// // ROUTE FOR HANDLING FORM SUBMISSION


// // ROUTE FOR DISPLAYING VISITOR LIST
// app.get('/vms/list', isAuthenticated, async function (req, res) {
//     const username = req.user.username;
//     const user = await User.findOne({ username: username });
//     const notifications = await Notification.find({
//         recipient: user._id,
//         read: false
//     })
//         .populate('sender')
//         .sort({ timestamp: -1 });

//     // Fetch visitor data with formatted dates
//     const visitors = await Vms.find().exec();
//     const formattedVisitors = visitors.map(visitor => ({
//         ...visitor.toObject(),
//         time_in: visitor.time_in ? moment(visitor.time_in).format('YYYY-MM-DD HH:mm:ss') : '-',
//         time_out: visitor.time_out ? moment(visitor.time_out).format('YYYY-MM-DD HH:mm:ss') : '-'
//     }));


//     // Calculate visitor counts
//     const totalVisitorsToday = await getTotalVisitorsToday();
//     const timeInVisitorsToday = await getTotalVisitorsTimeInToday();
//     const timeOutVisitorsToday = await getTotalVisitorsTimeOutToday();

//     if (user) {
//         try {
//             res.render('vms-list', {
//                 user: user,
//                 notifications: notifications,
//                 uuid: uuidv4(),
//                 visitors: formattedVisitors,  // Pass formatted visitor data
//                 totalVisitorsToday,
//                 timeInVisitorsToday,
//                 timeOutVisitorsToday
//             });
//         } catch (renderError) {
//             console.error('Rendering Error:', renderError);
//             next(renderError);
//         }
//     }
// });

// // Handle time out action
// app.post('/toggle_status', async (req, res) => {
//     const visitorId = req.body.visitor_id;
//     const kualaLumpurTimeZoneOffset1 = 8;
//     const now1 = moment().utcOffset(kualaLumpurTimeZoneOffset1 * 60);
//     const timeOut = now1.format('YYYY-MM-DD HH:mm:ss');

//     try {
//         await Vms.findByIdAndUpdate(visitorId, { time_out: timeOut });
//         res.redirect('/vms/list');
//     } catch (err) {
//         console.error('Error updating visitor time out:', err);
//         res.redirect('/vms/list');
//     }
// });

// // Handle delete action
// app.post('/delete_visitor', async (req, res) => {
//     const { visitor_id } = req.body;
//     try {
//         await Vms.findByIdAndDelete(visitor_id);
//         res.redirect('/vms/list');
//     } catch (error) {
//         handleError(res, error);
//     }
// });

// // Handle visitor update
// app.post('/update_visitor/:id', async (req, res) => {
//     const visitorId = req.params.id;
//     const updatedData = req.body;

//     try {
//         await Vms.findByIdAndUpdate(visitorId, updatedData);
//         res.send('Visitor updated successfully');
//     } catch (error) {
//         console.error('Error updating visitor:', error);
//         res.status(500).send('Error updating visitor');
//     }
// });

// // Fetch visitors for AJAX requests
// app.get('/fetch_visitors', async (req, res) => {
//     const { search_name, selected_date, status_filter, build_loc } = req.query;
//     try {
//         const conditions = {};
//         if (search_name) {
//             conditions.$or = [
//                 { vis_firstname: new RegExp(search_name, 'i') },
//                 { vis_lastname: new RegExp(search_name, 'i') }
//             ];
//         }
//         if (selected_date) {
//             const startDate = moment(selected_date).startOf('day').toDate();
//             const endDate = moment(selected_date).endOf('day').toDate();
//             conditions.time_in = { $gte: startDate, $lte: endDate };
//         }
//         if (status_filter) {
//             if (status_filter === 'checked_in') {
//                 conditions.time_in = { $ne: null };
//                 conditions.time_out = null;
//             } else if (status_filter === 'checked_out') {
//                 conditions.time_out = { $ne: null };
//             }
//         }
//         if (build_loc) {
//             conditions.build_loc = build_loc;
//         }
//         const visitors = await Vms.find(conditions).exec();
//         res.json(visitors);
//     } catch (error) {
//         handleError(res, error);
//     }
// });

// // Fetch total visitors for AJAX requests
// app.get('/total_visitors', async (req, res) => {
//     try {
//         const totalVisitors = await getTotalVisitorsToday();
//         res.send(totalVisitors.toString());
//     } catch (error) {
//         handleError(res, error);
//     }
// });

// app.get('/total_timein_visitors', async (req, res) => {
//     try {
//         const totalTimeInVisitors = await getTotalVisitorsTimeInToday();
//         res.send(totalTimeInVisitors.toString());
//     } catch (error) {
//         handleError(res, error);
//     }
// });

// app.get('/total_timeout_visitors', async (req, res) => {
//     try {
//         const totalTimeOutVisitors = await getTotalVisitorsTimeOutToday();
//         res.send(totalTimeOutVisitors.toString());
//     } catch (error) {
//         handleError(res, error);
//     }
// });

// ============================
// Fetch Data API
// ============================

//  * Route to get attendance data for today.
//  * Uses moment.js to calculate the start and end of the day.
//  * Fetches attendance records and formats the data.
app.get('/api/all-attendance/today/all', async (req, res, next) => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();
        const currentTime = moment().utcOffset(8);

        // Fetch attendance data for today
        const attendanceData = await Attendance.find({
            'date.signInTime': {
                $gte: today,
                $lte: currentTime
            }
        })
            .sort({ timestamp: -1 })
            .limit(2)
            .lean();

        // Fetch all user data
        const allUsers = await User.find().lean();

        // Format attendance data
        const filteredData = attendanceData.map(entry => {
            const user = allUsers.find(user => user._id.toString() === entry.user.toString());

            const getInitials = str => str.split(' ')
                .slice(0, 2)
                .map(name => name.charAt(0).toUpperCase())
                .join('');

            const formatDateTime = dateTime => dateTime.toLocaleTimeString('en-MY', {
                timeZone: 'Asia/Kuala_Lumpur',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                user: user ? {
                    _id: user._id,
                    fullname: user.fullname,
                    initials: getInitials(user.fullname),
                    username: user.username,
                    department: user.department,
                    section: user.section,
                    profile: user.profile
                } : null,
                datetime: formatDateTime(moment(entry.date.signInTime).utcOffset(8).toDate()),
                signInTime: entry.date.signInTime,
                signOutTime: entry.date.signOutTime,
                status: entry.status,
                type: entry.type
            };
        });

        res.json(filteredData); // Send formatted data as response
    } catch (err) {
        next(err); // Pass error to global error handler
    }
});

// * Route to get today's attendance data for HR.
// * Supports search and pagination.
app.post('/api/data/all-attendance/today/human-resources', isAuthenticated, async (req, res, next) => {
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        const today = moment().startOf('day').toDate();

        // Fetch attendance data for today
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: today,
                        $lt: moment().endOf('day').toDate()
                    }
                }
            },
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

        // Map user data for faster access
        const allUsers = await User.find();
        const userMap = allUsers.reduce((map, user) => {
            map[user._id] = {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                section: user.section,
                department: user.department
            };
            return map;
        }, {});

        // Combine attendance data with user data
        const combinedData = allUsers.map(user => {
            const attendanceRecord = attendanceData.find(record => record._id.equals(user._id));
            return attendanceRecord ? {
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
            } : null;
        }).filter(item => item !== null);

        // Sort data by timestamp
        combinedData.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return moment(b.timestamp).diff(moment(a.timestamp));
        });

        // Filter data based on search query
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
                (signInTime && regex.test(moment(signInTime).format('LT'))) ||
                (signOutTime && regex.test(moment(signOutTime).format('LT')))
            );
        });

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        // Calculate total counts of different statuses
        const totalCounts = combinedData.reduce((acc, item) => {
            acc.total++;
            acc[item.status.toLowerCase()] = (acc[item.status.toLowerCase()] || 0) + 1;
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0, leave: 0, invalid: 0 });

        const response = {
            data1: paginatedData,
            data2: filteredData,
            counts: totalCounts
        };

        res.json(response); // Send response with paginated and filtered data
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

//  * Route to get attendance data per selected date for HR.
//  * Supports search and pagination.
app.post('/api/data/all-attendance/per-date/human-resources', isAuthenticated, async (req, res, next) => {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        // Calculate start and end of the selected date
        const selectedLocalDate = moment(selectedDate).utcOffset(8).startOf('day');
        const startDate = selectedLocalDate.clone().utc().toDate();
        const endDate = selectedLocalDate.clone().endOf('day').utc().toDate();

        // Fetch attendance data for the selected date
        const attendanceData = await Attendance.find({
            timestamp: {
                $gte: startDate,
                $lt: endDate
            }
        });

        // Map user data for faster access
        const allUsers = await User.find();
        const userMap = allUsers.reduce((map, user) => {
            map[user._id] = {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                section: user.section,
                department: user.department
            };
            return map;
        }, {});

        // Combine attendance data with user data
        const combinedData = allUsers.map(user => {
            const attendanceRecord = attendanceData.find(record => record.user.equals(user._id));
            return attendanceRecord ? {
                _id: attendanceRecord._id,
                user: userMap[user._id],
                status: attendanceRecord.status,
                type: attendanceRecord.type,
                signInTime: attendanceRecord.date.signInTime,
                signOutTime: attendanceRecord.date.signOutTime,
                timestamp: attendanceRecord.timestamp,
                location: attendanceRecord.location,
                remarks: attendanceRecord.remarks,
            } : null;
        }).filter(item => item !== null);

        // Sort data by timestamp
        combinedData.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));

        // Filter data based on search query
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
                (signInTime && regex.test(moment(signInTime).format('LT'))) ||
                (signOutTime && regex.test(moment(signOutTime).format('LT')))
            );
        });

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        res.json(paginatedData); // Send paginated data as response
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

//  * Route to get attendance data per selected date for HR.
//  * Fetches attendance data for a specific month and year for all users.
app.post('/api/data/all-attendance/per-month/human-resources', isAuthenticated, async function (req, res, next) {
    const selectedDate = req.body.date; // Date selected by the user
    const searchQuery = req.query.search || ''; // Search query from request query params
    const page = parseInt(req.query.page) || 1; // Page number from request query params
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit; // Number of items to skip

    // Extract month and year from the selected date
    const [month, year] = selectedDate.split('/');

    try {
        // Create a set of all possible status types
        const allStatusTypes = ['Present', 'Absent', 'Late', 'Invalid', 'Leave', 'Non Working Day'];
        const allUser = await User.find(); // Fetch all users

        // Query attendance records based on the month and year
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: moment([year, month - 1]).startOf('month').toDate(), // Start of the month
                        $lt: moment([year, month]).startOf('month').toDate() // Start of the next month
                    }
                }
            },
            {
                $group: {
                    _id: { user: '$user', status: '$status', type: '$type' },
                    count: { $sum: 1 } // Count occurrences
                }
            }
        ]);

        // Initialize status counts and public holiday counts
        const userStatusCounts = {};
        const publicHolidayCounts = {};

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

        // Combine user data with status counts and public holiday counts
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

        // Filter combined data based on the search query
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

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        // Prepare response
        const response = {
            data1: paginatedData, // Paginated data
            data2: filteredData // All filtered data
        };

        // Log paginated data for debugging
        console.log(paginatedData);

        // Respond with the paginated and filtered attendance data
        res.json(response);
    } catch (error) {
        // Pass error to global error handler
        next(error);
    }
});

//  * Route to get attendance data per selected date for department/section.
//  * Fetches today's attendance data for the department or section of the logged-in user.
app.post('/api/data/all-attendance/today/department-section', isAuthenticated, async function (req, res, next) {
    const searchQuery = req.query.search || ''; // Search query from request query params
    const page = parseInt(req.query.page) || 1; // Page number from request query params
    const limit = 5; // Number of items per page
    const skip = (page - 1) * limit; // Items to skip

    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        // Get today's date range
        const today = moment().startOf('day').toDate();
        const endOfToday = moment().endOf('day').toDate();

        // Query today's attendance records
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    timestamp: { $gte: today, $lt: endOfToday }
                }
            },
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

        const userIds = attendanceData.map(record => record._id);

        // Get users in the same department/section
        let allUsers;
        if (user.isHeadOfDepartment) {
            allUsers = await User.find({ department: user.department, _id: { $ne: user._id } });
        } else if (user.isHeadOfSection) {
            allUsers = await User.find({ section: user.section, _id: { $ne: user._id } });
        } else {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Map users by ID
        const userMap = allUsers.reduce((map, user) => {
            map[user._id] = {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                section: user.section,
                department: user.department
            };
            return map;
        }, {});

        // Combine attendance records with user details
        const combinedData = allUsers.map(user => {
            const attendanceRecord = attendanceData.find(record => record._id.equals(user._id));
            return attendanceRecord ? {
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
            } : null;
        }).filter(item => item !== null);

        // Sort combined data by timestamp
        combinedData.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return moment(b.timestamp).diff(moment(a.timestamp));
        });

        // Filter data based on search query
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
                (signInTime && regex.test(moment(signInTime).format('LT'))) ||
                (signOutTime && regex.test(moment(signOutTime).format('LT')))
            );
        });

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        // Calculate status counts
        const totalCounts = combinedData.reduce(
            (acc, item) => {
                acc.total++;
                acc[item.status.toLowerCase()] = (acc[item.status.toLowerCase()] || 0) + 1;
                return acc;
            },
            { total: 0, present: 0, absent: 0, late: 0, leave: 0, invalid: 0 }
        );

        const response = {
            data1: paginatedData,
            data2: filteredData,
            counts: totalCounts
        };

        res.json(response);
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

//  * Route to get attendance data per selected date for department/section.
//  * Fetches attendance data for a specific date for the department or section of the logged-in user.
app.post('/api/data/all-attendance/per-date/department-section', isAuthenticated, async function (req, res, next) {
    const selectedDate = req.body.date;
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        const selectedLocalDate = moment(selectedDate).utcOffset(8).startOf('day');
        const startDate = selectedLocalDate.clone().utc().toDate();
        const endDate = selectedLocalDate.clone().endOf('day').utc().toDate();

        // Query attendance records for the selected date
        const attendanceData = await Attendance.find({
            timestamp: { $gte: startDate, $lt: endDate }
        });

        let allUsers;
        if (user.isHeadOfDepartment) {
            allUsers = await User.find({ department: user.department });
        } else if (user.isHeadOfSection) {
            allUsers = await User.find({ section: user.section });
        } else {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Map users by ID
        const userMap = allUsers.reduce((map, user) => {
            map[user._id] = {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                section: user.section,
                department: user.department
            };
            return map;
        }, {});

        // Combine attendance records with user details
        const combinedData = allUsers.map(user => {
            const attendanceRecord = attendanceData.find(record => record.user.equals(user._id));
            return attendanceRecord ? {
                _id: attendanceRecord._id,
                user: userMap[user._id],
                status: attendanceRecord.status,
                type: attendanceRecord.type,
                signInTime: attendanceRecord.date.signInTime,
                signOutTime: attendanceRecord.date.signOutTime,
                timestamp: attendanceRecord.timestamp,
                location: attendanceRecord.location,
                remarks: attendanceRecord.remarks
            } : null;
        }).filter(item => item !== null);

        // Sort combined data by timestamp
        combinedData.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));

        // Filter data based on search query
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
                (signInTime && regex.test(moment(signInTime).utcOffset(8).format('h:mm A'))) ||
                (signOutTime && regex.test(moment(signOutTime).utcOffset(8).format('h:mm A')))
            );
        });

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        if (paginatedData.length === 0) {
            return res.status(404).json({ message: 'No paginated attendance data found' });
        }

        const response = {
            data1: paginatedData,
            data2: filteredData
        };

        res.json(response);
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

//  * Route to get attendance data per selected date for department/section.
//  * Fetches attendance data for a specific month for the department or section of the logged-in user.
app.post('/api/data/all-attendance/per-month/department-section', isAuthenticated, async function (req, res, next) {
    const { month, year } = req.body; // Month and year from request body
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        // Determine the first and last day of the month
        const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();

        // Query attendance records for the specified month
        const attendanceData = await Attendance.find({
            timestamp: { $gte: startDate, $lt: endDate }
        });

        let allUsers;
        if (user.isHeadOfDepartment) {
            allUsers = await User.find({ department: user.department });
        } else if (user.isHeadOfSection) {
            allUsers = await User.find({ section: user.section });
        } else {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Map users by ID
        const userMap = allUsers.reduce((map, user) => {
            map[user._id] = {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                section: user.section,
                department: user.department
            };
            return map;
        }, {});

        // Combine attendance records with user details
        const combinedData = allUsers.map(user => {
            const attendanceRecords = attendanceData.filter(record => record.user.equals(user._id));
            const mergedRecord = attendanceRecords.reduce((acc, record) => {
                acc.status = record.status;
                acc.type = record.type;
                acc.signInTime = record.date.signInTime;
                acc.signOutTime = record.date.signOutTime;
                acc.timestamp = record.timestamp;
                acc.location = record.location;
                acc.remarks = record.remarks;
                acc.count = (acc.count || 0) + 1;
                return acc;
            }, {});
            return mergedRecord ? {
                _id: mergedRecord._id,
                user: userMap[user._id],
                status: mergedRecord.status,
                type: mergedRecord.type,
                signInTime: mergedRecord.signInTime,
                signOutTime: mergedRecord.signOutTime,
                timestamp: mergedRecord.timestamp,
                location: mergedRecord.location,
                remarks: mergedRecord.remarks,
                count: mergedRecord.count
            } : null;
        }).filter(item => item !== null);

        // Sort combined data by timestamp
        combinedData.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));

        // Filter data based on search query
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
                (signInTime && regex.test(moment(signInTime).utcOffset(8).format('h:mm A'))) ||
                (signOutTime && regex.test(moment(signOutTime).utcOffset(8).format('h:mm A')))
            );
        });

        // Paginate filtered data
        const paginatedData = filteredData.slice(skip, skip + limit);

        if (paginatedData.length === 0) {
            return res.status(404).json({ message: 'No paginated attendance data found' });
        }

        const response = {
            data1: paginatedData,
            data2: filteredData
        };

        res.json(response);
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// * Route to generate a QR code with a unique identifier and client IP.
// * Creates a QR code image with specified colors and dimensions,
// * then returns the image data and unique identifier to the client.
app.get('/api/qrcode/generate', async (req, res) => {
    const uniqueIdentifier = generateUniqueIdentifier();
    const clientIP = req.clientIp;

    try {
        const qrCodeImage = await qr.toDataURL(uniqueIdentifier + "-" + clientIP, {
            type: 'image/png',
            errorCorrectionLevel: 'H',
            color: { dark: '#3874ff', light: '#f5f7fa' }, // Set colors for the QR code
            width: 400,
            margin: 0 // Set the width of the QR code
        });

        res.json({ qrCodeImage, uniqueIdentifier });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// * Route to save raw QR code data to the database.
// * Receives QR code data from the client and stores it with a timestamp.
app.post('/api/qrcode/save-data', async (req, res) => {
    const qrData = req.body.qrData;

    // Save the QR code data in the database with the current timestamp
    await QRCode.create({
        uniqueId: qrData,
        createdAt: moment().utcOffset(8).toDate()
    });

    res.status(200).send('QR code data received and saved successfully');
});

// * Route to process scanned QR code data for attendance.
// * Validates QR code data, checks user authentication, and updates attendance records
// * based on scanning location and time.
app.post('/api/qrcode/process-data', isAuthenticated, async (req, res) => {
    const scannedData = req.body.scannedData;
    const id = req.body.id;

    console.log('Received scanned data from client:', scannedData);
    console.log('Id received is:', id);

    const uniqueIdentifier = scannedData.substring(0, scannedData.indexOf('-'));
    const clientIp = scannedData.substring(scannedData.indexOf('-') + 1);

    console.log('Unique Identifier:', uniqueIdentifier);
    console.log('Client IP:', clientIp);

    // Determine location based on client IP
    const locationMap = {
        '175.140.45.73': 'BMI',
        '104.28.242.42': 'BMI',
        '210.186.48.79': 'JM',
        '60.50.17.102': 'CM',
        '175.144.217.244': 'RS'
    };
    const location = locationMap[clientIp] || 'Invalid';

    console.log('Location:', location);

    const checkUser = await User.findOne({ _id: id });
    let log = '';

    if (checkUser) {
        const now = moment().utcOffset(8).toDate();
        const today = moment().utcOffset(8).startOf('day').toDate();

        const checkQrCode = await QRCode.findOne({ uniqueId: uniqueIdentifier });

        if (checkQrCode) {
            console.log('QR code is invalid, try to scan latest QR code!');
            log = 'QR code is invalid, try to scan latest QR code!';
        } else {
            const existingAttendance = await Attendance.findOne({
                user: checkUser._id,
                timestamp: { $gte: today, $lte: now }
            });

            console.log('Existing Attendance:', existingAttendance);

            if (existingAttendance) {
                if (existingAttendance.date.signInTime && !existingAttendance.date.signOutTime) {
                    // Handle sign-out process
                    if (checkUser.isNonOfficeHour) {
                        const startShift = moment(existingAttendance.signInTime).utcOffset(8);
                        const endShift = moment(startShift)
                            .add(1, 'days')
                            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
                            .toDate();

                        if (now > endShift) {
                            await Attendance.findOneAndUpdate(
                                { user: checkUser._id, signInTime: { $gte: startShift, $lt: endShift } },
                                {
                                    $set: {
                                        'date.signOutTime': now,
                                        type: 'sign out',
                                        status: 'Present',
                                        timestamp: now,
                                        'location.signOut': location
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            console.log('Successfully signed out for today');

                            await new TempAttendance({ user: checkUser._id, timestamp: now, type: 'sign out' }).save();
                            await new Activity({
                                user: checkUser._id,
                                date: now,
                                title: 'Sign out for today',
                                type: 'Attendance',
                                description: `${checkUser.fullname} has signed out for ${getDateFormat2(today)}`
                            }).save();

                            log = 'Successfully signed out for today, thank you!';
                        }
                    } else {
                        // Regular shift sign-out
                        await Attendance.findOneAndUpdate(
                            { user: checkUser._id, timestamp: { $gte: today, $lte: now } },
                            {
                                $set: {
                                    'date.signOutTime': now,
                                    type: 'sign out',
                                    status: 'Present',
                                    timestamp: now,
                                    'location.signOut': location
                                }
                            },
                            { upsert: true, new: true }
                        );

                        console.log('Successfully signed out for today');

                        await new TempAttendance({ user: checkUser._id, timestamp: now, type: 'sign out' }).save();
                        await new Activity({
                            user: checkUser._id,
                            date: now,
                            title: 'Sign out for today',
                            type: 'Attendance',
                            description: `${checkUser.fullname} has signed out for ${getDateFormat2(today)}`
                        }).save();

                        log = 'Successfully signed out for today, thank you!';
                    }
                } else if (!existingAttendance.date.signInTime && !existingAttendance.date.signOutTime) {
                    // Handle sign-in process
                    if (checkUser.isNonOfficeHour) {
                        await Attendance.findOneAndUpdate(
                            { user: checkUser._id, timestamp: { $gte: today, $lte: now } },
                            {
                                $set: {
                                    status: 'Present',
                                    type: 'sign in',
                                    'date.signInTime': now,
                                    timestamp: now,
                                    'location.signIn': location
                                }
                            },
                            { upsert: true, new: true }
                        );

                        await new TempAttendance({ user: checkUser._id, timestamp: now, type: 'sign in' }).save();
                        await new Activity({
                            user: checkUser._id,
                            date: now,
                            title: 'Sign in for today',
                            type: 'Attendance',
                            description: `${checkUser.fullname} has signed in for ${getDateFormat2(today)}`
                        }).save();

                        log = 'Successfully signed in for today, thank you!';
                    } else {
                        const currentTime = moment().utcOffset(8).toDate();
                        const pstTime = currentTime.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
                        const pstHour = parseInt(pstTime.split(',')[1].trim().split(':')[0]);

                        if (pstHour >= 8) {
                            console.log('Clock in late confirmed');

                            await Attendance.findOneAndUpdate(
                                { user: checkUser._id, timestamp: { $gte: today, $lte: now } },
                                {
                                    $set: {
                                        status: 'Late',
                                        type: 'sign in',
                                        'date.signInTime': now,
                                        timestamp: now,
                                        'location.signIn': location
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            await new TempAttendance({ user: checkUser._id, timestamp: now, type: 'sign in' }).save();
                            await new Activity({
                                user: checkUser._id,
                                date: now,
                                title: 'Sign in late for today',
                                type: 'Attendance',
                                description: `${checkUser.fullname} has signed in late for ${getDateFormat2(today)}`
                            }).save();

                            log = 'Successfully signed in as late for today, thank you!';
                        } else {
                            await Attendance.findOneAndUpdate(
                                { user: checkUser._id, timestamp: { $gte: today, $lte: now } },
                                {
                                    $set: {
                                        status: 'Present',
                                        type: 'sign in',
                                        'date.signInTime': now,
                                        timestamp: now,
                                        'location.signIn': location
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            await new TempAttendance({ user: checkUser._id, timestamp: now, type: 'sign in' }).save();
                            await new Activity({
                                user: checkUser._id,
                                date: now,
                                title: 'Sign in for today',
                                type: 'Attendance',
                                description: `${checkUser.fullname} has signed in for ${getDateFormat2(today)}`
                            }).save();

                            log = 'Successfully signed in for today, thank you!';
                        }
                    }
                } else {
                    console.log('User has already signed out for today.');
                    log = 'You already signed out for today, thank you!';
                }
            } else {
                console.log('Attendance record does not exist for the user.');
                log = 'Attendance record does not exist for the user, please check the user ID';
            }
        }

        const response = {
            user: checkUser,
            message: log
        };

        res.json(response);
    }
});

// * Route to get the latest scanned attendance data.
// * Retrieves the most recent attendance record from the TempAttendance collection
// * and returns the related user and message.
app.get('/api/qrcode/get-latest', async (req, res) => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        // Find the most recent attendance record for today
        const tempAttendance = await TempAttendance.findOne({
            timestamp: { $gte: today, $lte: moment().utcOffset(8).toDate() }
        })
            .sort({ timestamp: -1 })
            .lean();

        let message = '';
        let response = '';

        if (tempAttendance) {
            const allUsers = await User.find();
            const user = allUsers.find(user => user._id.toString() === tempAttendance.user.toString());

            switch (tempAttendance.type) {
                case 'sign in':
                    message = 'Have signed in, welcome!';
                    break;
                case 'sign out':
                    message = 'Have signed out, have a good rest!';
                    break;
                case 'meeting':
                    message = 'Welcome to the meeting room!';
                    break;
                case 'events':
                    message = 'Thank you for your participation!';
                    break;
                case 'invalid':
                    message = 'Please try again!';
                    break;
                default:
                    message = 'Unknown attendance type.';
            }

            response = {
                temp: tempAttendance,
                user: user,
                message: message
            };
        } else {
            // Handle the case when no attendance record is found
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

// * Route to get the latest scanned attendance data
// * Retrieves the most recent attendance record from the TempAttendance collection
// * and returns the related user and message.
app.get('/api/attendance/latest', isAuthenticated, async function (req, res, next) {
    try {
        // Find the most recent attendance record from the TempAttendance collection
        const latestAttendance = await TempAttendance.findOne().sort({ timestamp: -1 }).populate('user').exec();

        if (!latestAttendance) {
            return res.status(404).json({ error: 'No attendance records found' });
        }

        // Return the most recent attendance record and related user information
        res.json({
            user: latestAttendance.user,
            message: latestAttendance.message
        });
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// ============================
// Fetch Data API (Echarts)
// ============================

// * Route to get leave data for a selected month
// * Retrieves leave records for the specified month and counts the number of approved and denied leave requests
// * for each day of the month, then returns this data in a structured format.
app.get('/api/leave/selectedmonth', isAuthenticated, async function (req, res, next) {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
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

            // Iterate through each day of the month to count leave statuses
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

            // Return the leave counts for each day of the selected month
            res.json(leaveCounts);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// * Route to get the total approved leave count for a selected month
// * Retrieves all approved leave records for the specified month and calculates the total number of approved leaves.
app.get('/api/leave/totalcount', isAuthenticated, async function (req, res, next) {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
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

            // Return the total approved leave count
            res.json({ totalLeaveCount: totalApprovedLeave });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// * Route to get pending and invalid leave status for the last 7 days
// * Retrieves leave data for the last 7 days and counts the number of pending and invalid leave requests for each day,
// * and calculates the percentage of pending leaves relative to the total leaves for each day.
app.get('/api/leave/pending-invalid', isAuthenticated, async function (req, res, next) {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
            // Get the current date and seven days ago with UTC+8 offset
            const currentDate = moment().utcOffset(8).startOf('day');
            const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').startOf('day');

            // Retrieve leave data for the last 7 days
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
            const totalPercentageInvalidPrevious7Days = 100 - totalPercentagePendingPrevious7Days;

            // Calculate percentage changes
            const percentageChangePending =
                totalPendingPrevious7Days > 0
                    ? ((totalPending - totalPendingPrevious7Days) / totalPendingPrevious7Days) * 100
                    : totalPending > 0
                        ? 100
                        : 0;
            const percentageChangeInvalid =
                totalInvalidPrevious7Days > 0
                    ? ((totalInvalid - totalInvalidPrevious7Days) / totalInvalidPrevious7Days) * 100
                    : totalInvalid > 0
                        ? 100
                        : 0;

            const formattedChangePending =
                percentageChangePending >= 0 ? '+' : '-' + Math.abs(percentageChangePending).toFixed(2);
            const formattedChangeInvalid =
                percentageChangeInvalid >= 0 ? '+' : '-' + Math.abs(percentageChangeInvalid).toFixed(2);

            res.json({
                currentWeek: {
                    counts: dateCounts,
                    totalPending,
                    totalInvalid,
                    totalPercentagePending,
                    totalPercentageInvalid
                },
                previousWeek: {
                    counts: dateCountsPrevious7Days,
                    totalPending: totalPendingPrevious7Days,
                    totalInvalid: totalInvalidPrevious7Days,
                    totalPercentagePending: totalPercentagePendingPrevious7Days,
                    totalPercentageInvalid: totalPercentageInvalidPrevious7Days
                },
                change: {
                    pending: formattedChangePending,
                    invalid: formattedChangeInvalid
                }
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// * Route to get leave records for the last 7 and 14 days
// * Retrieves leave data for the last 7 days and the previous 7 days (14 days ago to 7 days ago),
// * counts the number of submitted leave requests for each day, and calculates the percentage change
// * between the two periods.
app.get('/api/leave/submitted', isAuthenticated, async function (req, res, next) {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username: username });

        if (user) {
            // Get the current date and seven and fourteen days ago with UTC+8 offset
            const currentDate = moment().utcOffset(8).startOf('day');
            const sevenDaysAgo = moment().utcOffset(8).subtract(7, 'days').startOf('day');
            const fourteenDaysAgo = sevenDaysAgo.clone().subtract(7, 'days');

            // Retrieve leave data for the last 7 days
            const leaveDataLast7Days = await Leave.find({
                'date.start': {
                    $gte: sevenDaysAgo.toDate(),
                    $lte: currentDate.toDate()
                }
            }).select('date.start status');

            // Initialize counts for each day in the last 7 days
            const dateCountsLast7Days = {};
            let currentDatePointerLast7Days = sevenDaysAgo.clone();
            while (currentDatePointerLast7Days.isSameOrBefore(currentDate, 'day')) {
                const formattedDate = currentDatePointerLast7Days.format('YYYY-MM-DD');
                dateCountsLast7Days[formattedDate] = { submitted: 0 };
                currentDatePointerLast7Days.add(1, 'days');
            }

            // Count submitted leave records for the last 7 days
            leaveDataLast7Days.forEach(entry => {
                const formattedDate = moment(entry.date.start).utcOffset(8).format('YYYY-MM-DD');

                if (dateCountsLast7Days[formattedDate]) {
                    dateCountsLast7Days[formattedDate].submitted++;
                }
            });

            // Retrieve leave data for the previous 7 days (14 days ago to 7 days ago)
            const leaveDataPrevious7Days = await Leave.find({
                'date.start': {
                    $gte: fourteenDaysAgo.toDate(),
                    $lt: sevenDaysAgo.toDate()
                }
            }).select('date.start status');

            // Initialize counts for each day in the previous 7 days
            const dateCountsPrevious7Days = {};
            let currentDatePointerPrevious7Days = fourteenDaysAgo.clone();
            while (currentDatePointerPrevious7Days.isBefore(sevenDaysAgo, 'day')) {
                const formattedDate = currentDatePointerPrevious7Days.format('YYYY-MM-DD');
                dateCountsPrevious7Days[formattedDate] = { submitted: 0 };
                currentDatePointerPrevious7Days.add(1, 'days');
            }

            // Count submitted leave records for the previous 7 days
            leaveDataPrevious7Days.forEach(entry => {
                const formattedDate = moment(entry.date.start).utcOffset(8).format('YYYY-MM-DD');

                if (dateCountsPrevious7Days[formattedDate]) {
                    dateCountsPrevious7Days[formattedDate].submitted++;
                }
            });

            // Calculate total submitted leaves for each period
            const totalSubmittedLast7Days = Object.values(dateCountsLast7Days).reduce(
                (sum, day) => sum + day.submitted,
                0
            );
            const totalSubmittedPrevious7Days = Object.values(dateCountsPrevious7Days).reduce(
                (sum, day) => sum + day.submitted,
                0
            );

            // Calculate percentage change between the two periods
            const percentageChange =
                totalSubmittedPrevious7Days > 0
                    ? ((totalSubmittedLast7Days - totalSubmittedPrevious7Days) / totalSubmittedPrevious7Days) * 100
                    : totalSubmittedLast7Days > 0
                        ? 100
                        : 0;

            const formattedChange =
                percentageChange >= 0 ? '+' : '-' + Math.abs(percentageChange).toFixed(2);

            // Return the leave data and percentage change
            res.json({
                totalSubmittedLast7Days,
                totalSubmittedPrevious7Days,
                percentageChange: formattedChange
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        next(error); // Pass error to global error handler
    }
});

// ============================
// Super Admin
// ============================

// * Route to update user leave balances
// * This route is accessible only to super admins.
// * It updates existing leave records for all users by adding a new Umrah leave category
// * and sets its initial leave value to 7 days. If a user does not have an existing leave record,
// * a new record is created with various leave categories, including the new Umrah leave.
app.get('/super-admin/update', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = req.user;

    // Check if the authenticated user is a super admin
    if (user.isSuperAdmin) {
        try {
            // Retrieve all users from the database
            const users = await User.find();

            // Iterate through each user to update their leave records
            for (let user of users) {
                // Find existing leave record for the user
                const userLeave = await UserLeave.findOne({ user: user._id });

                if (userLeave) {
                    // Update existing leave record with new Umrah leave category
                    userLeave.umrah = {
                        leave: 7,
                        taken: 0
                    };
                    await userLeave.save();
                } else {
                    // Create a new leave record for the user if none exists
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
                        umrah: { leave: 7, taken: 0 }, // new Umrah leave category
                        unpaid: { taken: 0 },
                        special: { leave: 3, taken: 0 }
                    });
                    await newUserLeave.save();
                }
            }

            console.log('User leaves updated successfully');
        } catch (error) {
            // Pass error to global error handler
            return next(error);
        }

        console.log('Update process completed');
        res.redirect('/');
    } else {
        // Redirect to home if the user is not a super admin
        res.redirect('/');
    }
});

// * Route to log out all users
// * This route is accessible only to super admins.
// * It performs actions necessary to log out all users (details not implemented in this snippet).
// * After logging out all users, it redirects to the home page.
app.get('/super-admin/logout', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = req.user;

    // Check if the authenticated user is a super admin
    if (user.isSuperAdmin) {
        try {
            // Implement logout functionality for all users here
            // This functionality needs to be defined (e.g., removing tokens, sessions, etc.)
        } catch (error) {
            // Pass error to global error handler
            return next(error);
        }

        console.log('All users have been logged out.');
        res.redirect('/');
    } else {
        // Redirect to home if the user is not a super admin
        res.redirect('/');
    }
});

// ============================
// Testing 
// ============================

// * Route to render a temporary page
// * This route is accessible to authenticated users.
// * It retrieves the user's data and unread notifications,
// * and renders the 'temp' view with the user data, notifications, and a unique UUID.
app.get('/temp', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = req.user;

    try {
        // Retrieve unread notifications for the user
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });

        // Render the 'temp' page with user data and notifications
        res.render('temp', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        });
    } catch (renderError) {
        // Pass rendering errors to global error handler
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// * Route to render the email leave page for testing
// * This route is accessible to authenticated users.
// * It retrieves the user's data and unread notifications,
// * and renders the 'email-leave' view with the user data, notifications, and a unique UUID.
app.get('/testing', isAuthenticated, async (req, res, next) => {
    const username = req.user.username;
    const user = req.user;

    try {
        // Retrieve unread notifications for the user
        const notifications = await Notification.find({
            recipient: user._id,
            read: false
        })
            .populate('sender')
            .sort({ timestamp: -1 });

        // Render the 'email-leave' page with user data and notifications
        res.render('email-leave', {
            user: user,
            notifications: notifications,
            uuid: uuidv4(),
        });
    } catch (renderError) {
        // Pass rendering errors to global error handler
        console.error('Rendering Error:', renderError);
        next(renderError);
    }
});

// * Route to search for schedules based on date and location
// * This route is accessible to all users.
// * It handles the search for schedules, taking into account the provided date and location,
// * and returns the schedules and unique staff details.
app.post('/search-schedule-temp', async (req, res) => {
    try {
        const { date, location } = req.body;
        const query = {};

        // Build query based on date and location
        if (date) {
            // Handle dates with UTC+8 offset
            const startDate = moment(date).utcOffset(8).startOf('month').toDate();
            const endDate = moment(date).utcOffset(8).endOf('month').toDate();
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (location) {
            query.location = location;
        }

        // Retrieve schedules based on the query
        const schedules = await ScheduleAux.find(query);

        // Collect staff details from the schedules
        const staffDetails = schedules.flatMap(schedule =>
            schedule.shift.map(shiftDetail => ({
                shift: shiftDetail.shiftName,
                staff: shiftDetail.staff,
                time: shiftDetail.time,
                date: schedule.date
            }))
        );

        // Remove duplicate staff details based on staff name and date
        const uniqueStaffDetails = Array.from(new Map(
            staffDetails.map(detail => [`${detail.staff}-${detail.date}`, detail])
        ).values());

        console.log(schedules[0]);

        // Send the schedules and unique staff details as JSON response
        res.json({ schedules, staffDetails: uniqueStaffDetails });
    } catch (error) {
        // Log error and send server error response
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// ============================
// Scheduler
// ============================

// Scheduler to remove expired sessions every minute
cron.schedule('* * * * *', async () => {
    console.log('Running cron job to remove expired sessions');

    try {
        // Get the current date in Asia/Kuala_Lumpur timezone
        const now = moment().utcOffset(8).toDate();
        console.log('Current time:', now);

        // Retrieve and filter expired sessions
        const sessions = sessionDatabase.collection('sessions');
        const allSessions = await sessions.find().toArray();
        const expiredSessions = allSessions.filter(session => session.expires < now);

        if (expiredSessions.length > 0) {
            console.log(`${expiredSessions.length} expired sessions found.`);

            for (const session of expiredSessions) {
                if (session.session?.passport?.user) {
                    const userId = session.session.passport.user;
                    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

                    // Update user info document
                    const infoUpdate = await Info.findOneAndUpdate(
                        { user: objectId },
                        { $set: { isOnline: false, lastSeen: now } },
                        { new: true, upsert: true }
                    );

                    console.log(infoUpdate ? `Info updated for user: ${userId}` : `Info not found for user: ${userId}`);
                } else {
                    console.log('Session does not contain passport user information:', session._id);
                }
            }

            // Delete expired sessions
            const deleteResult = await sessions.deleteMany({ expires: { $lt: now } });
            console.log(`${deleteResult.deletedCount} expired sessions deleted.`);
        } else {
            console.log('No expired sessions found.');
        }
    } catch (error) {
        console.error('Error removing expired sessions:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to check leave validity every day at midnight
cron.schedule('0 0 * * *', async () => {
    const today = moment().utcOffset(8).toDate();

    try {
        // Find and process invalid leaves
        const invalidLeaves = await Leave.find({ status: 'pending' });

        for (const leave of invalidLeaves) {
            const amountDay = calculateBusinessDays(today, leave.timestamp);

            if (amountDay < -3) {
                console.log('Leave is invalid.');

                const user = await User.findById(leave.user);
                const isDeputyChiefExec = user.isDeputyChiefExec;

                leave.status = 'invalid';

                if (!isDeputyChiefExec) {
                    // Update leave approvals if not a Deputy Chief Executive
                    let lastValidIndex = leave.approvals.reduce((lastIndex, approval, index) =>
                        (approval.status === 'approved' || approval.status === 'submitted') ? index : lastIndex, -1);

                    const nextApprovalIndex = lastValidIndex + 1;

                    if (nextApprovalIndex < leave.approvals.length) {
                        const nextApproval = leave.approvals[nextApprovalIndex];
                        if (nextApproval.role !== 'Human Resource') {
                            leave.approvals.splice(nextApprovalIndex, 1);
                        }
                    }
                }

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

                        // Fetch subscriptions and send push notifications
                        const subscriptions = await Subscriptions.find({ user: recipientId });
                        if (subscriptions.length > 0) {
                            await Promise.all(subscriptions.map(async (subscription) => {
                                const payload = JSON.stringify({
                                    title: "Leave request",
                                    body: "Leave request needs your attention and approval.",
                                    url: "https://www.lakmnsportal.com/leave/request/" + leave._id,
                                    vibrate: [100, 50, 100],
                                    requireInteraction: true,
                                    silent: false
                                });

                                const options = {
                                    vapidDetails: {
                                        subject: 'mailto:protech@lakmns.org',
                                        publicKey: publicVapidKey,
                                        privateKey: privateVapidKey
                                    },
                                    TTL: 60
                                };

                                try {
                                    await webPush.sendNotification(subscription, payload, options);
                                    console.log('Push notification sent successfully to:', subscription.endpoint);
                                } catch (error) {
                                    console.error('Error sending notification to:', subscription.endpoint, error);
                                }
                            }));
                        } else {
                            console.log('The user doesn\'t subscribe for push notifications');
                        }

                        console.log('Done sending notifications!');
                    }
                }
            } else {
                console.log('Leave is still valid.');
            }
        }

        // Update status of pending leaves
        const threeDaysFromNow = moment().add(3, 'days').toDate();
        const pendingLeaves = await Leave.find({
            estimated: { $lte: threeDaysFromNow },
            status: 'submitted'
        });

        for (const pending of pendingLeaves) {
            pending.status = 'pending';
            await pending.save();
        }

        console.log('Invalid leaves updated:', invalidLeaves.length);
        console.log('Pending leaves updated:', pendingLeaves.length);
    } catch (error) {
        console.error('Error checking leave validity:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to update attendance at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running cron job to update attendance at midnight');
    updateAbsentAttendance();
    updateAttendanceForApprovedLeaves();
    updateTodayAttendance();
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to update attendance and clear QR codes at 11:59 PM
cron.schedule('59 23 * * *', async () => {
    console.log('Running cron job to update attendance and clear QR codes');

    try {
        await updateAttendanceEndOfDays();
        const clearQr = await QRCode.deleteMany();
        console.log(clearQr.deletedCount ? 'QR codes cleared' : 'QR codes not cleared');
    } catch (error) {
        console.error('Error updating attendance and clearing QR codes:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to clear QR code data at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running cron job to clear QR code data for today');
    clearQRCodeData();
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to update patrol unit status at 8 AM
cron.schedule('0 8 * * *', () => {
    console.log('Running cron job to update patrol unit status');

    const checkpointData = [
        { checkpointName: 'Mufti Residence', logReport: '', time: '' },
        { checkpointName: 'Encik Drahman Residence', logReport: '', time: '' },
        { checkpointName: 'Ceo Residence', logReport: '', time: '' },
        { checkpointName: 'Sicc', logReport: '', time: '' }
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
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Scheduler to close patrol reports at 5 PM
cron.schedule('0 17 * * *', async () => {
    console.log('Running cron job to update patrol unit status to Closed');

    try {
        const dateToday = moment().utcOffset(8).startOf('day').toDate();

        const patrolUnit = await PatrolAux.findOneAndUpdate(
            { date: dateToday, status: 'Open' },
            { $set: { status: 'Closed' } }
        );

        console.log(patrolUnit ? `Patrol Reports for date ${dateToday} updated and closed at 5 PM` : 'Failed to update patrol reports');
    } catch (error) {
        console.error('Error in scheduled task at 5 PM:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Kuala_Lumpur'
});

// Function to submit patrol unit data
const scheduler = async (data) => {
    try {
        const submitData = await PatrolAux.create(data);
        console.log(submitData ? 'Patrol unit submitted' : 'Error submitting patrol unit');
    } catch (error) {
        console.error('Error submitting patrol unit:', error);
    }
};

// ============================
// Functions
// ============================

// // * Get today's date formatted as 'DD/MM/YYYY'
// const getDateFormat1 = () => moment().utcOffset('+08:00').format('DD/MM/YYYY');

// // * Get a date formatted as 'YYYY-MM-DD' from a JavaScript Date object
// const getDateFormat3 = (date) => {
//     const formattedDate = moment(date).utcOffset('+08:00').format('YYYY-MM-DD');
//     return formattedDate;
// };

// // * Get the current time formatted as 'HH:mm A'
// const getCurrentTime = () => moment().utcOffset('+08:00').format('HH:mm A');

// * Calculate age based on birthdate
const calculateAge = (birthdate) => moment().utcOffset('+08:00').diff(moment(birthdate), 'years');

// * Default public holidays for the year
const defaultPublicHolidays = ['2024-02-16', '2024-05-01', '2024-05-07'];
const allPublicHolidays = defaultPublicHolidays.map(date => moment(date).startOf('day').toDate());

// * Check if a date is a public holiday
const isPublicHoliday = (date, holidays) => holidays.some(holiday => moment(date).isSame(moment(holiday), 'day'));

// * Calculate business days between two dates
const calculateBusinessDays = (startDateString, endDateString) => {
    const start = moment(startDateString).startOf('day');
    const end = moment(endDateString).startOf('day');
    const increment = start.isBefore(end) ? 1 : -1;
    let count = 0;

    while (start.isSameOrBefore(end)) {
        if (start.day() >= 1 && start.day() <= 5 && !isPublicHoliday(start.toDate(), allPublicHolidays)) {
            count++;
        }
        if (start.isSame(end)) break;
        start.add(increment, 'days');
    }

    return increment === -1 ? -count : count;
};

// * Check if a date is a weekend (Saturday or Sunday)
const isWeekend = (date) => moment(date).day() % 6 === 0;

// * Check if today is a holiday or weekend
const setOrCheckTodayHolidayOrWeekend = () => {
    const today = moment().utcOffset(8).startOf('day').toDate();
    const isHoliday = isPublicHoliday(today, defaultPublicHolidays);
    const isWeekendDay = isWeekend(today);
    return { isHoliday, isWeekend: isWeekendDay };
};

// * Check if today's date is between two given dates
const isDateInRange = (startDate, endDate) => {
    const currentDate = moment().utcOffset(8);
    return moment(startDate).utcOffset(8).startOf('day').isSameOrBefore(currentDate) &&
        currentDate.isSameOrBefore(moment(endDate).utcOffset(8).endOf('day'));
};

// * Get today's date formatted as 'D MMMM YYYY'
const getDateFormat2 = () => moment().utcOffset('+08:00').format('D MMMM YYYY');

// * Generate a unique identifier
const generateUniqueIdentifier = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// * Update attendance records at the end of the day for users who haven't signed out
const updateAttendanceEndOfDays = async () => {
    try {
        const todayStart = moment().utcOffset(8).startOf('day').toDate();
        const todayEnd = moment().utcOffset(8).endOf('day').toDate();

        const attendanceRecords = await Attendance.find({
            'date.signInTime': { $gte: todayStart, $lt: todayEnd },
            'date.signOutTime': null
        });

        await Promise.all(attendanceRecords.map(record => {
            record.status = 'Invalid';
            return record.save();
        }));

        console.log('Attendance updated at 11:59PM');
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
};

// * Update attendance records for approved leaves
const updateAttendanceForApprovedLeaves = async () => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        const approvedLeaves = await Leave.find({ status: 'approved' });

        const todayLeaves = approvedLeaves.filter(leave => isDateInRange(leave.date.start, leave.date.return));

        await Promise.all(todayLeaves.map(leave =>
            Attendance.findOneAndUpdate(
                {
                    user: leave.user,
                    timestamp: {
                        $gte: today,
                        $lte: moment().utcOffset(8).toDate()
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
            )
        ));

        console.log('Attendance records updated for leaves approved today');
    } catch (error) {
        console.error('Error updating attendance records:', error);
    }
};

// * Update today's attendance based on whether it is a holiday or weekend
const updateTodayAttendance = async () => {
    try {
        const todayStart = moment().utcOffset(8).startOf('day').toDate();
        const todayEnd = moment().utcOffset(8).endOf('day').toDate();
        const { isHoliday, isWeekend: isWeekendDay } = setOrCheckTodayHolidayOrWeekend();

        let updateType = '';
        let updateStatus = '';

        if (isWeekendDay) {
            updateType = 'weekend';
            updateStatus = 'Non Working Day';
        } else if (isHoliday) {
            updateType = 'public holiday';
            updateStatus = 'Non Working Day';
        }

        if (updateType && updateStatus) {
            await Attendance.updateMany(
                { timestamp: { $gte: todayStart, $lt: todayEnd } },
                { $set: { type: updateType, status: updateStatus } }
            );

            console.log(`Attendance records updated for ${updateType}: ${updateStatus}`);
        } else {
            console.log('Today is neither a weekend nor a public holiday.');
        }
    } catch (error) {
        console.error('Error updating attendance records:', error);
    }
};

// * Create attendance records for all users marking them as absent
const updateAbsentAttendance = async () => {
    try {
        const today = moment().utcOffset(8).startOf('day').toDate();

        const allUsers = await User.find();

        await Promise.all(allUsers.map(user =>
            new Attendance({
                user: user._id,
                type: 'invalid',
                'date.signInTime': null,
                'date.signOutTime': null,
                'location.signIn': null,
                'location.signOut': null,
                status: 'Absent',
                timestamp: today,
                remarks: 'No remarks added'
            }).save()
        ));

        console.log('Attendance records created for all users as absent');
    } catch (error) {
        console.error('Error creating attendance records for absent users:', error);
    }
};

// * Delete all QR code data from the QRCode and TempAttendance collections
const clearQRCodeData = async () => {
    try {
        const [qrResult, tempAttendanceResult] = await Promise.all([
            QRCode.deleteMany({}),
            TempAttendance.deleteMany({})
        ]);

        console.log(`Deleted ${qrResult.deletedCount} documents from the QRCode collection`);
        console.log(`Deleted ${tempAttendanceResult.deletedCount} documents from the temporary attendance`);
    } catch (error) {
        console.error('Error clearing QRCode data:', error);
    }
};

// * Location mappings for different sites
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
        { checkpointName: 'Genset Outside Building', time: '', logReport: '' },
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
        { checkpointName: 'Backside Mosque (cemetery)', time: '', logReport: '' },
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

// * Helper function to calculate cycle amounts
const calculateCycleAmount = (index) => index === 8 ? 8 : 4; // Example logic

// * Function to create a new patrol report
const createPatrolReport = async (dutyHandoverId, location, date, shift, startTime, selectedNames) => {
    const endTime = startTime === '0700' ? '1500' :
        startTime === '1500' ? '2300' : '0700';
    const cycleAmount = startTime === '2300' ? 8 : '';

    const checkpoints = locationMappings[location] || [];
    checkpoints.forEach(checkpoint => checkpoint.fullName = '');

    const cycles = [];
    const cycleAmounts = { '0700': 4, '1500': 4, '2300': 8 };
    const timeSlotIncrements = { '0700': 200, '1500': 200, '2300': 100 };

    const timeSlotIncrement = timeSlotIncrements[startTime];

    for (let i = 0; i < cycleAmounts[startTime]; i++) {
        const timeSlotStart = (parseInt(startTime, 10) + i * timeSlotIncrement) % 2400;
        const timeSlotEnd = (timeSlotStart + timeSlotIncrement) % 2400;

        cycles.push({
            cycleSeq: i + 1,
            cycleAmount: calculateCycleAmount(i + 1),
            timeSlot: `${timeSlotStart.toString().padStart(4, '0')}-${timeSlotEnd.toString().padStart(4, '0')}`,
            checkpoint: checkpoints
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

// * Function to get the total number of visitors today
const getTotalVisitorsToday = async () => {
    const today = moment().startOf('day').toDate();
    return await Vms.countDocuments({ time_in: { $gte: today } });
};

// * Function to get the total number of visitors who checked in today and have not checked out
const getTotalVisitorsTimeInToday = async () => {
    const today = moment().startOf('day').toDate();
    return await Vms.countDocuments({ time_in: { $gte: today }, time_out: null });
};

// * Function to get the total number of visitors who checked out today
const getTotalVisitorsTimeOutToday = async () => {
    const today = moment().startOf('day').toDate();
    return await Vms.countDocuments({ time_out: { $gte: today } });
};

// * Function to generate leave approvals based on the user grade/position
const generateApprovals = (
    user,
    headOfSection,
    headOfDepartment,
    depChiefExec,
    chiefExec,
    adminHR,
    assignee,
    supervisors,
    type
) => {
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

            if (supervisors && supervisors.length > 0) {
                supervisors.forEach(supervisorsItem => {
                    approvals.push({
                        recipient: supervisorsItem._id,
                        role: 'Supervisor',
                        status: 'pending',
                        comment: `Supervisor for leave by ${supervisorsItem.fullname}`,
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
            } else {
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
        } else if (user.isHeadOfDepartment === true) {
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
        } else if (user.username === 'P549' || user.username === 'P548') {
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
        } else {
            approvals.push({
                recipient: user._id,
                role: 'Staff',
                status: 'submitted',
                comment: 'Submitted leave request',
                timestamp: moment().utcOffset(8).toDate(),
                estimated: ''
            });

            if (supervisors && supervisors.length > 0) {
                supervisors.forEach(supervisorsItem => {
                    approvals.push({
                        recipient: supervisorsItem._id,
                        role: 'Supervisor',
                        status: 'pending',
                        comment: `Supervisor for leave by ${supervisorsItem.fullname}`,
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
                    console.log('Adding Relief Staff:', assigneeItem);
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

            if (supervisors && supervisors.length > 0) {
                supervisors.forEach(supervisorsItem => {
                    console.log('Adding Supervisor:', supervisorsItem);
                    approvals.push({
                        recipient: supervisorsItem._id,
                        role: 'Supervisor',
                        status: 'pending',
                        comment: `Supervisor for leave by ${supervisorsItem.fullname}`,
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
            } else {
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
        } else if (user.isHeadOfDepartment) {
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
        } else if (user.isChiefExec) {
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
        } else if (user.username === 'P549' || user.username === 'P548') {
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

            if (supervisors && supervisors.length > 0) {
                supervisors.forEach(supervisorsItem => {
                    approvals.push({
                        recipient: supervisorsItem._id,
                        role: 'Supervisor',
                        status: 'pending',
                        comment: `Supervisor for leave by ${supervisorsItem.fullname}`,
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

// Port initialization route - Port 5002
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
