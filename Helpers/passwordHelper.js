var bcrypt = require("bcryptjs");
exports.hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.log(err);
                reject(null);
            } else {
                console.log(hash);
                resolve(hash);
            }
        });

    });
};
