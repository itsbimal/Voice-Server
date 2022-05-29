const router = require('express').Router();

const AuthController = require('./controllers/auth-controller');
const ActivateController = require('./controllers/activate-controller');
const AuthMiddleware = require('./middleware/auth-middleware');
const RoomsController = require('./controllers/rooms-controller');
const roomsController = require('./controllers/rooms-controller');

router.post('/api/send-otp/',AuthController.sendOtp);
router.post('/api/verify-otp/', AuthController.verifyOtp);
router.post('/api/activate/', AuthMiddleware,ActivateController.activate);
router.get('/api/refresh', AuthController.refresh);
router.post('/api/logout', AuthMiddleware, AuthController.logout);
router.post('/api/rooms', AuthMiddleware,RoomsController.create);
router.get('/api/rooms',AuthMiddleware, RoomsController.index);
router.get('/api/rooms/:roomId', AuthMiddleware, roomsController.show)

module.exports = router;


