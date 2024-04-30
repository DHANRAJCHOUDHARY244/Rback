const Joi =require('joi');

class AdminValidation{
    getSingleUser(params) {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
        return schema.validate(params);
    }

    changeUserRoleOrRestrict(params) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            role:Joi.array().items(Joi.string()).required()
        });
        return schema.validate(params);
    }

    removeUser(params) {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
        return schema.validate(params);
    }
    CreateRole(params) {
        const schema = Joi.object({
            role_name: Joi.string().required(),
            modules: Joi.object().pattern(
                Joi.string(),
                Joi.object({
                    action: Joi.array().items(Joi.string()).optional()
                })
            ).required()
        });
        return schema.validate(params);
    }
    UpdateRole(params) {
        const schema = Joi.object({
            role_name: Joi.string().required(),
            modules: Joi.object().pattern(
                Joi.string(),
                Joi.object({
                    action: Joi.array().items(Joi.string()).optional()
                })
            ).required()
        });
        return schema.validate(params);
    }
}
module.exports = new AdminValidation();