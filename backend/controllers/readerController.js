const Reader = require('../models/Reader');
const Loan = require('../models/Loan');

// Get all readers with optional search filter
const getReaders = async (req, res) => {
  try {
    const readers = await Reader.find().sort({ createdAt: -1 });
    const { search } = req.query;

    let filtered = [...readers];

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.name && r.name.toLowerCase().includes(term)) ||
        (r.email && r.email.toLowerCase().includes(term)) ||
        (r.phone && r.phone.toLowerCase().includes(term)) ||
        (r.address && r.address.toLowerCase().includes(term))
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los lectores registrados' });
  }
};

// Get single reader details
const getReaderById = async (req, res) => {
  try {
    const reader = await Reader.findById(req.params.id);
    if (!reader) {
      return res.status(404).json({ message: 'Lector no encontrado' });
    }
    res.json(reader);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener detalles del lector' });
  }
};

// Create a new reader
const createReader = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'El nombre completo y el correo electrónico son obligatorios' });
    }

    // Check if email already registered
    const allReaders = await Reader.find();
    if (allReaders.some(r => r.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const newReader = await Reader.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
    });

    res.status(201).json(newReader);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al registrar el lector' });
  }
};

// Update a reader
const updateReader = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const { id } = req.params;

    const reader = await Reader.findById(id);
    if (!reader) {
      return res.status(404).json({ message: 'Lector no encontrado' });
    }

    // Check if email is already in use by another reader
    const allReaders = await Reader.find();
    if (email && allReaders.some(r => r._id.toString() !== id && r.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado por otro lector' });
    }

    const updated = await Reader.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : reader.name,
        email: email ? email.trim().toLowerCase() : reader.email,
        phone: phone !== undefined ? phone.trim() : reader.phone,
        address: address !== undefined ? address.trim() : reader.address,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al actualizar el lector' });
  }
};

// Delete a reader
const deleteReader = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if reader has active loans
    const activeLoans = await Loan.find({ readerId: id, status: 'Prestado' });
    if (activeLoans.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar el lector porque tiene préstamos de libros pendientes' });
    }

    const deleted = await Reader.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lector no encontrado' });
    }

    res.json({ message: 'Lector eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el lector' });
  }
};

module.exports = {
  getReaders,
  getReaderById,
  createReader,
  updateReader,
  deleteReader,
};
