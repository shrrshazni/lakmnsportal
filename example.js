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
    }
];