import express from 'express';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { db } from '../db.js';

const router = express.Router();

// Memory store for user presence / active heartbeat (user id -> timestamp)
export const activeHeartbeats = new Map();

export function isUserOnline(userId) {
  const lastPing = activeHeartbeats.get(userId);
  if (!lastPing) return false;
  return Date.now() - lastPing < 30000; // active within last 30s
}

// All team routes require an authenticated user session
router.use(verifyToken);

// ============================================================================
// 1. GET /api/team/my-group - Student's Personal Team Hub Data
// ============================================================================
router.get('/my-group', async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Mark current user as online
    activeHeartbeats.set(user.id, Date.now());

    // If user is not assigned to any group
    if (!user.groupId) {
      return res.status(200).json({
        success: true,
        hasGroup: false,
        group: null,
        teammates: [],
        activities: [],
        messages: [],
      });
    }

    const group = await db.getGroupById(user.groupId);
    if (!group) {
      // Clean up orphaned reference if group was deleted
      await db.updateUser(user.id, { groupId: null, groupName: null });
      return res.status(200).json({
        success: true,
        hasGroup: false,
        group: null,
        teammates: [],
        activities: [],
        messages: [],
      });
    }

    // Fetch teammates
    const allUsers = await db.getUsers();
    const allUpdates = await db.getStudentUpdates();

    const teammates = allUsers
      .filter((u) => group.memberIds.includes(u.id))
      .map((u) => {
        // Find latest project update by this teammate
        const latestProj = allUpdates.find(
          (up) => up.studentEmail === u.email || up.studentName.toLowerCase() === u.fullName.toLowerCase()
        );

        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          department: u.department,
          avatarUrl: u.avatarUrl,
          isOnline: isUserOnline(u.id),
          isMe: u.id === user.id,
          latestProject: latestProj
            ? {
                title: latestProj.projectTitle,
                progress: latestProj.progressPercent,
                domain: latestProj.domain,
                status: latestProj.status,
                githubUrl: latestProj.githubUrl,
              }
            : null,
        };
      });

    // Fetch team activity feed (latest 30)
    const activities = await db.getTeamActivities(group.id, 30);

    // Fetch group chat messages (latest 50)
    const messages = await db.getGroupMessages(group.id);

    return res.status(200).json({
      success: true,
      hasGroup: true,
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        description: group.description,
        memberCount: teammates.length,
        maxCapacity: group.maxCapacity || 4,
        availableSeats: Math.max(0, (group.maxCapacity || 4) - teammates.length),
      },
      teammates,
      activities,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 2. GET /api/team/groups - List all existing groups with occupancy & available seats
// ============================================================================
router.get('/groups', async (req, res) => {
  try {
    const groups = await db.getGroups();
    const allUsers = await db.getUsers();

    const formattedGroups = groups.map((g) => {
      const members = allUsers
        .filter((u) => g.memberIds.includes(u.id))
        .map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          department: u.department,
        }));

      const maxCap = g.maxCapacity || 4;
      const count = members.length;
      const availableSeats = Math.max(0, maxCap - count);

      return {
        id: g.id,
        name: g.name,
        code: g.code,
        description: g.description,
        memberCount: count,
        maxCapacity: maxCap,
        availableSeats,
        isFull: count >= maxCap,
        members,
        createdAt: g.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedGroups.length,
      groups: formattedGroups,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 3. POST /api/team/groups - Create a new Group (Option B in Admin Dashboard)
// ============================================================================
router.post('/groups', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { name, description, studentId } = req.body;

    const allGroups = await db.getGroups();
    const nextNum = allGroups.length + 1;
    const groupName = name && name.trim() ? name.trim() : `Team Group ${nextNum}`;
    const groupCode = `GRP-${String(nextNum).padStart(2, '0')}`;

    const newGroup = await db.createGroup({
      name: groupName,
      code: groupCode,
      description: description || '',
      createdById: req.user.id,
      memberIds: [],
    });

    // If a studentId is provided during creation, add them
    if (studentId) {
      await db.addMemberToGroup(newGroup.id, studentId);
      newGroup.memberIds = [studentId];
    }

    // Broadcast group creation via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('group_created', newGroup);
    }

    return res.status(201).json({
      success: true,
      message: `Group "${newGroup.name}" created successfully.`,
      group: newGroup,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 4. POST /api/team/groups/:groupId/assign - Add student to Group (Option A)
// ============================================================================
router.post('/groups/:groupId/assign', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const student = await db.findUserById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // If student was already in a different group, remove them from that group first
    if (student.groupId && student.groupId !== groupId) {
      await db.removeMemberFromGroup(student.groupId, studentId);
    }

    const updatedGroup = await db.addMemberToGroup(groupId, studentId);

    // Create an automated team activity announcing the new member
    await db.createTeamActivity({
      groupId,
      userId: student.id,
      userName: student.fullName,
      userAvatar: student.avatarUrl || '',
      actionType: 'status_change',
      title: `${student.fullName} joined the team!`,
      details: `Allocated to ${updatedGroup.name} by Lead Coordinator.`,
    });

    // Broadcast WebSocket updates
    const io = req.app.get('io');
    if (io) {
      io.emit('team_updated', { groupId, studentId, action: 'member_added' });
      io.to(`user_${studentId}`).emit('my_group_changed', { groupId, groupName: updatedGroup.name });
    }

    return res.status(200).json({
      success: true,
      message: `Student ${student.fullName} successfully assigned to ${updatedGroup.name}.`,
      group: updatedGroup,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 5. POST /api/team/groups/:groupId/remove-member - Remove student from Group
// ============================================================================
router.post('/groups/:groupId/remove-member', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const updatedGroup = await db.removeMemberFromGroup(groupId, studentId);

    const io = req.app.get('io');
    if (io) {
      io.emit('team_updated', { groupId, studentId, action: 'member_removed' });
      io.to(`user_${studentId}`).emit('my_group_changed', { groupId: null, groupName: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Student removed from team group.',
      group: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 6. DELETE /api/team/groups/:groupId - Delete Group
// ============================================================================
router.delete('/groups/:groupId', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { groupId } = req.params;
    await db.deleteGroup(groupId);

    const io = req.app.get('io');
    if (io) {
      io.emit('group_deleted', { groupId });
    }

    return res.status(200).json({
      success: true,
      message: 'Team group deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 7. GET /api/team/messages/group/:groupId - Team Group Chat Messages
//    STRICT PRIVACY: Only group members or coordinators allowed
// ============================================================================
router.get('/messages/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await db.getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Backend-level Authorization Check:
    const isMember = group.memberIds.includes(req.user.id);
    const isCoordinator = req.user.role === 'coordinator';
    if (!isMember && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Access denied. Group chats are private to assigned team members.',
      });
    }

    const messages = await db.getGroupMessages(groupId);
    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 8. POST /api/team/messages/group/:groupId - Send Message to Team Group Chat
// ============================================================================
router.post('/messages/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const group = await db.getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Authorization check
    const isMember = group.memberIds.includes(req.user.id);
    const isCoordinator = req.user.role === 'coordinator';
    if (!isMember && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Access denied. You cannot post to a group you do not belong to.',
      });
    }

    const user = await db.findUserById(req.user.id);
    const newMsg = await db.createMessage({
      type: 'group',
      groupId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl || '',
      content: content.trim(),
      attachments: attachments || [],
    });

    // Real-time broadcast to group room
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('new_team_message', newMsg);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent.',
      chatMessage: newMsg,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 9. GET /api/team/messages/direct/:teammateId - Personal 1-on-1 Chat
//    STRICT PRIVACY: Only sender and recipient can access this conversation
// ============================================================================
router.get('/messages/direct/:teammateId', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { teammateId } = req.params;

    const teammate = await db.findUserById(teammateId);
    if (!teammate) {
      return res.status(404).json({ success: false, message: 'Teammate not found.' });
    }

    const currentUser = await db.findUserById(currentUserId);

    // Verify both are either in the same group, or coordinator
    const shareGroup = currentUser.groupId && currentUser.groupId === teammate.groupId;
    const isCoordinator = currentUser.role === 'coordinator' || teammate.role === 'coordinator';

    if (!shareGroup && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Direct messaging is only permitted between assigned teammates.',
      });
    }

    // Strictly fetch only messages between these two exact participants
    const messages = await db.getDirectMessages(currentUserId, teammateId);

    return res.status(200).json({
      success: true,
      count: messages.length,
      teammate: {
        id: teammate.id,
        fullName: teammate.fullName,
        email: teammate.email,
        avatarUrl: teammate.avatarUrl,
        department: teammate.department,
        isOnline: isUserOnline(teammate.id),
      },
      messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 10. POST /api/team/messages/direct/:teammateId - Send 1-on-1 Private Message
// ============================================================================
router.post('/messages/direct/:teammateId', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { teammateId } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const teammate = await db.findUserById(teammateId);
    if (!teammate) {
      return res.status(404).json({ success: false, message: 'Teammate not found.' });
    }

    const currentUser = await db.findUserById(currentUserId);
    const shareGroup = currentUser.groupId && currentUser.groupId === teammate.groupId;
    const isCoordinator = currentUser.role === 'coordinator' || teammate.role === 'coordinator';

    if (!shareGroup && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Direct messaging is only permitted between assigned teammates.',
      });
    }

    const newMsg = await db.createMessage({
      type: 'direct',
      groupId: currentUser.groupId || null,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderAvatar: currentUser.avatarUrl || '',
      recipientId: teammate.id,
      content: content.trim(),
      attachments: attachments || [],
    });

    // Real-time broadcast to both participants' private rooms
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${teammate.id}`).emit('new_direct_message', newMsg);
      io.to(`user_${currentUser.id}`).emit('new_direct_message', newMsg);
    }

    return res.status(201).json({
      success: true,
      message: 'Private message delivered.',
      chatMessage: newMsg,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 11. GET /api/team/activities/:groupId - Live Project Activity Feed
// ============================================================================
router.get('/activities/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await db.getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isMember = group.memberIds.includes(req.user.id);
    const isCoordinator = req.user.role === 'coordinator';
    if (!isMember && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Activity feeds are private to team members.',
      });
    }

    const activities = await db.getTeamActivities(groupId, 50);
    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 12. POST /api/team/activities/:groupId - Log Teammate Project Activity
//     (commits, code pushes, file updates, milestones)
// ============================================================================
router.post('/activities/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { actionType, title, details, link } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Activity title is required.' });
    }

    const group = await db.getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isMember = group.memberIds.includes(req.user.id);
    const isCoordinator = req.user.role === 'coordinator';
    if (!isMember && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: You can only post activities to your own team.',
      });
    }

    const user = await db.findUserById(req.user.id);
    const newAct = await db.createTeamActivity({
      groupId,
      userId: user.id,
      userName: user.fullName,
      userAvatar: user.avatarUrl || '',
      actionType: actionType || 'commit',
      title: title.trim(),
      details: details ? details.trim() : '',
      link: link ? link.trim() : '',
    });

    // Real-time broadcast to all teammates
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('new_team_activity', newAct);
    }

    return res.status(201).json({
      success: true,
      message: 'Project activity logged.',
      activity: newAct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// 13. POST /api/team/heartbeat - Realtime Online Presence Heartbeat
// ============================================================================
router.post('/heartbeat', async (req, res) => {
  try {
    const userId = req.user.id;
    activeHeartbeats.set(userId, Date.now());

    let onlineTeammateIds = [];
    if (req.user.groupId) {
      const group = await db.getGroupById(req.user.groupId);
      if (group) {
        onlineTeammateIds = group.memberIds.filter((id) => isUserOnline(id));
      }
    }

    return res.status(200).json({
      success: true,
      isOnline: true,
      onlineTeammateIds,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
