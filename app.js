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
  isChiefExec: { type: Boolean, default: false },
  isDeputyChiefExec: { type: Boolean, default: false },
  isHeadOfDepartment: { type: Boolean, default: false },
  isHeadOfSection: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isOfficer: { type: Boolean, default: false },
  isManagement: { type: Boolean, default: false },
  isPersonalAssistant: { type: Boolean, default: false },
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
  const userLeave = await UserLeave.findOne({ user: user._id })
    .populate('user')
    .exec();
  const leave = await Leave.find({ user: user._id });
  const task = await Task.find({ assignee: { $in: [user._id] } })
    .sort({ timestamp: -1 })
    .populate('assignee')
    .exec();
  const file = await File.find();

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
        section: 'Administration and Human Resource Management Division',
        _id: { $ne: user._id }
      });
      const userLeave = await UserLeave.findOne({ user: user._id })
        .populate('user')
        .exec();
      // find assignee
      const assignee = await User.find({ fullname: { $in: selectedNames } });
      // leave for the user
      const leave = await Leave.find({ user: user._id });

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
              assignee
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
              assignee
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
                assignee
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
                assignee
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
              assignee
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
                assignee
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
                assignee
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
                assignee
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
                assignee
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
                assignee
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
                assignee
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
          adminHR
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

        Leave.create(leave);
        console.log('Leave request submitted');

        const currentLeave = await Leave.findOne({fileId:uuid});

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
        const otherTaskHome = await Task.find({
          assignee: { $ne: [user._id] }
        });
        const otherActivitiesHome = await Activity.find();

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
          userLeave: userLeave,
          leave: leave,
          tasks: taskHome,
          files: fileHome,
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
  }).populate('sender');

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
  }).populate('sender');

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

    console.log(indexOfRecipient !== -1 &&
        checkLeave.approvals[indexOfRecipient].status);

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
        if (
          indexOfRecipient !== -1 &&
          checkLeave.approvals[indexOfRecipient].status === 'approved'
        ) {
          if (user.isAdmin === true) {
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
              daysDifference = Math.ceil(
                timeDifference / (1000 * 60 * 60 * 24)
              );
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
                userLeave.emergency.taken = Math.max(
                  0,
                  userLeave.emergency.taken
                );
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
                userLeave.maternity.leave = Math.max(
                  0,
                  userLeave.maternity.leave
                );
                userLeave.maternity.taken = userLeave.maternity.taken + 1;
                break;

              case 'Paternity Leave':
                userLeave.paternity.leave -= daysDifference;
                userLeave.paternity.leave = Math.max(
                  0,
                  userLeave.paternity.leave
                );
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
            res.redirect('/leave/details/' + id);
          }
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
  assignee
) {
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
