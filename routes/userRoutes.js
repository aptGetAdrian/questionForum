var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');




router.get('/', userController.list);
router.get('/register', userController.showRegister);
router.get('/login', userController.showLogin);
router.get('/userProfile', userController.userProfile);
router.get('/logout', userController.logout);
router.get('/publicUserProfile/:username', userController.publicUserProfile)
router.get('/:id', userController.show);

router.post('/', userController.create);
router.post('/login', userController.login);

router.post('/setPicture', userController.setPicture);

router.put('/:id', userController.update);

router.delete('/:id', userController.remove);

module.exports = router;
