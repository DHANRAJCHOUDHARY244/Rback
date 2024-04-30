const { Register, Login, OtpVerify, ForgetPass } = require('../../../validations/users/userValidation');
class UserValidationMiddleware {

    registerValidation(req, res, next) {
        const { value, error } =  Register(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
    loginValidation(req, res, next) {
        const { value, error } =  Login(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }

    otpVerifyValidation(req, res, next) {
        const { value, error } =  OtpVerify(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
    forgetPassValidation(req, res, next) {
        const { value, error } = ForgetPass(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
}

module.exports = new UserValidationMiddleware();