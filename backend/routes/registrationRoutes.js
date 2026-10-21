const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const registrations = require('../controllers/registrationController');

const router = Router();

router.post('/register', authenticate, requireRole('student'), registrations.register);
router.get('/my-registrations', authenticate, registrations.myRegistrations);
router.get('/registrations', authenticate, registrations.listRegistrations);
router.delete('/registrations/:id', authenticate, registrations.cancelRegistration);

module.exports = router;
