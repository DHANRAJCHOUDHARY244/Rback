const { passHash, verifyPassHash } = require('../utils/bcrypt');
const logger = require('../utils/pino');
const { UserCollection, OtpCollection, VerifyOtpCollection } = require('../models')
const { generateToken } = require('../middleware/auth');
const generateOtp = require('../utils/otpGen')
const sendEmail = require('../utils/email')
const redisClient = require('../utils/redis')
const { redisPrefix } = require('../config');
const { VERIFY_REG_KEY } = require('../helper');

// ---------------- Register controller  ------------------------
const Register = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      logger.error('email and password are required');
      throw new Error('email and password are required');
    }
    const redisUserExist = await redisClient.hGet(`${redisPrefix}`, email);
    if (!redisUserExist) {
      const userExist = await UserCollection.find({ email }).toArray()
      if (userExist.length) {
        throw new Error('User Already Exist');
      }
      else {
        const HashPassword = await passHash(password);
        const otp = generateOtp();
        const options = { email, otp };
        const emailResponse = await sendEmail(options);
        if (emailResponse.success) {
          await VerifyOtpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
          await Promise.all([
            VerifyOtpCollection.insertOne({ email, otp, createdAt: new Date() }),
            UserCollection.insertOne({ email, password: HashPassword, isVerified: false }),
            redisClient.hSet(`${redisPrefix}`, email, JSON.stringify({ email: email, password: HashPassword, isVerified: false })),
            redisClient.setEx(VERIFY_REG_KEY(email), 3600, `${otp}`)
          ]).then(async data => {
            logger.info(emailResponse.message, data);
            return res.json({ message: `${emailResponse.message} please verify the otp for this registered email ${email}` });
          }).catch(err => {
            throw new Error(err)
          });
        }
        else {
          throw new Error(emailResponse.error);
        }
      }
    } else {
      throw new Error('User Already Exist');
    }

  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: `email and password are required or ${error}` });
  }
}

//----------------Verify Register user------------------//
const RegisterVerify = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      logger.error('email password and otp are required');
      throw new Error('email password and otp are required');
    }
    const storedOTP = await redisClient.get(VERIFY_REG_KEY(email));
    if (!storedOTP) {
      const storedOtpDoc = await VerifyOtpCollection.findOne({ email });
      if (!storedOtpDoc || storedOtpDoc.otp != otp) {
        throw new Error("Otp is invalid or expired");
      }
      await UserCollection.findOneAndUpdate({ email }, { $set: { isVerified: true } }, { returnOriginal: false })
        .then(async data => {
          await Promise.all([
            redisClient.hSet(`${redisPrefix}`, data.email, JSON.stringify({ email: data.email, password: data.password, isVerified: true })),
            VerifyOtpCollection.findOneAndDelete({ email }),
            redisClient.del(VERIFY_REG_KEY(email))
          ]).then(async data1 => {
            logger.info("otp verified and User registered and verified successfully mongo", data1);
            return res.status(201).json({ message: "otp verified and User registered and verified successfully mongo" })
          }).catch(err => {
            throw new Error(err)
          });
        }).catch(err => {
          throw new Error(err)
        });
    } else if (storedOTP == otp) {
      await UserCollection.findOneAndUpdate({ email }, { $set: { isVerified: true } }, { returnOriginal: false })
        .then(async data => {
          await Promise.all([
            redisClient.hSet(`${redisPrefix}`, data.email, JSON.stringify({ email: data.email, password: data.password, isVerified: true })),
            VerifyOtpCollection.findOneAndDelete({ email }),
            redisClient.del(VERIFY_REG_KEY(email))
          ]).then(async data1 => {
            logger.info("otp verified and User registered and verified successfully redis", data1);
            return res.status(201).json({ message: "otp verified and User registered and verified successfully redis" })
          }).catch(err => {
            throw new Error(err)
          });
        }).catch(err => {
          throw new Error(err)
        });
    }
    else {
      throw new Error('Invalid Otp')
    }
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: `Bad Request ${error}` });
  }
}

// ---------------- login controller  ------------------------

const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      logger.error('email and password are required');
      throw new Error('email and password are required');
    } else {
      const redisUserExist = await redisClient.hGet(`${redisPrefix}`, email);
      if (!!redisUserExist) {
        const redisUser = JSON.parse(redisUserExist)
        if (await verifyPassHash(password, redisUser.password)) {
          logger.info('user logged in successfully');
          const token = generateToken({ email, password: redisUser.password })
          res.status(201).json({ message: "user logged in Successfully from redis", token })
        } else {
          throw new Error('Please Provide Correct details')
        }
      }
      else if (!redisUserExist) {
        const userExist = await UserCollection.find({ email }).toArray();
        if (await verifyPassHash(password, userExist[0].password)) {
          if (userExist.isVerified) { // Check if user is verified
            logger.info('user logged in successfully');
            const token = generateToken({ email, password: userExist[0].password })
            res.status(201).json({ message: "user logged in Successfully  FOM MONGODB ", token })
          } else {
            throw new Error('User is not verified');
          }
        } else {
          throw new Error('Please Provide Correct details')
        }
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(404).json({ message: `user not found ${error}` });
  }
}

// ---------------- forget password controller  ------------------------


const ForgetPass = async (req, res) => {
  const email = req.body.email;
  try {
    const otp = generateOtp();
    const options = { email, otp };
    const emailResponse = await sendEmail(options);
    if (emailResponse.success) {
      await OtpCollection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 60 });
      await Promise.all([
        OtpCollection.insertOne({ email, otp, expireAt: new Date(Date.now() + 6000) }),
        redisClient.setEx(email, 60, `${otp}`)
      ]).then(async data => {
        logger.info(emailResponse.message, data);
        return res.json({ message: emailResponse.message });
      }).catch(err => {
        throw new Error(err)
      });
    }
    else {
      throw new Error(emailResponse.error);
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: `Internal Server Error ${error}` });
  }
}

// ---------------- otp-verify & password-change controller  ------------------------


const OtpVerify = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const storedOTP = await redisClient.get(email);
    if (!storedOTP) {
      const storedOtpDoc = await OtpCollection.findOne({ email });
      if (!storedOtpDoc || storedOtpDoc.otp != otp) {
        throw new Error("Otp is invalid or expired");
      }
      const hashpass = await passHash(password)
      await UserCollection.findOneAndUpdate({ email }, { $set: { password: hashpass } }, { returnOriginal: false }
      ).then(async data => {
        await redisClient.hSet(`${redisPrefix}`, data.email, JSON.stringify({ email: data.email, password: data.password }))
          .then(res => console.log(res))
          .catch(err => console.log(err))
        res.status(201).json({ message: "otp verified and password changed" })
      }).catch(err => {
        throw new Error(err)
      });
    }
    else if (storedOTP == otp) {
      const hashpass = await passHash(password)
      await UserCollection.findOneAndUpdate({ email }, { $set: { password: hashpass } }, { returnOriginal: false }
      ).then(async data => {
        await redisClient.hSet(`${redisPrefix}`, data.email, JSON.stringify({ email: data.email, password: data.password }))
          .then(res => console.log(res))
          .catch(err => console.log(err))
        res.status(201).json({ message: "otp verified and password changed" })
      }).catch(err => {
        throw new Error(err)
      });
    }
    else {
      throw new Error('Invalid Otp')
    }

  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: `Bad Request ${error}` });
  }
}


module.exports = { Register, Login, ForgetPass, OtpVerify, RegisterVerify }