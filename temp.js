const handleLeaveRequest = async (req, res) => {
    try {
        const { id, approval } = req.params;  // Extract leave ID and approval action from request parameters
        const user = req.user;  // Get the authenticated user from the request object
        const checkLeave = await Leave.findOne({ _id: id });  // Find the leave request by its ID

        if (!checkLeave) {  // If no leave request found, respond with a 404 error
            return res.status(404).send('Leave request not found.');
        }

        // Find the indices of approvals corresponding to the current user
        const recipientIndices = checkLeave.approvals
            .map((approval, index) => (approval.recipient.equals(user._id) ? index : -1))
            .filter(index => index !== -1);

        // Determine the action to take based on the approval status
        switch (approval) {
            case 'approved':
                await handleApproved(checkLeave, recipientIndices, user, res);
                break;
            case 'denied':
                await handleDenied(checkLeave, recipientIndices, user, res);
                break;
            case 'cancelled':
                await handleCancelled(checkLeave, user, res);
                break;
            case 'acknowledged':
                await handleAcknowledged(checkLeave, user, res);
                break;
            default:
                return res.status(400).send('Invalid approval status.');  // Respond with a 400 error for invalid actions
        }
    } catch (error) {
        console.error('Error handling leave request:', error);  // Log the error for debugging purposes
        res.status(500).send('Internal Server Error');  // Respond with a 500 error for any unexpected issues
    }
};

// Helper function for handling approved status
const handleApproved = async (checkLeave, recipientIndices, user, res) => {
    try {
        // Determine the index of the approval recipient to update
        let indexOfRecipient = recipientIndices[0];
        if (recipientIndices.length > 1) {
            indexOfRecipient = recipientIndices.find(index => checkLeave.approvals[index].timestamp === null);
        }

        const recipientApproval = checkLeave.approvals[indexOfRecipient];
        const role = recipientApproval.role;
        const isReliefStaff = role === 'Relief Staff';
        const isSupervisor = role === 'Supervisor';

        // Update leave approval status in the database
        await Leave.findOneAndUpdate(
            {
                _id: checkLeave._id, // Match the leave request ID
                'approvals.recipient': user._id, // Match the current user
                'approvals.timestamp': null // Ensure it's the correct approval (pending)
            },
            {
                $set: {
                    'approvals.$.status': 'approved', // Set status to approved
                    'approvals.$.comment': `The request has been approved by ${isReliefStaff || isSupervisor ? user.fullname : ''}`, // Add a comment
                    'approvals.$.timestamp': moment().utcOffset(8).toDate(), // Record the timestamp
                    status: 'pending' // Keep the overall status pending until all approvals are complete
                }
            },
            { new: true } // Return the updated document
        );

        // Determine the next approval recipient
        const nextIndex = indexOfRecipient + 1;
        const nextApprovalRecipientId = checkLeave.approvals[nextIndex]?.recipient;

        if (nextApprovalRecipientId) {
            // Create and save a new notification for the next recipient
            await createAndSendNotification(user, nextApprovalRecipientId, checkLeave._id);
            // Log the approval activity
            await logActivity(user._id, 'Leave application approved', 'Leave request', 'Approved a leave request');
            // Send an email notification to the next recipient
            await sendEmailNotification(nextApprovalRecipientId, user, checkLeave);

        } else {
            console.log('The leave has been approved by all recipients.');
        }

        // Redirect to leave details page after approval
        res.redirect(`/leave/details/${checkLeave._id}`);
    } catch (error) {
        console.error('Error handling approved leave request:', error);
        res.status(500).send('Internal Server Error');  // Handle any errors gracefully
    }
};


