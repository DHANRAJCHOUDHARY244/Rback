const {
  getAllUsers,
  getSingleUser,
  changeUserRoleOrRestrict,
  removeUser,
  CreateRole,
  getRoleByName,
  UpdateRole,
  GetRolesNdPermission,
  DeleteRole,
} = require("../controllers/admin");
const { authenticateModuleRoute, authenticate } = require("../middleware/auth");
const { getSingleUserValidation, changeUserRoleOrRestrictValidation, removeUserValidation, CreateRoleValidation, UpdateRoleValidation } = require("../middleware/validations/admins/adminValidation");

const router = require("express").Router();

// admin user routes----------------------------------

//  get all user
router.get(
  "/users",
  authenticate,
  authenticateModuleRoute("admin", "/users"),
  getAllUsers
);

// get single user
router.get(
  "/user",
  authenticate,
  getSingleUserValidation,
  authenticateModuleRoute("admin", "/user"),
  getSingleUser
);

//change the user role or restrict it
router.put(
  "/user-role-update",
  authenticate,
  changeUserRoleOrRestrictValidation,
  authenticateModuleRoute("admin", "/user-role-update"),
  changeUserRoleOrRestrict
);

//  remove user
router.delete(
  "/del-user",
  authenticate,
  removeUserValidation,
  authenticateModuleRoute("admin", "/users"),
  removeUser
);

// admin role routes----------------------------------

// Create Role with permission
router.post(
  "/create-role",
  authenticate,
  CreateRoleValidation,
  authenticateModuleRoute("admin", "/create-role"),
  CreateRole
);

// get all Role with permission
router.get(
  "/roles",
  authenticate,
  authenticateModuleRoute("admin", "/roles"),
  GetRolesNdPermission
);

// get single Role with permission
router.get(
  "/role/:rolename",
  authenticate,
  authenticateModuleRoute("admin", "/role/:rolename"),
  getRoleByName
);

// Update Role with permission
router.put(
  "/update-role/:rolename",
  authenticate,
  UpdateRoleValidation,
  authenticateModuleRoute("admin", "/update-role/:rolename"),
  UpdateRole
);

// delete Role
router.delete(
  "/delete-role/:rolename",
  authenticate,
  authenticateModuleRoute("admin", "/delete-role/:rolename"),
  DeleteRole
);
module.exports = router;
