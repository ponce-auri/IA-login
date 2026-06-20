const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- 1. Mongoose Setup ---
const readerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseReader = mongoose.model('Reader', readerSchema);

// --- 2. JSON Fallback Setup ---
const DB_FILE = path.join(__dirname, '../data/readers.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

const readReaders = () => {
  ensureDbDir();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeReaders = (readers) => {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(readers, null, 2));
};

const MockReader = {
  find: (query = {}) => {
    let readers = readReaders();

    if (Object.keys(query).length > 0) {
      readers = readers.filter(r => {
        for (let key in query) {
          if (r[key] !== query[key]) return false;
        }
        return true;
      });
    }

    return {
      sort: (sortCriteria) => {
        return readers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },
      then: (onResolve) => Promise.resolve(readers).then(onResolve),
      catch: (onReject) => Promise.resolve(readers).catch(onReject)
    };
  },

  findOne: async (query) => {
    const readers = readReaders();
    const found = readers.find(r => {
      for (let key in query) {
        if (key === 'email') {
          if (r.email.toLowerCase() !== query.email.toLowerCase()) return false;
        } else if (r[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found || null;
  },

  findById: async (id) => {
    const readers = readReaders();
    const found = readers.find(r => r._id === id.toString());
    return found || null;
  },

  create: async (data) => {
    const readers = readReaders();

    if (readers.some(r => r.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const newReader = {
      _id: Math.random().toString(36).substring(2, 9),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || '',
      address: data.address || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    readers.push(newReader);
    writeReaders(readers);
    return newReader;
  },

  findByIdAndUpdate: async (id, data, options = {}) => {
    const readers = readReaders();
    const idx = readers.findIndex(r => r._id === id.toString());
    if (idx === -1) return null;

    if (data.email && readers.some((r, i) => i !== idx && r.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const updatedReader = {
      ...readers[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    readers[idx] = updatedReader;
    writeReaders(readers);
    return updatedReader;
  },

  findByIdAndDelete: async (id) => {
    const readers = readReaders();
    const idx = readers.findIndex(r => r._id === id.toString());
    if (idx === -1) return null;
    const deleted = readers[idx];
    readers.splice(idx, 1);
    writeReaders(readers);
    return deleted;
  },

  countDocuments: async (query = {}) => {
    const readers = readReaders();
    if (Object.keys(query).length === 0) return readers.length;
    return readers.filter(r => {
      for (let key in query) {
        if (r[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }
};

// --- 3. Wrapper ---
const ReaderWrapper = {
  find: (query) => global.useMockDB ? MockReader.find(query) : MongooseReader.find(query),
  findOne: (query) => global.useMockDB ? MockReader.findOne(query) : MongooseReader.findOne(query),
  findById: (id) => global.useMockDB ? MockReader.findById(id) : MongooseReader.findById(id),
  create: (data) => global.useMockDB ? MockReader.create(data) : MongooseReader.create(data),
  findByIdAndUpdate: (id, data, options) => global.useMockDB ? MockReader.findByIdAndUpdate(id, data, options) : MongooseReader.findByIdAndUpdate(id, data, options),
  findByIdAndDelete: (id) => global.useMockDB ? MockReader.findByIdAndDelete(id) : MongooseReader.findByIdAndDelete(id),
  countDocuments: (query) => global.useMockDB ? MockReader.countDocuments(query) : MongooseReader.countDocuments(query),
};

module.exports = ReaderWrapper;