// Helper function for handling denied status
const handleDenied = async (checkLeave, recipientIndices, user, res) => {
    try {
        // Find the index of the recipient who denied the leave
        let indexOfRecipient = recipientIndices[0]; // Default to the first found recipient

        // If there are multiple recipients, choose the one with a null timestamp
        if (recipientIndices.length > 1) {
            indexOfRecipient = recipientIndices.find(index => checkLeave.approvals[index].timestamp === null);
        }

        // Update leave denial status
        await Leave.findOneAndUpdate(
            {
                _id: checkLeave._id,
                'approvals.recipient': user._id,
                'approvals.timestamp': null // Ensure to update the correct approval with null timestamp
            },
            {
                $set: {
                    'approvals.$.status': 'denied',
                    'approvals.$.comment': `The request has been denied by ${user.fullname}`,
                    'approvals.$.timestamp': moment().utcOffset(8).toDate(),
                    status: 'denied' // Update the overall leave status to denied
                }
            },
            { new: true }
        );

        // Log denial activity
        await logActivity(user._id, 'Leave application denied', 'Leave request', 'Denied a leave request');

        // Notify the requester about the denial
        const requesterId = checkLeave.user;
        await createAndSendNotification(user._id, requesterId, 'Leave', `/leave/details/${checkLeave._id}`, 'Your leave request has been denied.');

        // Send an email notification to the requester about the denial
        const requesterEmail = await User.findOne({ _id: requesterId });
        if (requesterEmail) {
            const emailData = {
                content: `The leave request has been denied by ${user.fullname} with work ID ${user.username}. Please click the button above to open the leave details.`,
                id: checkLeave._id,
            };
            await sendEmailNotification(requesterEmail.email, emailData);
        }

        // Redirect to the leave details page after denial
        res.redirect(`/leave/details/${checkLeave._id}`);
    } catch (error) {
        console.error('Error denying leave request:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Helper function for handling cancelled status
const handleCancelled = async (checkLeave, user, res) => {
    try {
        // Identifying the first and last recipient of the leave approval process
        const firstRecipientId = checkLeave.approvals[0].recipient;
        const lastRecipientId = checkLeave.approvals[checkLeave.approvals.length - 1].recipient;

        if (checkLeave.status === 'approved') {
            // Fetch user leave data to adjust leave balances upon cancellation
            const userLeave = await UserLeave.findOne({
                user: firstRecipientId
            });

            // Calculate the number of days affected by the leave using the provided function
            const daysDifference = calculateNumberOfDays(checkLeave.type, checkLeave.date.start, checkLeave.date.return, checkLeave.isNonOfficeHour);

            // Adjust leave balances based on the leave type and days difference
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
                    userLeave.sickExtended.taken = Math.max(0, userLeave.sickExtended.taken);
                    break;
                case 'Emergency Leave':
                    userLeave.annual.taken -= daysDifference;
                    userLeave.annual.taken = Math.max(0, userLeave.annual.taken);
                    userLeave.emergency.taken -= daysDifference;
                    userLeave.emergency.taken = Math.max(0, userLeave.emergency.taken);
                    break;
                case 'Attend Exam Leave':
                    userLeave.attendExam.leave += daysDifference;
                    userLeave.attendExam.leave = Math.max(0, userLeave.attendExam.leave);
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

            // Save the updated leave balances for the user
            await userLeave.save();
        }

        // Update the leave status to "cancelled" in the database
        await Leave.findOneAndUpdate(
            { _id: checkLeave._id },
            {
                $set: {
                    status: 'cancelled',
                    comment: `The request has been cancelled by the ${checkLeave.approvals[0].role} ${user.username}`
                }
            },
            { new: true }
        );

        // Notify the first and last recipients about the cancellation
        await createAndSendNotification(user._id, firstRecipientId, 'Leave approval', `/leave/details/${checkLeave._id}`, `This leave has been cancelled by ${user.fullname}`);
        await createAndSendNotification(user._id, lastRecipientId, 'Leave approval', `/leave/details/${checkLeave._id}`, `This leave has been cancelled by ${user.fullname}`);

        // Fetch subscriptions for the first recipient to send push notifications
        const subscriptions = await Subscriptions.find({ user: firstRecipientId });

        if (subscriptions) {
            // Send push notifications to all subscribers
            const sendNotificationPromises = subscriptions.map(async (subscription) => {
                const payload = JSON.stringify({
                    title: "Leave request",
                    body: "Leave request has been cancelled.",
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
            console.log('The user doesn’t subscribe for push notifications');
        }

        // Log the cancellation activity
        await logActivity(user._id, 'Leave cancelled', 'Leave approval', 'Cancel the leave request');

        // Send an email notification to the first recipient about the cancellation
        const firstRecipientEmail = await User.findOne({ _id: firstRecipientId });

        if (firstRecipientEmail) {
            const emailData = {
                content: `The leave request has been cancelled by ${user.fullname} with work ID ${user.username}. Please click the button above to open the leave details.`,
                id: checkLeave._id,
            };

            await sendEmailNotification(firstRecipientEmail.email, emailData);
        }

        console.log('The leave has been officially cancelled');
        res.redirect(`/leave/details/${checkLeave._id}`);
    } catch (error) {
        console.error('Error cancelling leave request:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Helper function for handling acknowledged status
const handleAcknowledged = async (checkLeave, user, res) => {
    try {
        // Find the index of the Human Resource recipient in the approvals array
        const humanResourceIndex = checkLeave.approvals.findIndex(
            approval => approval.recipient.section === 'Human Resource Management Division'
        );

        // Check if the previous approver has approved and the current user is an HR admin
        if (
            checkLeave.approvals[humanResourceIndex - 1].status === 'approved' &&
            user.isAdmin && user.section === 'Human Resource Management Division'
        ) {
            // Update the approval status of the HR recipient to 'approved'
            const findRecipient = await Leave.findOneAndUpdate(
                {
                    _id: checkLeave._id,
                    'approvals.recipient': checkLeave.approvals[humanResourceIndex].recipient
                },
                {
                    $set: {
                        'approvals.$.status': 'approved',
                        'approvals.$.comment': 'The request has been officially approved',
                        'approvals.$.timestamp': moment().utcOffset(8).toDate()
                    }
                },
                { new: true }
            );

            // Log if the recipient has been updated
            if (findRecipient) {
                console.log('The recipient has been updated', findRecipient);
            } else {
                console.log('No update was made');
            }

            // Fetch the ID of the first recipient in the approvals array
            const firstRecipientId = checkLeave.approvals[0].recipient;

            // Retrieve the leave details and user data for the first recipient
            const userLeave = await UserLeave.findOne({ user: firstRecipientId });
            const checkUser = await User.findById(firstRecipientId);

            const startDate = checkLeave.date.start;
            const returnDate = checkLeave.date.return;

            // Use calculateNumberOfDays to get the days difference
            const daysDifference = calculateNumberOfDays(
                checkLeave.type,
                startDate,
                returnDate,
                checkUser.isNonOfficeHour
            );

            // Update the user's leave balance based on the type of leave
            switch (checkLeave.type) {
                case 'Annual Leave':
                    userLeave.annual.taken += daysDifference;
                    break;
                case 'Sick Leave':
                    userLeave.sick.taken += daysDifference;
                    break;
                case 'Sick Extended Leave':
                    userLeave.sickExtended.taken += daysDifference;
                    break;
                case 'Emergency Leave':
                    userLeave.annual.taken += daysDifference;
                    userLeave.emergency.taken += daysDifference;
                    break;
                case 'Attend Exam Leave':
                    userLeave.attendExam.leave -= daysDifference;
                    userLeave.attendExam.taken += 1;
                    break;
                case 'Maternity Leave':
                    userLeave.maternity.leave -= daysDifference;
                    userLeave.maternity.taken += 1;
                    break;
                case 'Paternity Leave':
                    userLeave.paternity.leave -= daysDifference;
                    userLeave.paternity.taken += 1;
                    break;
                case 'Hajj Leave':
                    userLeave.hajj.taken += 1;
                    break;
                case 'Unpaid Leave':
                    userLeave.unpaid.taken += 1;
                    break;
                case 'Special Leave':
                    userLeave.special.taken += 1;
                    break;
                default:
                    console.log('Leave type does not require balance update.');
                    break;
            }

            // Save updated user leave data
            await userLeave.save();
        }

        res.redirect(`/leave/details/${checkLeave._id}`);
    } catch (error) {
        console.error('Error handling acknowledgment:', error);
        // Use your existing global error handler middleware
        next(error);
    }
};