import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { encryptPassword, decryptPassword } from '../utils/crypto.js';
import { isUserOnline } from '../presence.js';
import { sendWelcomeCredentialsEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `avatar-${uniqueSuffix}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const mime = file.mimetype;
    if (allowed.test(ext) && (mime.startsWith('image/') || allowed.test(mime))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed.'));
    }
  },
});

const router = express.Router();

// All routes here require authentication as 'coordinator'
router.use(verifyToken);
router.use(requireRoles(['coordinator']));

// GET /api/admin/users - List all users
// Passwords in DB are stored as Bcrypt hashes.
// For the Lead Coordinator only, decrypted plaintext is populated from the AES-256 secure vault.
router.get('/users', async (req, res) => {
  try {
    const isCoordinator = req.user && req.user.role === 'coordinator';
    const users = await db.getUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => {
        let plainPassword = undefined;
        if (isCoordinator && u.vaultCipher) {
          plainPassword = decryptPassword(u.vaultCipher);
        }

        return {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash || u.password, // Cryptographic hash stored in DB
          password: plainPassword, // Visible ONLY to Lead Coordinator ("me")
          fullName: u.fullName,
          role: u.role,
          department: u.department,
          avatarUrl: u.avatarUrl,
          groupId: u.groupId || null,
          groupName: u.groupName || null,
          permissions: u.permissions || {
            canBroadcastAnnouncements: u.role === 'coordinator',
            canReviewProjects: u.role === 'coordinator',
            canAssignWork: u.role === 'coordinator',
            canManageAccounts: u.role === 'coordinator',
          },
          isOnline: isUserOnline(u.id),
          createdAt: u.createdAt,
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/users - Admin directly creates an account, storing password as BCRYPT HASH + AES-256 VAULT CIPHER
router.post('/users', async (req, res) => {
  try {
    const { email, password, fullName, role, department, groupOption, existingGroupId, newGroupName, sendEmail } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const validRoles = ['student', 'coordinator'];
    const assignedRole = validRoles.includes(role) ? role : 'student';

    // Hash the password with bcrypt (10 rounds salt) for authentication
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Encrypt with AES-256 for Coordinator-only reveal vault
    const vaultCipher = encryptPassword(password);

    const newUser = await db.createUser({
      email: email.trim().toLowerCase(),
      passwordHash, // Saved strictly as bcrypt hash
      vaultCipher, // Encrypted AES-256 cipher (visible only to coordinator)
      fullName: fullName || email.split('@')[0],
      role: assignedRole,
      department: department || 'General Engineering',
      avatarUrl: '',
      groupId: null,
      groupName: null,
    });

    // Handle Team Group Assignment Options (For Students)
    if (assignedRole === 'student') {
      if (groupOption === 'existing' && existingGroupId) {
        try {
          await db.addMemberToGroup(existingGroupId, newUser.id);
          const grp = await db.getGroupById(existingGroupId);
          newUser.groupId = existingGroupId;
          newUser.groupName = grp?.name || null;
        } catch (grpErr) {
          console.warn('Group assignment warning:', grpErr.message);
        }
      } else if (groupOption === 'new') {
        try {
          const allGroups = await db.getGroups();
          const count = allGroups.length + 1;
          const groupName = newGroupName && newGroupName.trim() ? newGroupName.trim() : `Team Group ${count}`;
          const newGroup = await db.createGroup({
            name: groupName,
            createdById: req.user.id,
          });
          await db.addMemberToGroup(newGroup.id, newUser.id);
          newUser.groupId = newGroup.id;
          newUser.groupName = newGroup.name;
        } catch (grpErr) {
          console.warn('New group creation warning:', grpErr.message);
        }
      }
    }

    // Optional: Dispatch Welcome Email with credentials on behalf of current coordinator
    let emailResult = null;
    if (sendEmail !== false) {
      try {
        emailResult = await sendWelcomeCredentialsEmail({
          recipientEmail: newUser.email,
          recipientName: newUser.fullName,
          role: assignedRole,
          plainPassword: password,
          coordinatorName: req.user.fullName || 'Lead Coordinator',
          coordinatorRole: req.user.role === 'coordinator' ? 'Student Coordinator' : 'Society Coordinator',
          coordinatorEmail: req.user.email,
        });
      } catch (mailErr) {
        console.warn('Welcome email dispatch warning:', mailErr.message);
        emailResult = { success: false, error: mailErr.message };
      }
    }

    return res.status(201).json({
      success: true,
      message: `New credentials created for ${newUser.fullName} (${assignedRole}).${emailResult?.success ? ' Welcome email dispatched!' : ''}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        groupId: newUser.groupId || null,
        groupName: newUser.groupName || null,
        passwordHash: newUser.passwordHash,
      },
      // Plain password returned so admin can immediately copy and provide to student
      issuedPassword: password,
      emailDispatched: emailResult?.success || false,
      emailSimulated: emailResult?.simulated || false,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id - Update user details or reset password (hashed)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, fullName, role, department, avatarUrl, permissions, groupId } = req.body;

    const existing = await db.findUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = {};
    if (email) updates.email = email.trim().toLowerCase();
    if (fullName) updates.fullName = fullName;
    if (role) updates.role = role;
    if (department) updates.department = department;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (permissions !== undefined) updates.permissions = permissions;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
      updates.vaultCipher = encryptPassword(password);
    }

    // Handle group re-assignment / un-assignment
    if (groupId !== undefined && groupId !== existing.groupId) {
      if (existing.groupId) {
        await db.removeMemberFromGroup(existing.groupId, id);
      }
      if (groupId) {
        const targetGroup = await db.addMemberToGroup(groupId, id);
        updates.groupId = targetGroup.id;
        updates.groupName = targetGroup.name;
      } else {
        updates.groupId = null;
        updates.groupName = null;
      }
    }

    const updated = await db.updateUser(id, updates);

    return res.status(200).json({
      success: true,
      message: 'User credentials updated successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        department: updated.department,
        avatarUrl: updated.avatarUrl,
        groupId: updated.groupId || null,
        groupName: updated.groupName || null,
        permissions: updated.permissions,
        passwordHash: updated.passwordHash,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/users/:id/permissions - Coordinator updates granular permissions for a user
router.patch('/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const existing = await db.findUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentPermissions = existing.permissions || {};
    const updatedPermissions = { ...currentPermissions, ...permissions };

    const updated = await db.updateUser(id, { permissions: updatedPermissions });

    return res.status(200).json({
      success: true,
      message: `Permissions updated successfully for ${existing.fullName}.`,
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        permissions: updated.permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/users/:id/avatar - Upload photo file for any user
router.post('/users/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const avatarUrl = req.file.buffer
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : `/uploads/avatars/${req.file.filename}`;
    const updated = await db.updateUser(id, { avatarUrl });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      avatarUrl,
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// POST /api/admin/users/:id/resend-credentials - Resend Welcome Email
// ============================================================================
router.post('/users/:id/resend-credentials', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let plainPassword = '';
    if (user.vaultCipher) {
      try {
        plainPassword = decryptPassword(user.vaultCipher);
      } catch (decErr) {
        console.warn('Decrypt password error:', decErr.message);
      }
    }

    if (!plainPassword) {
      return res.status(400).json({
        success: false,
        message: 'Decrypted password is not available in vault for this user. You can update their password and resend.',
      });
    }

    const emailResult = await sendWelcomeCredentialsEmail({
      recipientEmail: user.email,
      recipientName: user.fullName,
      role: user.role,
      plainPassword,
      coordinatorName: req.user.fullName || 'Lead Coordinator',
      coordinatorRole: req.user.role === 'coordinator' ? 'Student Coordinator' : 'Society Coordinator',
      coordinatorEmail: req.user.email,
    });

    return res.status(200).json({
      success: true,
      message: emailResult.simulated
        ? `Credentials email logged to console (SMTP not configured). Recipient: ${user.email}`
        : `Credentials email dispatched successfully to ${user.email}!`,
      emailDispatched: emailResult.success,
      emailSimulated: emailResult.simulated || false,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete an account
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteUser(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'User account removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
