const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- 1. Mongoose Setup ---
const loanSchema = new mongoose.Schema(
  {
    readerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reader',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    loanDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      default: 'Prestado',
      enum: ['Prestado', 'Devuelto'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseLoan = mongoose.model('Loan', loanSchema);

// --- 2. JSON Fallback Setup ---
const DB_FILE = path.join(__dirname, '../data/loans.json');
const BOOKS_FILE = path.join(__dirname, '../data/books.json');
const READERS_FILE = path.join(__dirname, '../data/readers.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
};

const readLoans = () => {
  ensureDbDir();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeLoans = (loans) => {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(loans, null, 2));
};

// Helpers for reference population in Mock Mode
const readBooksForPopulate = () => {
  try {
    return JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf-8'));
  } catch (e) { return []; }
};

const readReadersForPopulate = () => {
  try {
    return JSON.parse(fs.readFileSync(READERS_FILE, 'utf-8'));
  } catch (e) { return []; }
};

const MockLoan = {
  find: (query = {}) => {
    let loans = readLoans();

    if (Object.keys(query).length > 0) {
      loans = loans.filter(l => {
        for (let key in query) {
          if (l[key] !== query[key]) return false;
        }
        return true;
      });
    }

    let shouldPopulateReader = false;
    let shouldPopulateBook = false;

    const execute = () => {
      let list = [...loans];
      
      if (shouldPopulateReader || shouldPopulateBook) {
        const books = readBooksForPopulate();
        const readers = readReadersForPopulate();
        
        list = list.map(l => {
          const populated = { ...l };
          if (shouldPopulateReader) {
            populated.readerId = readers.find(r => r._id === l.readerId) || { _id: l.readerId, name: 'Lector Eliminado' };
          }
          if (shouldPopulateBook) {
            populated.bookId = books.find(b => b._id === l.bookId) || { _id: l.bookId, title: 'Libro Eliminado', code: 'N/A' };
          }
          return populated;
        });
      }
      return list;
    };

    const queryObj = {
      populate: function(field) {
        if (field === 'readerId') shouldPopulateReader = true;
        if (field === 'bookId') shouldPopulateBook = true;
        return this;
      },
      sort: function(criteria) {
        loans.sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
        return this;
      },
      then: function(onResolve) {
        return Promise.resolve(execute()).then(onResolve);
      },
      catch: function(onReject) {
        return Promise.resolve(execute()).catch(onReject);
      }
    };

    return queryObj;
  },

  findById: async (id) => {
    const loans = readLoans();
    const found = loans.find(l => l._id === id.toString());
    return found || null;
  },

  create: async (data) => {
    const loans = readLoans();
    
    // Automatically set dates if not provided
    const loanDate = data.loanDate ? new Date(data.loanDate) : new Date();
    // Due date defaults to 14 days later
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(loanDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newLoan = {
      _id: Math.random().toString(36).substring(2, 9),
      readerId: data.readerId.toString(),
      bookId: data.bookId.toString(),
      loanDate: loanDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: data.status || 'Prestado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    loans.push(newLoan);
    writeLoans(loans);
    return newLoan;
  },

  findByIdAndUpdate: async (id, data, options = {}) => {
    const loans = readLoans();
    const idx = loans.findIndex(l => l._id === id.toString());
    if (idx === -1) return null;

    const updatedLoan = {
      ...loans[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    loans[idx] = updatedLoan;
    writeLoans(loans);
    return updatedLoan;
  },

  findByIdAndDelete: async (id) => {
    const loans = readLoans();
    const idx = loans.findIndex(l => l._id === id.toString());
    if (idx === -1) return null;
    const deleted = loans[idx];
    loans.splice(idx, 1);
    writeLoans(loans);
    return deleted;
  },

  countDocuments: async (query = {}) => {
    const loans = readLoans();
    if (Object.keys(query).length === 0) return loans.length;
    return loans.filter(l => {
      for (let key in query) {
        if (l[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }
};

// --- 3. Wrapper ---
const LoanWrapper = {
  find: (query) => global.useMockDB ? MockLoan.find(query) : MongooseLoan.find(query),
  findById: (id) => global.useMockDB ? MockLoan.findById(id) : MongooseLoan.findById(id),
  create: (data) => global.useMockDB ? MockLoan.create(data) : MongooseLoan.create(data),
  findByIdAndUpdate: (id, data, options) => global.useMockDB ? MockLoan.findByIdAndUpdate(id, data, options) : MongooseLoan.findByIdAndUpdate(id, data, options),
  findByIdAndDelete: (id) => global.useMockDB ? MockLoan.findByIdAndDelete(id) : MongooseLoan.findByIdAndDelete(id),
  countDocuments: (query) => global.useMockDB ? MockLoan.countDocuments(query) : MongooseLoan.countDocuments(query),
};

module.exports = LoanWrapper;
