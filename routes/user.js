const { Register, Login, ForgetPass, OtpVerify, getAllUsers } = require('../controllers/user')
const { authenticate } = require('../middleware/auth')
const { registerValidation, loginValidation, forgetPassValidation, otpVerifyValidation } = require('../middleware/validations/user/userValidation')

const router = require('express').Router()

// register route
router.post('/reg',registerValidation, Register)

// login route
router.post('/login', loginValidation,Login)

// forget password route
router.post('/forget-pass', forgetPassValidation,ForgetPass)


// otp verify and update password route
router.post('/verify-otp',otpVerifyValidation, OtpVerify)


// // protected routes
// router.post('/users', authenticate, getAllUsers)

module.exports = router