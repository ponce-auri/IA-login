const express = require('express');
const {
  getLoans,
  createLoan,
  returnBook,
  deleteLoan,
  getStats,
} = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all loan routes
router.use(protect);

// Dashboard stats endpoint (must be BEFORE /:id parameter route)
router.get('/stats', getStats);

router.route('/')
  .get(getLoans)
  .post(createLoan);

router.route('/:id')
  .put(returnBook)
  .delete(deleteLoan);

module.exports = router;
