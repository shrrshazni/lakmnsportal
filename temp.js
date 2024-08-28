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