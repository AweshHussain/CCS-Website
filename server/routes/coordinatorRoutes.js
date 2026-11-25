import express from 'express';
import { db } from '../db.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { isUserOnline, getOnlineUserIds } from '../presence.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ==============================================================
// 1. Student Work Updates
// ==============================================================

// GET /api/coordinator/student-updates - List all submitted projects
router.get('/student-updates', async (req, res) => {
  try {
    const updates = await db.getStudentUpdates();
    const enrichedUpdates = updates.map((u) => ({
      ...u,
      isOnline: isUserOnline(u.studentId),
    }));
    return res.status(200).json({
      success: true,
      count: enrichedUpdates.length,
      updates: enrichedUpdates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/coordinator/presence - Realtime online users presence roster
router.get('/presence', requireRoles(['coordinator']), async (req, res) => {
  try {
    const onlineUserIds = getOnlineUserIds();
    return res.status(200).json({
      success: true,
      onlineUserIds,
      count: onlineUserIds.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/student-updates/:id/status - Coordinator reviews submission
router.put('/student-updates/:id/status', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, coordinatorFeedback } = req.body;
    const coordinatorName = req.body.coordinatorName || req.user?.fullName || req.user?.email || 'Coordinator';

    const validStatuses = ['pending', 'approved', 'changes_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await db.updateStudentSubmissionStatus(id, status, coordinatorFeedback || '', coordinatorName);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Submission marked as ${status.replace('_', ' ').toUpperCase()}.`,
      submission: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/student-updates/:id - Update project details & milestone (Student or Coordinator)
router.put('/student-updates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectTitle, description, domain, githubUrl, demoUrl, progressPercent } = req.body;

    const updates = {};
    if (projectTitle) updates.projectTitle = projectTitle;
    if (description) updates.description = description;
    if (domain) updates.domain = domain;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (demoUrl !== undefined) updates.demoUrl = demoUrl;
    if (progressPercent !== undefined) updates.progressPercent = Number(progressPercent);
    updates.status = 'pending'; // Re-submit for review
    updates.updatedAt = new Date().toISOString();

    const updated = await db.updateStudentSubmission(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Project details and progress updated successfully.',
      submission: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/student-updates - Create a new work update
router.post('/student-updates', async (req, res) => {
  try {
    const { projectTitle, description, domain, githubUrl, demoUrl, progressPercent } = req.body;

    if (!projectTitle || !description) {
      return res.status(400).json({ success: false, message: 'Project title and description are required.' });
    }

    const newUpdate = await db.createStudentUpdate({
      studentName: req.user.fullName || 'Student Builder',
      studentEmail: req.user.email,
      department: req.user.department || 'Computer Science & Engineering',
      projectTitle,
      description,
      domain: domain || 'Full-Stack Systems',
      githubUrl: githubUrl || '',
      demoUrl: demoUrl || '',
      progressPercent: Number(progressPercent) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Project work update submitted successfully.',
      submission: newUpdate,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================
// 3. Portal Settings & Preferences
// ==============================================================

// GET /api/coordinator/settings - Fetch current settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/settings - Update portal settings (Coordinator only)
router.put('/settings', requireRoles(['coordinator']), async (req, res) => {
  try {
    const updates = req.body;
    const updated = await db.updateSettings(updates);
    return res.status(200).json({
      success: true,
      message: 'Portal configuration updated successfully.',
      settings: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================
// 4. Multi-Announcement Management (Live Updates)
// ==============================================================

// GET /api/coordinator/announcements - Fetch all active announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await db.getAnnouncements();
    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/announcements - Add new announcement (Coordinator or users with granted permission)
router.post('/announcements', async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    const hasAccess = req.user.role === 'coordinator' || user?.permissions?.canBroadcastAnnouncements;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Permission to broadcast announcements has not been granted by the coordinator.',
      });
    }

    const { message, target } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement text is required.' });
    }
    const validTargets = ['all', 'public', 'students', 'teams'];
    const selectedTarget = validTargets.includes(target) ? target : 'all';

    const created = await db.createAnnouncement({
      message: message.trim(),
      target: selectedTarget,
      authorName: req.user.fullName || (req.user.role === 'coordinator' ? 'Lead Coordinator' : 'Student Member'),
    });
    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement: created,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/coordinator/announcements/:id - Remove announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    const hasAccess = req.user.role === 'coordinator' || user?.permissions?.canBroadcastAnnouncements;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Permission to manage announcements has not been granted by the coordinator.',
      });
    }

    const { id } = req.params;
    await db.deleteAnnouncement(id);
    return res.status(200).json({
      success: true,
      message: 'Announcement removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================
// 5. Coordinator Assigned Work & Tasks (FCFS Queue System)
// ==============================================================

// GET /api/coordinator/assigned-work - List all assigned tasks
router.get('/assigned-work', async (req, res) => {
  try {
    const work = await db.getAssignedWork();
    const enrichedWork = work.map((w) => ({
      ...w,
      claimsQueue: (w.claimsQueue || []).map((c) => ({
        ...c,
        isOnline: isUserOnline(c.studentId),
      })),
    }));
    return res.status(200).json({
      success: true,
      count: enrichedWork.length,
      work: enrichedWork,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/assigned-work - Coordinator creates a work assignment directive
router.post('/assigned-work', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { title, description, domain, assignedTo, dueDate, priority, isOpenToAll, maxClaims } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const openToAll = isOpenToAll !== false;
    const capacity = maxClaims !== undefined ? Number(maxClaims) : 5;

    const created = await db.createAssignedWork({
      title: title.trim(),
      description: description.trim(),
      domain: domain || 'General Systems',
      assignedByName: req.user.fullName || 'Student Coordinator',
      assignedByEmail: req.user.email,
      assignedByRole: 'Student Coordinator',
      assignedTo: assignedTo || (openToAll ? 'All Students' : 'Target Engineering Squad'),
      isOpenToAll: openToAll,
      queueType: 'fcfs',
      maxClaims: capacity,
      claimsQueue: [],
      dueDate: dueDate || '',
      priority: priority || 'normal',
    });

    return res.status(201).json({
      success: true,
      message: 'Work task directive published with queue capacity enabled.',
      task: created,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/assigned-work/:id - Coordinator updates directive details
router.put('/assigned-work/:id', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, domain, assignedTo, dueDate, priority, isOpenToAll, maxClaims, status } = req.body;

    const updates = {};
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (domain) updates.domain = domain;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority) updates.priority = priority;
    if (isOpenToAll !== undefined) updates.isOpenToAll = Boolean(isOpenToAll);
    if (maxClaims !== undefined) updates.maxClaims = Number(maxClaims);
    if (status) updates.status = status;

    const updated = await db.updateAssignedWork(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task directive not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Task directive updated successfully.',
      task: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/assigned-work/:id/status - Update work assignment status
router.put('/assigned-work/:id/status', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['active', 'closed', 'completed', 'archived'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const updated = await db.updateAssignedWorkStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Task marked as ${status}.`,
      task: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/assigned-work/:id/claim - Student claims slot in FCFS queue
router.post('/assigned-work/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionId, notes } = req.body;

    const result = await db.claimAssignedWork(id, {
      studentId: req.user.id,
      studentName: req.user.fullName || 'Student Builder',
      studentEmail: req.user.email,
      department: req.user.department || 'Computer Science & Engineering',
      submissionId: submissionId || '',
      notes: notes || '',
    });

    return res.status(200).json({
      success: true,
      message: `Claim confirmed! You are position #${result.queuePosition} in the queue.`,
      task: result.task,
      queuePosition: result.queuePosition,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/assigned-work/:id/release-claim - Release claim slot
router.post('/assigned-work/:id/release-claim', async (req, res) => {
  try {
    const { id } = req.params;
    const targetStudentId = (req.user.role === 'coordinator' && req.body.studentId)
      ? req.body.studentId
      : req.user.id;

    const result = await db.releaseAssignedWorkClaim(id, targetStudentId);
    return res.status(200).json({
      success: true,
      message: 'Queue slot released successfully.',
      task: result.task,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/coordinator/assigned-work/:id - Delete assignment
router.delete('/assigned-work/:id', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteAssignedWork(id);
    return res.status(200).json({
      success: true,
      message: 'Assigned task removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/coordinator/system-status - Diagnostics & Database Connection Mode
router.get('/system-status', async (req, res) => {
  return res.status(200).json({
    success: true,
    isCloudConnected: db.isCloudConnected(),
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGODB_URI),
  });
});

export default router;
