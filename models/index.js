const { db } = require('../utils/mongodb')

// export collections
const UserCollection = db.collection('user')
const OtpCollection = db.collection('otp')
const VerifyOtpCollection = db.collection('verify-otp')
const RoleCollection = db.collection('roles')

module.exports = {
    UserCollection, OtpCollection, VerifyOtpCollection, RoleCollection
}