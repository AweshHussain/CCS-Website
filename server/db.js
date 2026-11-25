import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { encryptPassword } from './utils/crypto.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_USERS_FILE = path.join(DATA_DIR, 'users.json');
const DB_UPDATES_FILE = path.join(DATA_DIR, 'student_updates.json');
const DB_SETTINGS_FILE = path.join(DATA_DIR, 'portal_settings.json');
const DB_ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');
const DB_ASSIGNED_WORK_FILE = path.join(DATA_DIR, 'assigned_work.json');
const DB_GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const DB_MESSAGES_FILE = path.join(DATA_DIR, 'team_messages.json');
const DB_ACTIVITIES_FILE = path.join(DATA_DIR, 'team_activities.json');

// Ensure local data directory exists for offline fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. User Schema for MongoDB Atlas
// -------------------------------------------------------------
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    vaultCipher: { type: String },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['coordinator', 'student'], default: 'student' },
    department: { type: String, default: 'General Engineering' },
    avatarUrl: { type: String, default: '' },
    groupId: { type: String, default: null },
    groupName: { type: String, default: null },
    permissions: {
      type: Object,
      default: () => ({
        canBroadcastAnnouncements: false,
        canReviewProjects: false,
        canAssignWork: false,
        canManageAccounts: false,
      }),
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_users' }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// -------------------------------------------------------------
// 2. Student Work & Project Updates Schema
// -------------------------------------------------------------
const studentUpdateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    department: { type: String, default: 'Computer Science & Engineering' },
    projectTitle: { type: String, required: true },
    description: { type: String, required: true },
    domain: { type: String, default: 'Full-Stack Systems' },
    githubUrl: { type: String, default: '' },
    demoUrl: { type: String, default: '' },
    progressPercent: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'changes_requested'], default: 'pending' },
    coordinatorFeedback: { type: String, default: '' },
    coordinatorName: { type: String, default: '' },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_student_updates' }
);

export const StudentUpdateModel = mongoose.models.StudentUpdate || mongoose.model('StudentUpdate', studentUpdateSchema);

// -------------------------------------------------------------
// 3. Portal Settings & Preferences Schema
// -------------------------------------------------------------
const portalSettingsSchema = new mongoose.Schema(
  {
    id: { type: String, default: 'main_settings', unique: true },
    societyName: { type: String, default: 'Code & Compute Society (CCS)' },
    announcementBanner: { type: String, default: '🚀 Hackathon Season 2026 Submissions are now officially open!' },
    isBannerActive: { type: Boolean, default: true },
    submissionSeasonOpen: { type: Boolean, default: true },
    allowedRegistrationDomain: { type: String, default: 'All Domains' },
    notifyOnStudentSubmission: { type: Boolean, default: true },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_portal_settings' }
);

export const PortalSettingsModel = mongoose.models.PortalSettings || mongoose.model('PortalSettings', portalSettingsSchema);

// -------------------------------------------------------------
// 5. Announcements Schema for MongoDB Atlas
// -------------------------------------------------------------
const announcementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    message: { type: String, required: true },
    target: { type: String, enum: ['all', 'public', 'students', 'teams'], default: 'all' },
    authorName: { type: String, default: 'Student Coordinator' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_announcements' }
);

export const AnnouncementModel = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

// -------------------------------------------------------------
// 6. Assigned Work Schema for MongoDB Atlas (Coordinators assign work to Students with FCFS Queue)
// -------------------------------------------------------------
const assignedWorkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    domain: { type: String, default: 'General Systems' },
    assignedByName: { type: String, required: true },
    assignedByEmail: { type: String, required: true },
    assignedByRole: { type: String, default: 'Student Coordinator' },
    assignedTo: { type: String, default: 'All Students' },
    isOpenToAll: { type: Boolean, default: true },
    queueType: { type: String, default: 'fcfs' },
    maxClaims: { type: Number, default: 5 },
    claimsQueue: [
      {
        studentId: String,
        studentName: String,
        studentEmail: String,
        department: String,
        claimedAt: { type: String, default: () => new Date().toISOString() },
        submissionId: String,
        status: { type: String, default: 'claimed' },
        notes: String,
      },
    ],
    dueDate: { type: String, default: '' },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    status: { type: String, enum: ['active', 'closed', 'completed', 'archived'], default: 'active' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_assigned_work' }
);

export const AssignedWorkModel = mongoose.models.AssignedWork || mongoose.model('AssignedWork', assignedWorkSchema);

// -------------------------------------------------------------
// 7. Team Groups Schema (Max 4 students per group)
// -------------------------------------------------------------
const groupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, default: 'GRP' },
    description: { type: String, default: '' },
    memberIds: { type: [String], default: [] },
    maxCapacity: { type: Number, default: 4 },
    createdById: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_groups' }
);

export const GroupModel = mongoose.models.Group || mongoose.model('Group', groupSchema);

