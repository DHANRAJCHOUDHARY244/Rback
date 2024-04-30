const Joi =require('joi');

class UserValidation{
    Register(params) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required().min(8)
                .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
                .messages({
                    'string.base': 'Password must be a string',
                    'string.empty': 'Password cannot be empty',
                    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
                    'string.min': 'Password must be at least 8 characters long',
                    'any.required': 'Password is required',
                })
        });
        return schema.validate(params);
    }
    

    Login(params) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });
        return schema.validate(params);
    }
    ForgetPass(params) {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
        return schema.validate(params);
    }

    OtpVerify(params) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            otp:Joi.string().required(),
            password:Joi.string().required()
        });
        return schema.validate(params);
    }
}

module.exports =  new UserValidation() 