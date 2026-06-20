const Book = require('../models/Book');
const Loan = require('../models/Loan');

// Get all books with optional search, category, and availability filters
const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    const { search, category, availability } = req.query;
    
    let filtered = [...books];

    // Filter by Category
    if (category) {
      filtered = filtered.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Availability
    if (availability) {
      if (availability === 'available') {
        filtered = filtered.filter(b => b.stock > 0);
      } else if (availability === 'unavailable') {
        filtered = filtered.filter(b => b.stock === 0);
      }
    }

    // Search by title, author, code, or ISBN
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(b => 
        (b.title && b.title.toLowerCase().includes(term)) ||
        (b.author && b.author.toLowerCase().includes(term)) ||
        (b.code && b.code.toLowerCase().includes(term)) ||
        (b.isbn && b.isbn.toLowerCase().includes(term))
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los libros' });
  }
};

// Get single book details
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener detalles del libro' });
  }
};

// Create a new book
const createBook = async (req, res) => {
  try {
    const { code, title, author, category, publisher, year, isbn, stock, description, image } = req.body;

    if (!code || !title || !author || !category || !publisher || !year || !isbn) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    // Verify unique code and ISBN across all records
    const allBooks = await Book.find();
    if (allBooks.some(b => b.code.toLowerCase() === code.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El código del libro ya existe' });
    }
    if (allBooks.some(b => b.isbn.toLowerCase() === isbn.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El ISBN del libro ya existe' });
    }

    const newBook = await Book.create({
      code: code.trim(),
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      publisher: publisher.trim(),
      year: Number(year),
      isbn: isbn.trim(),
      stock: Number(stock) || 0,
      description: description || '',
      image: image || '',
    });

    res.status(201).json(newBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al registrar el libro' });
  }
};

// Update an existing book
const updateBook = async (req, res) => {
  try {
    const { code, title, author, category, publisher, year, isbn, stock, description, image } = req.body;
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Verify unique code and ISBN (excluding current book)
    const allBooks = await Book.find();
    if (code && allBooks.some(b => b._id.toString() !== id && b.code.toLowerCase() === code.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El código del libro ya existe' });
    }
    if (isbn && allBooks.some(b => b._id.toString() !== id && b.isbn.toLowerCase() === isbn.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El ISBN del libro ya existe' });
    }

    const updated = await Book.findByIdAndUpdate(
      id,
      {
        code: code ? code.trim() : book.code,
        title: title ? title.trim() : book.title,
        author: author ? author.trim() : book.author,
        category: category ? category.trim() : book.category,
        publisher: publisher ? publisher.trim() : book.publisher,
        year: year ? Number(year) : book.year,
        isbn: isbn ? isbn.trim() : book.isbn,
        stock: stock !== undefined ? Number(stock) : book.stock,
        description: description !== undefined ? description : book.description,
        image: image !== undefined ? image : book.image,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al actualizar el libro' });
  }
};

// Delete a book (only if not active in loan)
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the book has any active loans
    const activeLoans = await Loan.find({ bookId: id, status: 'Prestado' });
    if (activeLoans.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar el libro porque tiene préstamos activos' });
    }

    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    res.json({ message: 'Libro eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el libro' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
