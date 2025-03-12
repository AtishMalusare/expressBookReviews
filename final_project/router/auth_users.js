const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];
 // Fixed to be consistent with usage

const isValid = (username) => { // returns boolean
  // Check if the username is valid
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => { // returns boolean
  // Check if username and password match our records
  return users.some(user => user.username === username && user.password === password);
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  if (!username || !password) {
    return res.status(400).json({message: "Please enter username and password"});
  }
  
  if (!authenticatedUser(username, password)) {
    return res.status(400).json({message: "Invalid Credentials"});
  }
  
  const accessToken = jwt.sign({username}, "access", {expiresIn: "1h"});
  req.session.authorization = accessToken; // Store in session
  return res.status(200).json({message: "Login Successful", token: accessToken});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  
  // The username should come from the decoded token in the middleware
  const username = req.user?.username;
  
  if (!username) {
    return res.status(401).json({message: "User information not found in token"});
  }
  
  if (!books[isbn]) {
    return res.status(404).json({message: "Book Not Found"});
  }
  
  if (!review) {
    return res.status(400).json({message: "Review text required"});
  }
  
  // Initialize reviews object if it doesn't exist
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }
  
  // Add/update review with username as key
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: "Review submitted successfully",
    username: username,
    isbn: isbn,
    review: review
  });
});
// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const accessToken = req.session.authorization;
  try{
      const username = jwt.verify(accessToken, "access");
      if(!books[isbn]?.reviews?.[username]){
      return res.status(404).json({message: "No review found"});
      }
      delete books[isbn].reviews[username];
      res.status(200).json({
        message: "Review Deleted",
        book: books[isbn]
      })
  }catch(err){
    res.status(401).json({message : "Invalid/Expired Token"});
  }

});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;