// -------------------------------------------------------------
// 8. Team Messages Schema (Group & Direct Private Messaging)
// -------------------------------------------------------------
const teamMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['group', 'direct'], default: 'group', index: true },
    groupId: { type: String, default: null, index: true },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: '' },
    recipientId: { type: String, default: null, index: true },
    content: { type: String, required: true },
    attachments: { type: Array, default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_team_messages' }
);

export const TeamMessageModel = mongoose.models.TeamMessage || mongoose.model('TeamMessage', teamMessageSchema);

// -------------------------------------------------------------
// 9. Team Live Activity Feed Schema
// -------------------------------------------------------------
const teamActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    actionType: { type: String, enum: ['commit', 'push', 'file_update', 'milestone', 'status_change', 'general'], default: 'commit' },
    title: { type: String, required: true },
    details: { type: String, default: '' },
    link: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'ccs_team_activities' }
);

export const TeamActivityModel = mongoose.models.TeamActivity || mongoose.model('TeamActivity', teamActivitySchema);

// -------------------------------------------------------------
// Seed Data
// -------------------------------------------------------------
export const SEED_USERS = [
  {
    id: 'user-coordinator-1',
    email: 'coordinator@ccs-society.org',
    passwordHash: '$2b$10$pIkMbTnVgm8/ZIzlviFIlOWbdYXXW3uoiPk71bmY.t5c6j/EXjXMm',
    vaultCipher: encryptPassword('Admin@CCS2026!'),
    fullName: 'Awesh Hussain',
    role: 'coordinator',
    department: 'Executive Leadership & Full-Stack Core',
    avatarUrl: '/assets/team/awesh.png',
    createdAt: '2026-11-15T06:30:10.260Z',
  },
  {
    id: 'user-student-1',
    email: 'student@ccs-society.org',
    passwordHash: '$2b$10$zhsZd5Pl7vXO26S5esklKu3uwPOkkvgfsESc4ZTNKPdXmxWrHc.f.',
    vaultCipher: encryptPassword('Student@CCS2026!'),
    fullName: 'Aarav Mehta',
    role: 'student',
    department: 'Artificial Intelligence & Data Science',
    avatarUrl: '',
    groupId: 'group-1',
    groupName: 'Team Alpha — Distributed Core',
    createdAt: '2026-11-15T06:30:10.263Z',
  },
];

