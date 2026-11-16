import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { encryptPassword } from '../utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup Multer Storage for Profile Photo Uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
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

// POST /api/auth/register - Passwords saved as Bcrypt Hash + AES-256 Vault Cipher
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const validRoles = ['student', 'coordinator', 'faculty'];
    const assignedRole = validRoles.includes(role) ? role : 'student';

    // 1. Cryptographic Bcrypt Hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Reversible AES-256 Vault Cipher (only decryptable by the coordinator)
    const vaultCipher = encryptPassword(password);

    const newUser = await db.createUser({
      email: email.trim().toLowerCase(),
      passwordHash,
      vaultCipher,
      fullName: fullName || email.split('@')[0],
      role: assignedRole,
      department: department || 'General Engineering',
      avatarUrl: '',
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'New credentials created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login - Verified using bcrypt.compare
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect. Please check the entered details and role selection.',
      });
    }

    // Secure cryptographic hash comparison
    const hashToCompare = user.passwordHash || user.password;
    const isPasswordMatch = await bcrypt.compare(password, hashToCompare);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect. Please check the entered details and role selection.',
      });
    }

    // Role check if specified by frontend portal - generic message avoids account/role enumeration
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect. Please check the entered details and role selection.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        permissions: user.permissions || {
          canBroadcastAnnouncements: user.role === 'coordinator',
          canReviewProjects: user.role === 'coordinator' || user.role === 'faculty',
          canAssignWork: user.role === 'coordinator' || user.role === 'faculty',
          canManageAccounts: user.role === 'coordinator',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        permissions: user.permissions || {
          canBroadcastAnnouncements: user.role === 'coordinator',
          canReviewProjects: user.role === 'coordinator' || user.role === 'faculty',
          canAssignWork: user.role === 'coordinator' || user.role === 'faculty',
          canManageAccounts: user.role === 'coordinator',
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/upload-avatar
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await db.updateUser(req.user.id, { avatarUrl });

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      avatarUrl,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/change-password - Secure password change for authenticated users
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Verify current password against stored Bcrypt hash
    const hashToCompare = user.passwordHash || user.password;
    const isCurrentMatch = await bcrypt.compare(currentPassword, hashToCompare);
    if (!isCurrentMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Hash new password with Bcrypt (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Reversible AES-256 Vault Cipher for coordinator
    const newVaultCipher = encryptPassword(newPassword);

    await db.updateUser(req.user.id, {
      passwordHash: newPasswordHash,
      vaultCipher: newVaultCipher,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/change-email - Secure email update for authenticated users
router.post('/change-email', verifyToken, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'New email address and current password are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();

    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.email.toLowerCase() === cleanNewEmail) {
      return res.status(400).json({
        success: false,
        message: 'The new email is identical to your current email.',
      });
    }

    // Check if new email is already claimed by another user
    const existing = await db.findUserByEmail(cleanNewEmail);
    if (existing && existing.id !== user.id) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Verify current password against stored Bcrypt hash
    const hashToCompare = user.passwordHash || user.password;
    const isCurrentMatch = await bcrypt.compare(currentPassword, hashToCompare);
    if (!isCurrentMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update user in DB
    const updated = await db.updateUser(user.id, { email: cleanNewEmail });
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update email in database.' });
    }

    // Generate new JWT token with updated email
    const token = generateToken(updated);

    return res.status(200).json({
      success: true,
      message: 'Email address updated successfully.',
      token,
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        department: updated.department,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/refresh-session - Resets the active session with a fresh 10-hour token
router.post('/refresh-session', verifyToken, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Session successfully renewed for another 10 hours.',
      token,
      expiresIn: 36000,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        permissions: user.permissions || {
          canBroadcastAnnouncements: user.role === 'coordinator',
          canReviewProjects: user.role === 'coordinator' || user.role === 'faculty',
          canAssignWork: user.role === 'coordinator' || user.role === 'faculty',
          canManageAccounts: user.role === 'coordinator',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
