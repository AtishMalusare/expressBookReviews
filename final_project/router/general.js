const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  
  // Check if user already exists
  if (isValid(username)) {
    return res.status(409).json({message: "User Already Exists"});
  }
  
  users.push({username, password});
  return res.status(200).json({message: "User Successfully Added"});
});

// Get the book list available in the shop using async
public_users.get('/async-books', function (req, res) {
  const getBooksAsync = (callback) =>{
    setTimeout(()=>{
      callback(null, books);
    },1000); //simulate async opt
  };
  getBooksAsync((err, books) =>{
    if (err) { 
      return res.status(500).json({message: "Error Fetching books"});
    }
      res.status(200).json(books);
  });
});
// using normal get all books
public_users.get('/',function (req,res){
  return res.status(200).json(books);
})
// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  
  if (!book) {
    return res.status(404).json({message: "No Book Found"});
  }
  
  return res.status(200).json(book);
});
//using via promise
public_users.get('/promise/isbn/:isbn', function (req, res) {
  const getBookByISBN = (isbn) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const book = books[isbn];
        if (book) {
          resolve(book);
        } else {
          reject("Book not found");
        }
      }, 1000);
    });
  };

  getBookByISBN(req.params.isbn)
    .then(book => res.status(200).json(book))
    .catch(err => res.status(404).json({message: err}));
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  // Decode URL-encoded author name and trim whitespace
  const author = decodeURIComponent(req.params.author).trim().toLowerCase();
  const matchingBooks = [];

  // Iterate through books
  for (const isbn in books) {
    const book = books[isbn];
    // Check if book has an author and compare in lowercase
    if (book.author?.trim().toLowerCase() === author) {
      matchingBooks.push({...book, isbn});
    }
  }

  if (matchingBooks.length > 0) {
    res.status(200).json({ books: matchingBooks });
  } else {
    res.status(404).json({ 
      message: `No books found by author '${req.params.author}'`
    });
  }
});

// using promise
public_users.get('/author/:author', function (req, res) {
  const getBooksByAuthor = (author) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredBooks = Object.values(books).filter(book => 
          book.author.toLowerCase() === author.toLowerCase()
        );
        filteredBooks.length > 0 
          ? resolve(filteredBooks) 
          : reject("No books found");
      }, 1000);
    });
  };
  getBooksByAuthor(req.params.author)
    .then(books => res.status(200).json({books}))
    .catch(err => res.status(404).json({message: err}));
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  // Decode URL-encoded title and normalize case
  const title = decodeURIComponent(req.params.title).trim().toLowerCase();
  const matchingBooks = [];

  // Iterate through all books
  for (const isbn in books) {
    const book = books[isbn];
    // Check if book exists and compare titles case-insensitively
    if (book.title?.trim().toLowerCase() === title) {
      matchingBooks.push({...book, isbn});
    }
  }

  if (matchingBooks.length > 0) {
    res.status(200).json({ books: matchingBooks });
  } else {
    res.status(404).json({ 
      message: `No books found with title '${req.params.title}'`
    });
  }
});
// using promise
public_users.get('/title/:title', function (req, res) {
  const getBooksByTitle = (title) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredBooks = Object.values(books).filter(book =>
          book.title.toLowerCase().includes(title.toLowerCase())
        );
        filteredBooks.length > 0
          ? resolve(filteredBooks)
          : reject("No books found");
      }, 1000);
    });
  };

  getBooksByTitle(req.params.title)
    .then(books => res.status(200).json({books}))
    .catch(err => res.status(404).json({message: err}));
});

// Get book reviews
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  
  if (!book) {
    return res.status(404).json({message: "Book not found"});
  }
  
  const reviews = book.reviews || {};
  return res.status(200).json(reviews);
});

module.exports.general = public_users;


