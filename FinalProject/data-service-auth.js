// enables working with ODM
//*********************************************************************
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

// define a userSchema
//*********************************************************************
let userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{ dateTime: Date, userAgent: String }]
});

// define a User
let User;

// INITIALIZE: makes sure ability to connect to MongoDB instance
//*********************************************************************
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb://mongo_web322:web322@ds041347.mlab.com:41347/web322_assign6");
        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};


// REGISTER_USER: checks for passwords match and username's availability
//*********************************************************************
module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {

        if (userData.password === userData.password2) {

            bcrypt.genSalt(10, function (err, salt) {
                // couldn't generate salt
                if (err) {
                    reject("Salt generating step: There was an error encrypting the password");
                }
                // salt generated successfully
                else {
                    bcrypt.hash(userData.password, salt, function (err, hash) {
                        if (err) {
                            reject("Hash generating step: There was an error encrypting the password");
                        }
                        else {
                            userData.password = hash;

                            // create a new User from the UserData
                            let newUser = new User(userData);

                            newUser.save((err) => {
                                // if error occured
                                if (err) {
                                    if (err.code === 11000) {
                                        reject("User Name already taken!");
                                    }
                                    else {
                                        reject("There was an error creating the user: " + err);
                                    }
                                }
                                // no error occurs
                                else {
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            reject("Passwords do not match!");
        }
    });
};


// CHECK_USER: finds user, verifies password, updates loginHistory 
//*********************************************************************
module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        // search for the users with the userData.userName
        User.find({ userName: userData.userName }).exec()
            .then((users) => {
                // if no users found
                if (users.length == 0) {
                    reject("Unable to find user: " + userData.userName);
                }
                else {
                    // compare an encrypted(hashed) value with a plain text
                    bcrypt.compare(userData.password, users[0].password).then((result) => {
                        // result === true
                        if (result === true) {
                            // record action in "loginHistory" array
                            users[0].loginHistory.push({
                                dateTime: new Date().toString(),
                                userAgent: userData.userAgent
                            });
                            // update users loginHistory section 
                            User.updateOne(
                                { userName: users[0].userName },
                                { $set: { loginHistory: users[0].loginHistory } }
                            ).exec()
                                .then(() => {
                                    resolve(users[0]);
                                })
                                .catch((err) => {
                                    reject("There was an error verifying the user: " + err);
                                });
                        }
                        // passwords don't match
                        else {
                            reject("Incorrect Password for user: " + userData.userName);
                        }
                    });
                }
            })
            .catch((err) => {
                reject("Unable to find user: " + userData.userName + " error MSG: " + err);
            });
    });
};






















