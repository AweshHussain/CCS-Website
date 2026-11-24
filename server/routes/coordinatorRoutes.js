import express from 'express';
import { db } from '../db.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

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
    return res.status(200).json({
      success: true,
      count: updates.length,
      updates,
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

    const validStatuses = ['pending', 'approved', 'changes_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await db.updateStudentSubmissionStatus(id, status, coordinatorFeedback || '');
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
// 2. Faculty Queries & Advisory Directives
// ==============================================================

// GET /api/coordinator/faculty-queries - List all incoming faculty queries
router.get('/faculty-queries', async (req, res) => {
  try {
    const queries = await db.getFacultyQueries();
    return res.status(200).json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/faculty-queries/:id/resolve - Coordinator responds/resolves query
router.put('/faculty-queries/:id/resolve', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, coordinatorResponse } = req.body;

    const validStatuses = ['open', 'in_review', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (coordinatorResponse !== undefined) updates.coordinatorResponse = coordinatorResponse;
    if (status === 'resolved') updates.resolvedAt = new Date().toISOString();

    const updated = await db.updateFacultyQuery(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Faculty query not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty query updated successfully.',
      query: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/faculty-queries - Submit a new faculty query or directive
router.post('/faculty-queries', requireRoles(['faculty', 'coordinator']), async (req, res) => {
  try {
    const { subject, message, priority, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }

    const newQuery = await db.createFacultyQuery({
      facultyName: req.user.fullName || 'Faculty Member',
      facultyEmail: req.user.email,
      department: req.user.department || 'Advisory Council',
      subject,
      message,
      priority: priority || 'normal',
      category: category || 'General Directive',
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty query submitted to coordinator desk.',
      query: newQuery,
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

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement text is required.' });
    }
    const created = await db.createAnnouncement({
      message: message.trim(),
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
// 5. Faculty Assigned Work & Tasks
// ==============================================================

// GET /api/coordinator/assigned-work - List all assigned tasks
router.get('/assigned-work', async (req, res) => {
  try {
    const work = await db.getAssignedWork();
    return res.status(200).json({
      success: true,
      count: work.length,
      work,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coordinator/assigned-work - Coordinator creates a work assignment
router.post('/assigned-work', requireRoles(['coordinator']), async (req, res) => {
  try {
    const { title, description, domain, assignedTo, dueDate, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const created = await db.createAssignedWork({
      title: title.trim(),
      description: description.trim(),
      domain: domain || 'General Systems',
      assignedByName: req.user.fullName || 'Student Coordinator',
      assignedByEmail: req.user.email,
      assignedTo: assignedTo || 'All Students',
      dueDate: dueDate || '',
      priority: priority || 'normal',
    });

    return res.status(201).json({
      success: true,
      message: 'Work task assigned successfully to students.',
      task: created,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/coordinator/assigned-work/:id/status - Update work assignment status
router.put('/assigned-work/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['active', 'completed', 'archived'];
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

export default router;
