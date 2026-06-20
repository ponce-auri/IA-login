const express = require('express');
const {
  getReaders,
  getReaderById,
  createReader,
  updateReader,
  deleteReader,
} = require('../controllers/readerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all reader routes
router.use(protect);

router.route('/')
  .get(getReaders)
  .post(createReader);

router.route('/:id')
  .get(getReaderById)
  .put(updateReader)
  .delete(deleteReader);

module.exports = router;
