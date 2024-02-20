console.log(numberOfDays);
                    console.log(
                        'Sufficient sick leave balance for the requested duration'
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