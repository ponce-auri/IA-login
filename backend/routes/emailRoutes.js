const express = require('express');
const Email = require('../models/Email');

const router = express.Router();

// @desc    Get all simulated emails
// @route   GET /api/emails
// @access  Public (in production this would be protected, but for local mock sandbox it is public)
router.get('/', async (req, res) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 });
    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener correos simulados' });
  }
});

// @desc    Clear all simulated emails
// @route   DELETE /api/emails
// @access  Public
router.delete('/', async (req, res) => {
  try {
    await Email.deleteMany({});
    res.json({ message: 'Bandeja de correos simulados vaciada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al vaciar correos' });
  }
});

module.exports = router;
