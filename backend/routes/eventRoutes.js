const { Router } = require('express');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const events = require('../controllers/eventController');

const router = Router();

router.get('/stats', events.publicStats);
router.get('/categories', events.listCategories);

router.get('/events', events.listEvents);
router.get('/events/:id', optionalAuth, events.getEvent);
router.post('/events', authenticate, requireRole('admin'), events.createEvent);
router.put('/events/:id', authenticate, requireRole('admin'), events.updateEvent);
router.delete('/events/:id', authenticate, requireRole('admin'), events.deleteEvent);

module.exports = router;
