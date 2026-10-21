const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = Router();

// Every /api/admin route requires a logged-in admin.
router.use(authenticate, requireRole('admin'));
router.get('/stats', admin.stats);
router.get('/registrations', admin.registrations);

module.exports = router;
