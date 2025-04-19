const bcrypt = require('bcrypt');

const password = 'admin';  // Change this to your password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Hashed Password:', hash);
    }
});


// CREATE DATABASE admin_db;
// USE admin_db;

// CREATE TABLE admins (
//   id INT PRIMARY KEY AUTO_INCREMENT,
//   username VARCHAR(50) UNIQUE NOT NULL,
//   password VARCHAR(255) NOT NULL
// );






// INSERT INTO admins (username, password) VALUES (
//   'admin1',
//   '$2b$10$c0CZHiGyUerx/FXHNmAn.u4xUCrzbC9oy50VieXih8hq1fABpJKjG' 
// );



