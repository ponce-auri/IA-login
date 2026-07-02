const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// --- 1. Mongoose Setup ---
const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
    },
    faceDescriptor: {
      type: [Number],
      default: undefined,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

// --- 2. JSON Fallback Setup ---
const DB_FILE = path.join(__dirname, '../data/users.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

const readUsers = () => {
  ensureDbDir();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeUsers = (users) => {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

const wrapUserInstance = (u) => {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    password: u.password,
    faceDescriptor: u.faceDescriptor,
    isVerified: u.isVerified,
    verificationToken: u.verificationToken,
    resetPasswordToken: u.resetPasswordToken,
    resetPasswordExpires: u.resetPasswordExpires,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    comparePassword: async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    },
    save: async function() {
      const list = readUsers();
      const idx = list.findIndex(item => item._id === this._id);
      
      // Hash password if modified and raw (doesn't have bcrypt format)
      if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
      
      const updatedUser = {
        _id: this._id,
        name: this.name,
        email: this.email,
        password: this.password,
        faceDescriptor: this.faceDescriptor,
        isVerified: this.isVerified,
        verificationToken: this.verificationToken,
        resetPasswordToken: this.resetPasswordToken,
        resetPasswordExpires: this.resetPasswordExpires,
        createdAt: this.createdAt,
        updatedAt: new Date().toISOString(),
      };

      if (idx !== -1) {
        list[idx] = updatedUser;
      } else {
        list.push(updatedUser);
      }
      writeUsers(list);
      return this;
    }
  };
};

const MockUser = {
  findOne: (query) => {
    const execute = async () => {
      const users = readUsers();
      const found = users.find(u => {
        for (let key in query) {
          if (key === 'resetPasswordExpires') {
            // Handler for: resetPasswordExpires: { $gt: Date.now() }
            const expiresVal = query[key].$gt;
            if (!u.resetPasswordExpires || new Date(u.resetPasswordExpires) <= new Date(expiresVal)) {
              return false;
            }
          } else if (key === 'email') {
            if (u.email.toLowerCase() !== query.email.toLowerCase()) return false;
          } else if (u[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
      return wrapUserInstance(found);
    };

    const queryObj = {
      select: function(fields) {
        return this;
      },
      then: function(onResolve) {
        return execute().then(onResolve);
      },
      catch: function(onReject) {
        return execute().catch(onReject);
      }
    };
    return queryObj;
  },

  findById: (id) => {
    const execute = async () => {
      const users = readUsers();
      const found = users.find(u => u._id === id.toString());
      return wrapUserInstance(found);
    };

    const queryObj = {
      select: function(fields) {
        return this;
      },
      then: function(onResolve) {
        return execute().then(onResolve);
      },
      catch: function(onReject) {
        return execute().catch(onReject);
      }
    };
    return queryObj;
  },

  find: (query = {}) => {
    const execute = async () => {
      const users = readUsers();
      const filtered = users.filter(u => {
        // Handle faceDescriptor checks ($exists etc.)
        if (query.faceDescriptor) {
          if (query.faceDescriptor.$exists === true) {
            if (!u.faceDescriptor || !Array.isArray(u.faceDescriptor)) {
              return false;
            }
          }
        }
        for (let key in query) {
          if (key === 'faceDescriptor') continue;
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
      return filtered.map(wrapUserInstance);
    };

    const queryObj = {
      then: function(onResolve) {
        return execute().then(onResolve);
      },
      catch: function(onReject) {
        return execute().catch(onReject);
      }
    };
    return queryObj;
  },

  create: async (data) => {
    const users = readUsers();
    
    // Hash password during creation
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = {
      _id: Math.random().toString(36).substring(2, 9),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      faceDescriptor: data.faceDescriptor,
      isVerified: data.isVerified || false,
      verificationToken: data.verificationToken,
      resetPasswordToken: data.resetPasswordToken,
      resetPasswordExpires: data.resetPasswordExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    return wrapUserInstance(newUser);
  }
};

// --- 3. Wrapper Router ---
const UserWrapper = {
  findOne: (query) => global.useMockDB ? MockUser.findOne(query) : MongooseUser.findOne(query),
  findById: (id) => global.useMockDB ? MockUser.findById(id) : MongooseUser.findById(id),
  find: (query) => global.useMockDB ? MockUser.find(query) : MongooseUser.find(query),
  create: (data) => global.useMockDB ? MockUser.create(data) : MongooseUser.create(data),
};

module.exports = UserWrapper;
