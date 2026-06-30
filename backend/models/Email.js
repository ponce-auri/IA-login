const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- 1. Mongoose Setup ---
const emailSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    actionUrl: {
      type: String,
    },
    actionText: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseEmail = mongoose.model('Email', emailSchema);

// --- 2. JSON Fallback Setup ---
const DB_FILE = path.join(__dirname, '../data/emails.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

const readEmails = () => {
  ensureDbDir();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeEmails = (emails) => {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(emails, null, 2));
};

const MockEmail = {
  create: async (data) => {
    const emails = readEmails();
    const newEmail = {
      _id: Math.random().toString(36).substring(2, 9),
      to: data.to,
      subject: data.subject,
      body: data.body,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    emails.push(newEmail);
    writeEmails(emails);
    return newEmail;
  },
  
  find: () => {
    const execute = () => {
      return readEmails();
    };
    const queryObj = {
      sort: function(criteria) {
        const sorted = execute().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
          then: (onResolve) => Promise.resolve(sorted).then(onResolve),
          catch: (onReject) => Promise.resolve(sorted).catch(onReject)
        };
      },
      then: (onResolve) => Promise.resolve(execute()).then(onResolve),
      catch: (onReject) => Promise.resolve(execute()).catch(onReject)
    };
    return queryObj;
  },

  deleteMany: async (query) => {
    writeEmails([]);
    return { deletedCount: 0 };
  }
};

// --- 3. Wrapper ---
const EmailWrapper = {
  create: (data) => global.useMockDB ? MockEmail.create(data) : MongooseEmail.create(data),
  find: () => global.useMockDB ? MockEmail.find() : MongooseEmail.find(),
  deleteMany: (query) => global.useMockDB ? MockEmail.deleteMany(query) : MongooseEmail.deleteMany(query),
};

module.exports = EmailWrapper;
