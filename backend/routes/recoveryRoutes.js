const express = require('express');
const {
  recoverUsername,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/recoveryController');

const router = express.Router();

router.post('/username', recoverUsername);
router.post('/password-request', requestPasswordReset);
router.post('/password-reset', resetPassword);

module.exports = router;
