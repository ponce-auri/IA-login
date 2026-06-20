const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- 1. Mongoose Setup ---
const bookSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'El código es obligatorio'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'El autor es obligatorio'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
    },
    publisher: {
      type: String,
      required: [true, 'La editorial es obligatoria'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'El año de publicación es obligatorio'],
    },
    isbn: {
      type: String,
      required: [true, 'El ISBN es obligatorio'],
      unique: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      default: 0,
      min: [0, 'El stock no puede ser menor a 0'],
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MongooseBook = mongoose.model('Book', bookSchema);

// --- 2. JSON Fallback Setup ---
const DB_FILE = path.join(__dirname, '../data/books.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

const readBooks = () => {
  ensureDbDir();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeBooks = (books) => {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(books, null, 2));
};

const MockBook = {
  find: (query = {}) => {
    let books = readBooks();
    
    // Apply basic query filters if present
    if (Object.keys(query).length > 0) {
      books = books.filter(b => {
        for (let key in query) {
          // Skip regex or special filter objects in standard loop, handle them manually
          if (query[key] && typeof query[key] === 'object') {
            if (query[key].$ne !== undefined) {
              if (b[key] === query[key].$ne) return false;
            }
            continue;
          }
          if (b[key] !== query[key]) return false;
        }
        return true;
      });
    }

    return {
      sort: (sortCriteria) => {
        // Simple sort logic (mostly by createdAt)
        return books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },
      then: (onResolve) => Promise.resolve(books).then(onResolve),
      catch: (onReject) => Promise.resolve(books).catch(onReject)
    };
  },

  findOne: async (query) => {
    const books = readBooks();
    const found = books.find(b => {
      for (let key in query) {
        if (b[key] !== query[key]) return false;
      }
      return true;
    });
    return found || null;
  },

  findById: async (id) => {
    const books = readBooks();
    const found = books.find(b => b._id === id.toString());
    return found || null;
  },

  create: async (data) => {
    const books = readBooks();
    
    // Validations
    if (books.some(b => b.code === data.code)) {
      throw new Error('El código ya está registrado');
    }
    if (books.some(b => b.isbn === data.isbn)) {
      throw new Error('El ISBN ya está registrado');
    }

    const newBook = {
      _id: Math.random().toString(36).substring(2, 9),
      code: data.code,
      title: data.title,
      author: data.author,
      category: data.category,
      publisher: data.publisher,
      year: Number(data.year),
      isbn: data.isbn,
      stock: Number(data.stock) || 0,
      description: data.description || '',
      image: data.image || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    books.push(newBook);
    writeBooks(books);
    return newBook;
  },

  findByIdAndUpdate: async (id, data, options = {}) => {
    const books = readBooks();
    const idx = books.findIndex(b => b._id === id.toString());
    if (idx === -1) return null;

    // Check unique constraints (excluding self)
    if (data.code && books.some((b, i) => i !== idx && b.code === data.code)) {
      throw new Error('El código ya está registrado');
    }
    if (data.isbn && books.some((b, i) => i !== idx && b.isbn === data.isbn)) {
      throw new Error('El ISBN ya está registrado');
    }

    const updatedBook = {
      ...books[idx],
      ...data,
      year: data.year !== undefined ? Number(data.year) : books[idx].year,
      stock: data.stock !== undefined ? Number(data.stock) : books[idx].stock,
      updatedAt: new Date().toISOString(),
    };

    books[idx] = updatedBook;
    writeBooks(books);
    return updatedBook;
  },

  findByIdAndDelete: async (id) => {
    const books = readBooks();
    const idx = books.findIndex(b => b._id === id.toString());
    if (idx === -1) return null;
    const deleted = books[idx];
    books.splice(idx, 1);
    writeBooks(books);
    return deleted;
  },
  
  countDocuments: async (query = {}) => {
    const books = readBooks();
    if (Object.keys(query).length === 0) return books.length;
    return books.filter(b => {
      for (let key in query) {
        if (query[key] && typeof query[key] === 'object') {
          if (query[key].$gt !== undefined && b[key] <= query[key].$gt) return false;
          continue;
        }
        if (b[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }
};

// --- 3. Wrapper ---
const BookWrapper = {
  find: (query) => global.useMockDB ? MockBook.find(query) : MongooseBook.find(query),
  findOne: (query) => global.useMockDB ? MockBook.findOne(query) : MongooseBook.findOne(query),
  findById: (id) => global.useMockDB ? MockBook.findById(id) : MongooseBook.findById(id),
  create: (data) => global.useMockDB ? MockBook.create(data) : MongooseBook.create(data),
  findByIdAndUpdate: (id, data, options) => global.useMockDB ? MockBook.findByIdAndUpdate(id, data, options) : MongooseBook.findByIdAndUpdate(id, data, options),
  findByIdAndDelete: (id) => global.useMockDB ? MockBook.findByIdAndDelete(id) : MongooseBook.findByIdAndDelete(id),
  countDocuments: (query) => global.useMockDB ? MockBook.countDocuments(query) : MongooseBook.countDocuments(query),
};

module.exports = BookWrapper;