export const SEED_STUDENT_UPDATES = [
  {
    id: 'update-1',
    studentName: 'Aarav Mehta',
    studentEmail: 'aarav.mehta@ccs-society.org',
    department: 'Artificial Intelligence & Data Science',
    projectTitle: 'NeuroMesh — Distributed Vector Indexing Engine',
    description: 'Designed an HNSW-based vector indexing microservice capable of performing k-NN search across 500k vectors in under 4ms for our internal society knowledge base.',
    domain: 'AI/ML Systems',
    githubUrl: 'https://github.com/ccs-society/neuromesh',
    demoUrl: 'https://neuromesh.ccs-society.org',
    progressPercent: 85,
    status: 'pending',
    coordinatorFeedback: '',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'update-2',
    studentName: 'Riya Sen',
    studentEmail: 'riya.sen@institution.edu',
    department: 'Computer Science & Engineering',
    projectTitle: 'QuantumKey — Post-Quantum TLS Handshake Proxy',
    description: 'Implemented ML-KEM (Kyber-768) lattice-based key exchange over HTTP/2 proxy to secure internal telemetry between campus microservices.',
    domain: 'Cybersecurity & Crypto',
    githubUrl: 'https://github.com/ccs-society/quantum-key',
    demoUrl: 'https://quantumkey.ccs-society.org',
    progressPercent: 100,
    status: 'approved',
    coordinatorFeedback: 'Approved for deployment on campus staging cluster.',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'update-3',
    studentName: 'Tanmay Verma',
    studentEmail: 'tanmay.v@institution.edu',
    department: 'Information Technology',
    projectTitle: 'AetherPulse — Real-Time IoT Telemetry Mesh',
    description: 'MQTT broker integrated with WebSockets delivering sensor telemetry from campus IoT boards with sub-10ms latency.',
    domain: 'Cloud & Distributed Systems',
    githubUrl: 'https://github.com/ccs-society/aether-pulse',
    demoUrl: 'https://aetherpulse.ccs-society.org',
    progressPercent: 60,
    status: 'changes_requested',
    coordinatorFeedback: 'Please add automated integration tests for broker reconnection edge cases before merge.',
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'update-4',
    studentName: 'Md. Arsalan',
    studentEmail: 'arsalan01@gmail.com',
    department: 'Software Engineering',
    projectTitle: 'CCS Canvas — Interactive 3D Architecture Visualizer',
    description: 'Three.js WebGL canvas tool to map out system diagrams and distributed data pipelines with draggable obsidian nodes.',
    domain: 'Full-Stack & 3D Web',
    githubUrl: 'https://github.com/ccs-society/ccs-canvas',
    demoUrl: 'https://canvas.ccs-society.org',
    progressPercent: 75,
    status: 'pending',
    coordinatorFeedback: '',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS = {
  id: 'main_settings',
  societyName: 'Code & Compute Society (CCS)',
  announcementBanner: '🚀 Hackathon Season 2026 Submissions are now officially open!',
  isBannerActive: true,
  submissionSeasonOpen: true,
  allowedRegistrationDomain: 'All Domains',
  notifyOnStudentSubmission: true,
  updatedAt: new Date().toISOString(),
};

export const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann-seed-1',
    message: 'Registrations closing tonight at 11:59 PM!',
    authorName: 'Awesh Hussain (Student Coordinator)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-seed-2',
    message: '🚀 Hackathon Season 2026 Submissions are now officially open!',
    authorName: 'Awesh Hussain (Student Coordinator)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const SEED_ASSIGNED_WORK = [
  {
    id: 'work-seed-1',
    title: 'Implement Multi-Agent LLM Orchestration with RAG',
    description: 'Design and benchmark a distributed retrieval-augmented pipeline using LangChain/LlamaIndex. Submit demo link and GitHub repository with latency and accuracy benchmarks.',
    domain: 'Artificial Intelligence & Systems',
    assignedByName: 'Awesh Hussain',
    assignedByEmail: 'coordinator@ccs-society.org',
    assignedByRole: 'Student Coordinator',
    assignedTo: 'All Students',
    isOpenToAll: true,
    queueType: 'fcfs',
    maxClaims: 3,
    claimsQueue: [],
    dueDate: '2026-11-30',
    priority: 'high',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'work-seed-2',
    title: 'Distributed WebSocket State Synchronizer',
    description: 'Develop a high-throughput WebSocket broadcast system with Redis pub/sub backplane to handle concurrent student terminal updates.',
    domain: 'Cloud Infrastructure & Networks',
    assignedByName: 'Awesh Hussain',
    assignedByEmail: 'coordinator@ccs-society.org',
    assignedByRole: 'Student Coordinator',
    assignedTo: 'All Students',
    isOpenToAll: true,
    queueType: 'fcfs',
    maxClaims: 5,
    claimsQueue: [],
    dueDate: '2026-12-05',
    priority: 'normal',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export const SEED_GROUPS = [
  {
    id: 'group-1',
    name: 'Team Alpha — Distributed Core',
    code: 'GRP-01',
    description: 'High-throughput distributed systems, vector indexing, and real-time mesh pipelines.',
    memberIds: ['user-student-1'],
    maxCapacity: 4,
    createdById: 'user-coordinator-1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'group-2',
    name: 'Team Beta — AI & Intelligence',
    code: 'GRP-02',
    description: 'Autonomous multi-agent orchestration, RAG architectures, and model quantization.',
    memberIds: [],
    maxCapacity: 4,
    createdById: 'user-coordinator-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_TEAM_MESSAGES = [
  {
    id: 'msg-seed-1',
    type: 'group',
    groupId: 'group-1',
    senderId: 'user-student-1',
    senderName: 'Aarav Mehta',
    senderAvatar: '',
    content: 'Welcome team! I have initialized the repository and set up the base vector indexing pipeline.',
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'msg-seed-2',
    type: 'group',
    groupId: 'group-1',
    senderId: 'user-coordinator-1',
    senderName: 'Awesh Hussain',
    senderAvatar: '/assets/team/awesh.png',
    content: 'Great initiative Team Alpha. Keep pushing updates to the repo and track your milestones here.',
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export const SEED_TEAM_ACTIVITIES = [
  {
    id: 'act-seed-1',
    groupId: 'group-1',
    userId: 'user-student-1',
    userName: 'Aarav Mehta',
    userAvatar: '',
    actionType: 'commit',
    title: 'Pushed commit 4f9a2b1 — HNSW indexing core',
    details: 'Added vector normalization and SIMD cosine distance calculations in src/engine.',
    link: 'https://github.com/ccs-society/neuromesh',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'act-seed-2',
    groupId: 'group-1',
    userId: 'user-student-1',
    userName: 'Aarav Mehta',
    userAvatar: '',
    actionType: 'milestone',
    title: 'Completed Milestone: Baseline k-NN benchmark passed',
    details: 'Achieved 3.8ms latency across 500k test vectors on staging node.',
    link: 'https://neuromesh.ccs-society.org',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

let isMongoConnected = false;

// -------------------------------------------------------------
// Local JSON File Helpers
// -------------------------------------------------------------
function readJson(file, defaultData) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultData;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err.message);
  }
}

/**
 * Connect to MongoDB Atlas (CCS-Cluster) with automatic seeding & fallback
 */
export async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ [Database] MONGODB_URI not found. Using local JSON store.');
    return false;
  }

  try {
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`📡 [Database] Connecting to MongoDB Atlas: ${maskedUri}`);

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    isMongoConnected = true;
    console.log('🟢 [Database] Connected successfully to MongoDB Atlas (CCS-Cluster)!');

    // 1. Seed Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('📦 [Database] Seeding initial accounts into MongoDB Atlas ccs_users...');
      const localUsers = readJson(DB_USERS_FILE, SEED_USERS);
      await UserModel.insertMany(localUsers.length > 0 ? localUsers : SEED_USERS);
    }

    // 2. Seed Student Updates
    const updateCount = await StudentUpdateModel.countDocuments();
    if (updateCount === 0) {
      console.log('📦 [Database] Seeding student project updates into MongoDB Atlas...');
      await StudentUpdateModel.insertMany(SEED_STUDENT_UPDATES);
    }

    // 4. Seed Portal Settings
    const settingsDoc = await PortalSettingsModel.findOne({ id: 'main_settings' });
    if (!settingsDoc) {
      await PortalSettingsModel.create(DEFAULT_SETTINGS);
    }

    // 5. Seed Announcements
    const announcementCount = await AnnouncementModel.countDocuments();
    if (announcementCount === 0) {
      console.log('📦 [Database] Seeding announcements into MongoDB Atlas...');
      await AnnouncementModel.insertMany(SEED_ANNOUNCEMENTS);
    }

    // 6. Seed Assigned Work
    const assignedWorkCount = await AssignedWorkModel.countDocuments();
    if (assignedWorkCount === 0) {
      console.log('📦 [Database] Seeding assigned work tasks into MongoDB Atlas...');
      await AssignedWorkModel.insertMany(SEED_ASSIGNED_WORK);
    } else {
      // Auto-migrate any existing records with Dr. Rajesh Sharma or missing FCFS fields
      await AssignedWorkModel.updateMany(
        { assignedByName: 'Dr. Rajesh Sharma' },
        {
          $set: {
            assignedByName: 'Awesh Hussain',
            assignedByRole: 'Student Coordinator',
            assignedByEmail: 'coordinator@ccs-society.org',
            assignedTo: 'All Students (FCFS Queue)',
            isOpenToAll: true,
            queueType: 'fcfs',
          },
        }
      );
      await AssignedWorkModel.updateMany(
        { claimsQueue: { $exists: false } },
        { $set: { claimsQueue: [], isOpenToAll: true, queueType: 'fcfs', maxClaims: 5 } }
      );
    }

    // 7. Seed Groups
    const groupCount = await GroupModel.countDocuments();
    if (groupCount === 0) {
      console.log('📦 [Database] Seeding team groups into MongoDB Atlas...');
      await GroupModel.insertMany(SEED_GROUPS);
    }

    // 8. Seed Team Messages
    const messageCount = await TeamMessageModel.countDocuments();
    if (messageCount === 0) {
      console.log('📦 [Database] Seeding initial team messages into MongoDB Atlas...');
      await TeamMessageModel.insertMany(SEED_TEAM_MESSAGES);
    }

    // 9. Seed Team Activities
    const activityCount = await TeamActivityModel.countDocuments();
    if (activityCount === 0) {
      console.log('📦 [Database] Seeding initial team activities into MongoDB Atlas...');
      await TeamActivityModel.insertMany(SEED_TEAM_ACTIVITIES);
    }

    console.log('✅ [Database] All cloud collections initialized and synchronized.');
    return true;
  } catch (err) {
    console.error('❌ [Database] MongoDB Atlas connection error:', err.message);
    console.log('⚠️ [Database] Falling back to persistent local storage.');
    isMongoConnected = false;
    return false;
  }
}

// -------------------------------------------------------------
// Unified Database Access Object
// -------------------------------------------------------------
export const db = {
  isCloudConnected: () => isMongoConnected,

  // --- Users ---
  getUsers: async () => {
    if (isMongoConnected) {
      try {
        return await UserModel.find({}).lean();
      } catch (err) {
        console.error('Mongo getUsers error, using local fallback:', err.message);
      }
    }
    return readJson(DB_USERS_FILE, SEED_USERS);
  },

  findUserByEmail: async (email) => {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected) {
      try {
        return await UserModel.findOne({ email: cleanEmail }).lean();
      } catch (err) {
        console.error('Mongo findUserByEmail error:', err.message);
      }
    }
    const local = readJson(DB_USERS_FILE, SEED_USERS);
    return local.find((u) => u.email.toLowerCase() === cleanEmail);
  },

  findUserById: async (id) => {
    if (!id) return null;
    if (isMongoConnected) {
      try {
        return await UserModel.findOne({ id }).lean();
      } catch (err) {
        console.error('Mongo findUserById error:', err.message);
      }
    }
    const local = readJson(DB_USERS_FILE, SEED_USERS);
    return local.find((u) => u.id === id);
  },

  createUser: async (userData) => {
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarUrl: '',
      ...userData,
    };

    if (isMongoConnected) {
      try {
        const created = await UserModel.create(newUser);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createUser error:', err.message);
      }
    }

    const local = readJson(DB_USERS_FILE, SEED_USERS);
    local.push(newUser);
    writeJson(DB_USERS_FILE, local);
    return newUser;
  },

  updateUser: async (id, updates) => {
    if (isMongoConnected) {
      try {
        const updated = await UserModel.findOneAndUpdate(
          { id },
          { ...updates, updatedAt: new Date().toISOString() },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateUser error:', err.message);
      }
    }

    const local = readJson(DB_USERS_FILE, SEED_USERS);
    const idx = local.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(DB_USERS_FILE, local);
    return local[idx];
  },

  deleteUser: async (id) => {
    if (isMongoConnected) {
      try {
        const res = await UserModel.deleteOne({ id });
        if (res.deletedCount > 0) return true;
      } catch (err) {
        console.error('Mongo deleteUser error:', err.message);
      }
    }

    const local = readJson(DB_USERS_FILE, SEED_USERS);
    const filtered = local.filter((u) => u.id !== id);
    if (filtered.length === local.length) return false;
    writeJson(DB_USERS_FILE, filtered);
    return true;
  },

  // --- Student Work Updates ---
  getStudentUpdates: async () => {
    if (isMongoConnected) {
      try {
        return await StudentUpdateModel.find({}).sort({ submittedAt: -1 }).lean();
      } catch (err) {
        console.error('Mongo getStudentUpdates error:', err.message);
      }
    }
    return readJson(DB_UPDATES_FILE, SEED_STUDENT_UPDATES);
  },

  getStudentUpdateById: async (id) => {
    if (!id) return null;
    if (isMongoConnected) {
      try {
        return await StudentUpdateModel.findOne({ id }).lean();
      } catch (err) {
        console.error('Mongo getStudentUpdateById error:', err.message);
      }
    }
    const local = readJson(DB_UPDATES_FILE, SEED_STUDENT_UPDATES);
    return local.find((s) => s.id === id) || null;
  },

  updateStudentSubmissionStatus: async (id, status, coordinatorFeedback = '', coordinatorName = '') => {
    if (isMongoConnected) {
      try {
        const updated = await StudentUpdateModel.findOneAndUpdate(
          { id },
          { status, coordinatorFeedback, coordinatorName, updatedAt: new Date().toISOString() },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateStudentSubmissionStatus error:', err.message);
      }
    }

    const local = readJson(DB_UPDATES_FILE, SEED_STUDENT_UPDATES);
    const idx = local.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    local[idx].status = status;
    local[idx].coordinatorFeedback = coordinatorFeedback;
    if (coordinatorName) {
      local[idx].coordinatorName = coordinatorName;
    }
    local[idx].updatedAt = new Date().toISOString();
    writeJson(DB_UPDATES_FILE, local);
    return local[idx];
  },

  updateStudentSubmission: async (id, updates) => {
    if (isMongoConnected) {
      try {
        const updated = await StudentUpdateModel.findOneAndUpdate(
          { id },
          { ...updates, updatedAt: new Date().toISOString() },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateStudentSubmission error:', err.message);
      }
    }

    const local = readJson(DB_UPDATES_FILE, SEED_STUDENT_UPDATES);
    const idx = local.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(DB_UPDATES_FILE, local);
    return local[idx];
  },

  createStudentUpdate: async (data) => {
    const newUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      coordinatorFeedback: '',
      ...data,
    };

    if (isMongoConnected) {
      try {
        const created = await StudentUpdateModel.create(newUpdate);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createStudentUpdate error:', err.message);
      }
    }

    const local = readJson(DB_UPDATES_FILE, SEED_STUDENT_UPDATES);
    local.unshift(newUpdate);
    writeJson(DB_UPDATES_FILE, local);
    return newUpdate;
  },

  // --- Portal Settings ---
  getSettings: async () => {
    if (isMongoConnected) {
      try {
        const doc = await PortalSettingsModel.findOne({ id: 'main_settings' }).lean();
        if (doc) return doc;
      } catch (err) {
        console.error('Mongo getSettings error:', err.message);
      }
    }
    return readJson(DB_SETTINGS_FILE, DEFAULT_SETTINGS);
  },

  updateSettings: async (updates) => {
    if (isMongoConnected) {
      try {
        const updated = await PortalSettingsModel.findOneAndUpdate(
          { id: 'main_settings' },
          { ...updates, updatedAt: new Date().toISOString() },
          { new: true, upsert: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateSettings error:', err.message);
      }
    }

    const local = readJson(DB_SETTINGS_FILE, DEFAULT_SETTINGS);
    const newSettings = { ...local, ...updates, updatedAt: new Date().toISOString() };
    writeJson(DB_SETTINGS_FILE, newSettings);
    return newSettings;
  },

  // --- Announcements ---
  getAnnouncements: async () => {
    if (isMongoConnected) {
      try {
        return await AnnouncementModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (err) {
        console.error('Mongo getAnnouncements error:', err.message);
      }
    }
    return readJson(DB_ANNOUNCEMENTS_FILE, SEED_ANNOUNCEMENTS);
  },

  createAnnouncement: async ({ message, authorName, target = 'all' }) => {
    const newAnn = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      message,
      target: target || 'all',
      authorName: authorName || 'Student Coordinator',
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      try {
        const created = await AnnouncementModel.create(newAnn);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createAnnouncement error:', err.message);
      }
    }

    const local = readJson(DB_ANNOUNCEMENTS_FILE, SEED_ANNOUNCEMENTS);
    local.unshift(newAnn);
    writeJson(DB_ANNOUNCEMENTS_FILE, local);
    return newAnn;
  },

  deleteAnnouncement: async (id) => {
    if (isMongoConnected) {
      try {
        await AnnouncementModel.deleteOne({ id });
        return true;
      } catch (err) {
        console.error('Mongo deleteAnnouncement error:', err.message);
      }
    }

    const local = readJson(DB_ANNOUNCEMENTS_FILE, SEED_ANNOUNCEMENTS);
    const filtered = local.filter((a) => a.id !== id);
    writeJson(DB_ANNOUNCEMENTS_FILE, filtered);
    return true;
  },

  // --- Assigned Work & Directives (FCFS Queue Enabled) ---
  getAssignedWork: async () => {
    const sanitizeWork = (items) =>
      items.map((w) => ({
        ...w,
        isOpenToAll: w.isOpenToAll !== undefined ? w.isOpenToAll : true,
        queueType: w.queueType || 'fcfs',
        maxClaims: w.maxClaims !== undefined ? w.maxClaims : 5,
        claimsQueue: Array.isArray(w.claimsQueue) ? w.claimsQueue : [],
        assignedByRole: w.assignedByRole || 'Student Coordinator',
      }));

    if (isMongoConnected) {
      try {
        const docs = await AssignedWorkModel.find({}).sort({ createdAt: -1 }).lean();
        return sanitizeWork(docs);
      } catch (err) {
        console.error('Mongo getAssignedWork error:', err.message);
      }
    }
    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    return sanitizeWork(local);
  },

  createAssignedWork: async (data) => {
    const newWork = {
      id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      isOpenToAll: data.isOpenToAll !== undefined ? data.isOpenToAll : true,
      queueType: 'fcfs',
      maxClaims: data.maxClaims !== undefined ? Number(data.maxClaims) : 5,
      claimsQueue: [],
      assignedByRole: data.assignedByRole || 'Student Coordinator',
      ...data,
    };

    if (isMongoConnected) {
      try {
        const created = await AssignedWorkModel.create(newWork);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createAssignedWork error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    local.unshift(newWork);
    writeJson(DB_ASSIGNED_WORK_FILE, local);
    return newWork;
  },

  updateAssignedWork: async (id, updates) => {
    if (isMongoConnected) {
      try {
        const updated = await AssignedWorkModel.findOneAndUpdate(
          { id },
          { $set: updates },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateAssignedWork error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    const idx = local.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(DB_ASSIGNED_WORK_FILE, local);
    return local[idx];
  },

  updateAssignedWorkStatus: async (id, status) => {
    if (isMongoConnected) {
      try {
        const updated = await AssignedWorkModel.findOneAndUpdate(
          { id },
          { status },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateAssignedWorkStatus error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    const idx = local.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    local[idx].status = status;
    writeJson(DB_ASSIGNED_WORK_FILE, local);
    return local[idx];
  },

  deleteAssignedWork: async (id) => {
    if (isMongoConnected) {
      try {
        await AssignedWorkModel.deleteOne({ id });
        return true;
      } catch (err) {
        console.error('Mongo deleteAssignedWork error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    const filtered = local.filter((w) => w.id !== id);
    writeJson(DB_ASSIGNED_WORK_FILE, filtered);
    return true;
  },

  // First-Come, First-Served (FCFS) Claim Slot for Assigned Work
  claimAssignedWork: async (id, studentData) => {
    let task = null;

    if (isMongoConnected) {
      try {
        task = await AssignedWorkModel.findOne({ id }).lean();
      } catch (err) {
        console.error('Mongo claimAssignedWork find error:', err.message);
      }
    }

    if (!task) {
      const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
      task = local.find((w) => w.id === id);
    }

    if (!task) {
      throw new Error('Task directive not found.');
    }

    if (task.status === 'closed' || task.status === 'archived') {
      throw new Error('This task directive is closed and no longer accepting claims.');
    }

    const claims = Array.isArray(task.claimsQueue) ? [...task.claimsQueue] : [];

    // Check if student already claimed
    const existingIndex = claims.findIndex(
      (c) => c.studentId === studentData.studentId || c.studentEmail === studentData.studentEmail
    );
    if (existingIndex !== -1) {
      throw new Error(`You have already secured a slot in this queue (#${existingIndex + 1}).`);
    }

    const maxCapacity = task.maxClaims !== undefined ? Number(task.maxClaims) : 5;
    if (maxCapacity > 0 && claims.length >= maxCapacity) {
      throw new Error(`Queue is full for this directive (Capacity: ${maxCapacity} slots claimed).`);
    }

    const newClaim = {
      studentId: studentData.studentId,
      studentName: studentData.studentName || 'Student Builder',
      studentEmail: studentData.studentEmail || '',
      department: studentData.department || 'Computer Science & Engineering',
      claimedAt: new Date().toISOString(),
      submissionId: studentData.submissionId || '',
      status: studentData.submissionId ? 'submitted' : 'claimed',
      notes: studentData.notes || '',
    };

    claims.push(newClaim);
    const queuePosition = claims.length;

    if (isMongoConnected) {
      try {
        const updated = await AssignedWorkModel.findOneAndUpdate(
          { id },
          { $set: { claimsQueue: claims } },
          { new: true }
        ).lean();
        return { task: updated || { ...task, claimsQueue: claims }, queuePosition };
      } catch (err) {
        console.error('Mongo claimAssignedWork update error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    const idx = local.findIndex((w) => w.id === id);
    if (idx !== -1) {
      local[idx].claimsQueue = claims;
      writeJson(DB_ASSIGNED_WORK_FILE, local);
      return { task: local[idx], queuePosition };
    }

    return { task: { ...task, claimsQueue: claims }, queuePosition };
  },

  // Release FCFS Claim Slot
  releaseAssignedWorkClaim: async (id, studentId) => {
    let task = null;

    if (isMongoConnected) {
      try {
        task = await AssignedWorkModel.findOne({ id }).lean();
      } catch (err) {
        console.error('Mongo releaseAssignedWorkClaim find error:', err.message);
      }
    }

    if (!task) {
      const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
      task = local.find((w) => w.id === id);
    }

    if (!task) {
      throw new Error('Task directive not found.');
    }

    const claims = (Array.isArray(task.claimsQueue) ? task.claimsQueue : []).filter(
      (c) => c.studentId !== studentId
    );

    if (isMongoConnected) {
      try {
        const updated = await AssignedWorkModel.findOneAndUpdate(
          { id },
          { $set: { claimsQueue: claims } },
          { new: true }
        ).lean();
        return { success: true, task: updated || { ...task, claimsQueue: claims } };
      } catch (err) {
        console.error('Mongo releaseAssignedWorkClaim error:', err.message);
      }
    }

    const local = readJson(DB_ASSIGNED_WORK_FILE, SEED_ASSIGNED_WORK);
    const idx = local.findIndex((w) => w.id === id);
    if (idx !== -1) {
      local[idx].claimsQueue = claims;
      writeJson(DB_ASSIGNED_WORK_FILE, local);
      return { success: true, task: local[idx] };
    }

    return { success: true, task: { ...task, claimsQueue: claims } };
  },

  // -------------------------------------------------------------
  // --- Team Groups Management (Max 4 students per group) ---
  // -------------------------------------------------------------
  getGroups: async () => {
    if (isMongoConnected) {
      try {
        return await GroupModel.find({}).sort({ createdAt: 1 }).lean();
      } catch (err) {
        console.error('Mongo getGroups error:', err.message);
      }
    }
    return readJson(DB_GROUPS_FILE, SEED_GROUPS);
  },

  getGroupById: async (id) => {
    if (isMongoConnected) {
      try {
        const found = await GroupModel.findOne({ id }).lean();
        if (found) return found;
      } catch (err) {
        console.error('Mongo getGroupById error:', err.message);
      }
    }
    const local = readJson(DB_GROUPS_FILE, SEED_GROUPS);
    return local.find((g) => g.id === id) || null;
  },

  createGroup: async (data) => {
    const allGroups = await db.getGroups();
    const count = allGroups.length + 1;
    const code = data.code || `GRP-${String(count).padStart(2, '0')}`;
    const newGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name || `Team Group ${count}`,
      code,
      description: data.description || '',
      memberIds: Array.isArray(data.memberIds) ? data.memberIds.slice(0, 4) : [],
      maxCapacity: 4,
      createdById: data.createdById || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      try {
        const created = await GroupModel.create(newGroup);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createGroup error:', err.message);
      }
    }

    const local = readJson(DB_GROUPS_FILE, SEED_GROUPS);
    local.push(newGroup);
    writeJson(DB_GROUPS_FILE, local);
    return newGroup;
  },

  updateGroup: async (id, updates) => {
    updates.updatedAt = new Date().toISOString();
    if (isMongoConnected) {
      try {
        const updated = await GroupModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
        if (updated) return updated;
      } catch (err) {
        console.error('Mongo updateGroup error:', err.message);
      }
    }

    const local = readJson(DB_GROUPS_FILE, SEED_GROUPS);
    const idx = local.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    local[idx] = { ...local[idx], ...updates };
    writeJson(DB_GROUPS_FILE, local);
    return local[idx];
  },

  deleteGroup: async (id) => {
    // 1. Unassign all users from this group
    const users = await db.getUsers();
    for (const u of users) {
      if (u.groupId === id) {
        await db.updateUser(u.id, { groupId: null, groupName: null });
      }
    }

    if (isMongoConnected) {
      try {
        await GroupModel.deleteOne({ id });
        return true;
      } catch (err) {
        console.error('Mongo deleteGroup error:', err.message);
      }
    }

    const local = readJson(DB_GROUPS_FILE, SEED_GROUPS);
    const filtered = local.filter((g) => g.id !== id);
    writeJson(DB_GROUPS_FILE, filtered);
    return true;
  },

  addMemberToGroup: async (groupId, studentId) => {
    const group = await db.getGroupById(groupId);
    if (!group) throw new Error('Target group not found.');

    if (group.memberIds.includes(studentId)) {
      return group; // already a member
    }

    if (group.memberIds.length >= 4) {
      throw new Error(`Group "${group.name}" is already at maximum capacity of 4 students.`);
    }

    const updatedMembers = [...group.memberIds, studentId];
    const updatedGroup = await db.updateGroup(groupId, { memberIds: updatedMembers });

    // Update student's user record
    await db.updateUser(studentId, {
      groupId: group.id,
      groupName: group.name,
    });

    return updatedGroup;
  },

  removeMemberFromGroup: async (groupId, studentId) => {
    const group = await db.getGroupById(groupId);
    if (!group) return null;

    const updatedMembers = group.memberIds.filter((m) => m !== studentId);
    const updatedGroup = await db.updateGroup(groupId, { memberIds: updatedMembers });

    // Clear student's group
    await db.updateUser(studentId, {
      groupId: null,
      groupName: null,
    });

    return updatedGroup;
  },

  // -------------------------------------------------------------
  // --- Team Messages (Group & Direct Private Messaging) ---
  // -------------------------------------------------------------
  getGroupMessages: async (groupId) => {
    if (isMongoConnected) {
      try {
        return await TeamMessageModel.find({ type: 'group', groupId }).sort({ createdAt: 1 }).lean();
      } catch (err) {
        console.error('Mongo getGroupMessages error:', err.message);
      }
    }
    const local = readJson(DB_MESSAGES_FILE, SEED_TEAM_MESSAGES);
    return local
      .filter((m) => m.type === 'group' && m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getDirectMessages: async (user1Id, user2Id) => {
    if (isMongoConnected) {
      try {
        return await TeamMessageModel.find({
          type: 'direct',
          $or: [
            { senderId: user1Id, recipientId: user2Id },
            { senderId: user2Id, recipientId: user1Id },
          ],
        })
          .sort({ createdAt: 1 })
          .lean();
      } catch (err) {
        console.error('Mongo getDirectMessages error:', err.message);
      }
    }
    const local = readJson(DB_MESSAGES_FILE, SEED_TEAM_MESSAGES);
    return local
      .filter(
        (m) =>
          m.type === 'direct' &&
          ((m.senderId === user1Id && m.recipientId === user2Id) ||
            (m.senderId === user2Id && m.recipientId === user1Id))
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  createMessage: async (data) => {
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      attachments: [],
      ...data,
    };

    if (isMongoConnected) {
      try {
        const created = await TeamMessageModel.create(newMsg);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createMessage error:', err.message);
      }
    }

    const local = readJson(DB_MESSAGES_FILE, SEED_TEAM_MESSAGES);
    local.push(newMsg);
    writeJson(DB_MESSAGES_FILE, local);
    return newMsg;
  },

  // -------------------------------------------------------------
  // --- Team Live Activity Feed ---
  // -------------------------------------------------------------
  getTeamActivities: async (groupId, limit = 50) => {
    if (isMongoConnected) {
      try {
        return await TeamActivityModel.find({ groupId })
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean();
      } catch (err) {
        console.error('Mongo getTeamActivities error:', err.message);
      }
    }
    const local = readJson(DB_ACTIVITIES_FILE, SEED_TEAM_ACTIVITIES);
    return local
      .filter((a) => a.groupId === groupId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  createTeamActivity: async (data) => {
    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actionType: 'commit',
      details: '',
      link: '',
      ...data,
    };

    if (isMongoConnected) {
      try {
        const created = await TeamActivityModel.create(newAct);
        return created.toObject();
      } catch (err) {
        console.error('Mongo createTeamActivity error:', err.message);
      }
    }

    const local = readJson(DB_ACTIVITIES_FILE, SEED_TEAM_ACTIVITIES);
    local.unshift(newAct);
    writeJson(DB_ACTIVITIES_FILE, local);
    return newAct;
  },
};
