const Loan = require('../models/Loan');
const Book = require('../models/Book');
const Reader = require('../models/Reader');

// Get all loans (with optional status filter)
const getLoans = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const loans = await Loan.find(query).populate('readerId').populate('bookId').sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de préstamos' });
  }
};

// Create a new loan
const createLoan = async (req, res) => {
  try {
    const { readerId, bookId, loanDate, dueDate } = req.body;

    if (!readerId || !bookId) {
      return res.status(400).json({ message: 'Debe seleccionar un lector y un libro' });
    }

    // Verify Reader exists
    const reader = await Reader.findById(readerId);
    if (!reader) {
      return res.status(404).json({ message: 'El lector seleccionado no existe' });
    }

    // Verify Book exists and has stock
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'El libro seleccionado no existe' });
    }

    if (book.stock <= 0) {
      return res.status(400).json({ message: 'El libro seleccionado no tiene ejemplares disponibles para préstamo' });
    }

    // Calculate dates
    const startLoanDate = loanDate ? new Date(loanDate) : new Date();
    // Default limit date: 14 days later
    const limitDueDate = dueDate ? new Date(dueDate) : new Date(startLoanDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Create loan record
    const loan = await Loan.create({
      readerId,
      bookId,
      loanDate: startLoanDate,
      dueDate: limitDueDate,
      status: 'Prestado'
    });

    // Decrease Book stock
    await Book.findByIdAndUpdate(bookId, { stock: book.stock - 1 });

    res.status(201).json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al procesar el préstamo' });
  }
};

// Register book return (PUT /api/loans/:id)
const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    if (loan.status === 'Devuelto') {
      return res.status(400).json({ message: 'Este libro ya ha sido devuelto anteriormente' });
    }

    const returnDate = new Date();
    const dueDate = new Date(loan.dueDate);

    // Update loan status & return date
    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      {
        status: 'Devuelto',
        returnDate,
      },
      { new: true }
    );

    // Increase Book stock
    const book = await Book.findById(loan.bookId);
    if (book) {
      await Book.findByIdAndUpdate(loan.bookId, { stock: book.stock + 1 });
    }

    // Check if the return is late
    // Set hours to 0 to compare days fairly
    const isLate = returnDate.setHours(0,0,0,0) > dueDate.setHours(0,0,0,0);
    const message = isLate ? 'Devolución fuera de tiempo' : 'Libro devuelto exitosamente';

    res.json({
      message,
      isLate,
      loan: updatedLoan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la devolución' });
  }
};

// Cancel/Delete loan record
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // If the loan was active, restore book stock
    if (loan.status === 'Prestado') {
      const book = await Book.findById(loan.bookId);
      if (book) {
        await Book.findByIdAndUpdate(loan.bookId, { stock: book.stock + 1 });
      }
    }

    await Loan.findByIdAndDelete(id);
    res.json({ message: 'Registro de préstamo eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el registro de préstamo' });
  }
};

// Get Dashboard Statistics
const getStats = async (req, res) => {
  try {
    const books = await Book.find();
    const totalReaders = await Reader.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'Prestado' });

    const totalBooks = books.length;
    const totalStock = books.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);

    res.json({
      totalBooks,
      totalReaders,
      loanedBooks: activeLoans,
      availableBooks: totalStock,
      activeLoans,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error al recopilar estadísticas del sistema' });
  }
};

module.exports = {
  getLoans,
  createLoan,
  returnBook,
  deleteLoan,
  getStats,
};
