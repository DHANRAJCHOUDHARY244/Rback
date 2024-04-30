const logger = require("../utils/pino");
const redisClient = require("../utils/redis");
const { redisUserPrefix, redisPermPrefix } = require("../config");
const { UserCollection, RoleCollection } = require('../models');

// ------------------- admin controllers ----------------

const getAllUsers = async (req, res) => {
  try {
    let users;
    usersRedis = await redisClient.hGetAll(`${redisUserPrefix}`);

    users = { ...usersRedis };
    if (!usersRedis) {
      users = await UserCollection.find().toArray();
    }
    res.json({ Users: users });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${error}` });
  }
};

const getSingleUser = async (req, res) => {
  const email = req.body.email;
  try {
    const redisUserExist = await redisClient.hGet(
      `${redisUserPrefix}`,
      email
    );
    if (!!redisUserExist) {
      const redisUser = JSON.parse(redisUserExist);
      res
        .status(201)
        .json({ message: `details of ${email}  from redis`, redisUser });
    } else if (!redisUserExist) {
      const userExist = await UserCollection.find({ email }).toArray();

      if (!userExist.length) {
        throw new Error("User not found");
      } else {
        res
          .status(201)
          .json({ message: `details of ${email}  from redis`, redisUser });
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${error}` });
  }
};

const changeUserRoleOrRestrict = async (req, res) => {
  const { email, role } = req.body;
  console.log(role);
  try {
    const user = await UserCollection.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    } else {
      const newRoleArray = [...role];
      // update in mongo
      await UserCollection
        .findOneAndUpdate({ email }, { $set: { role: newRoleArray } })
        .then(async (data) => {
          // mongo success then update in redis

          await redisClient
            .hSet(
              `${redisUserPrefix}`,
              email,
              JSON.stringify({
                email: email,
                password: user.password,
                role: newRoleArray,
                id: user._id,
              })
            )
            .then((data) => {
              console.log(data);
            });
          logger.info(`user ${email} role changed`);
          res.status(201).json({ message: `user ${email} role changed` });
        });
    }
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: `Bad Request ${error}` });
  }
};

const removeUser = async (req, res) => {
  const email = req.body.email;
  try {
    const user = await UserCollection.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    } else {
      await redisClient.hDel(`${redisUserPrefix}`, email);
      await UserCollection
        .findOneAndDelete({ email })
        .then((data) => {
          logger.info(`user ${email} removed successfully`);
          res
            .status(201)
            .json({ message: `user ${email} removed successfully` });
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: `Bad Request ${error}` });
  }
};

// ------------------- admin role  controllers ----------------

const CreateRole = async (req, res) => {
  const { role_name, modules } = req.body;
  try {
    // Check if the role already exists
    const existingRole = await Role.findOne({ role_name });
    if (existingRole) {
      throw new Error("Role already exists");
    }
    // Insert new role
    await Role.insertOne({ role_name, modules })
      .then(async (data) => {
        await redisClient
          .hSetNX(`${redisPermPrefix}`, role_name, JSON.stringify(modules))
          .then((data) => console.log(data))
          .catch((err) => console.log(err));
      })
      .catch((err) => {
        throw new Error(err);
      });
    res.status(201).json({
      message: "New Role Created Successfully",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: ` Internal Server Error or ${error}` });
  }
};

const GetRolesNdPermission = async (req, res) => {
  try {
    let roles;
    await redisClient
      .hGetAll(`${redisPermPrefix}`)
      .then((reply) => {
        let permissions = {};
        Object.entries(reply).forEach(([field, value]) => {
          permissions[field] = JSON.parse(value);
        });
        res.json({ Roles: permissions });
      })
      .catch(async (err) => {
        console.log("No roles found in redis");
        roles = await RoleCollection.find().toArray();
        if (!roles.length) {
          throw new Error("No roles found");
        }
        res.json({ Roles: roles });
      });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${error}` });
  }
};

const getRoleByName = async (req, res) => {
  try {
    let role;
    let { rolename } = req.params;
    await redisClient
      .hGet(`${redisPermPrefix}`, rolename)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch(async (err) => {
        role = await RoleCollection.findOne({ role_name: rolename });
        if (!role) {
          throw new Error("Role not found");
        }
        res.status(200).json(role);
      });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${{ error }}` });
  }
};

const UpdateRole = async (req, res) => {
  const { role_name, modules } = req.body;
  try {
    let { rolename } = req.params;
    // Update role in MongoDB
    await RoleCollection.updateOne(
      { role_name: rolename },
      { $set: { role_name, modules } }
    )
      .then(async (data) => {
        console.log(data);
        await redisClient
          .hSet(`${redisPermPrefix}`, role_name, JSON.stringify(modules))
          .then((data) => console.log(data))
          .catch((err) => console.log(err));
        res.status(201).json({ message: "Role updated successfully" });
      })
      .catch((err) => {
        throw new Error(err);
      });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${error}` });
  }
};

const DeleteRole = async (req, res) => {
  try {
    let { rolename } = req.params;
    // Delete role from MongoDB
    await RoleCollection.deleteOne({ role_name: rolename })
      .then(async (data) => {
        console.log(data);
        await redisClient
          .hDel(`${redisPermPrefix}`, rolename)
          .then((res) => console.log(res))
          .catch((err) => console.log(err));
        res.status(200).json({ message: "Role deleted successfully" });
      })
      .catch((err) => {
        throw new Error(err);
      });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: `${error}` });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  changeUserRoleOrRestrict,
  removeUser,
  CreateRole,
  GetRolesNdPermission,
  getRoleByName,
  UpdateRole,
  DeleteRole,
};
