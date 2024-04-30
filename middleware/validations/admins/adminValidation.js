const { getSingleUser, changeUserRoleOrRestrict, removeUser, CreateRole, UpdateRole } = require('../../../validations/admin/adminValidation');
class AdminValidationMiddleware {
    getSingleUserValidation(req, res, next) {
        const { value, error } =  getSingleUser(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }

    changeUserRoleOrRestrictValidation(req, res, next) {
        const { value, error } =  changeUserRoleOrRestrict(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
    
    removeUserValidation(req, res, next) {
        const { value, error } =  removeUser(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }

    CreateRoleValidation(req, res, next) {
        const { value, error } =  CreateRole(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
    

    UpdateRoleValidation(req, res, next) {
        const { value, error } =  UpdateRole(req.body);
        if (error) {
            return next(error);
        }
        req.body = value;
        next();
    }
    
}
module.exports = new AdminValidationMiddleware(); 