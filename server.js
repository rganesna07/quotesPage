//all the requires
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); //need to use cookies
const fs = require('fs');
const path = require('path');

const app = express();
const port = 4000; //local port

app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//get the directory to the quotes and extract quotedata from that path
const quoteDataPath = path.join(__dirname, 'quoteData.json');
let quoteData = require(quoteDataPath); //quotes
let userData = require("./userData.json"); //user credentials

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(cookieParser());
app.use(express.static('public'));

//home page path
app.get('/', (req, res) => {
  const username = req.cookies.username;
  res.status(200).render("homePage", { username });
});

//login page path
app.get('/loginPage', function(req, res, next){
  res.status(200).render("loginPage");
});

//quotes page path
app.get('/quotes', (req, res) => {
  const username = req.cookies.username;
  if (username) {
    const categories = Object.keys(quoteData).map(key => quoteData[key].category);
    res.status(200).render('quotes', { username, categories });
  } else {
    res.redirect('/loginPage');
  }
});

//the specfic categories
app.get('/quotes/:category', (req, res) => {
  const username = req.cookies.username;
  const category = req.params.category;
  const quotes = quoteData[category.toLowerCase()];

  //get the categories
  if (username && quotes) {
    res.status(200).render('category', { 
      username,
      category: quotes.category, 
      quotes: quotes.quote_list 
    });
  } else {
    res.redirect('/quotes');
  }
});

//adds a new quote in the category chosen
// Validates input, adds the quote to the category, and updates the JSON file
// Responds with the updated quote list for the specified category
app.post('/addQuote/:category', (req, res) => {
  const category = req.params.category.toLowerCase();
  const { quote, author } = req.body;

  // Validate input
  if (!quote || !author) {
    return res.status(400).send('Both quote and author are required.');
  }

 // Add the new quote to the specified category
  if (quoteData[category]) {
    quoteData[category].quote_list.push({ quote, author });
  } else {
    return res.status(404).send('Category not found.');
  }

  
  // Write the updated quote data to the JSON file
  fs.writeFile(quoteDataPath, JSON.stringify(quoteData, null, 2), (err) => {
    if (err) {
      console.error("Error writing to file", err);
      return res.status(500).send("Internal Server Error");
    }


    res.status(200).json({ quotes: quoteData[category].quote_list });
  });
});

//logout -> go back to home page before user was loggde in
app.get('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});

//path to handle login form submission
app.post('/loginInfo', (req, res) => {
  const { username, password } = req.body;
  const user = userData[username];
  let error = ''; //initialize empty strin g
  if (!user && password !== '') {
    error = 'Invalid username and password combination'; //change string based on error msg
  } else if (user && user.password !== password) {
    error = 'Invalid password';
  } 

  if (error) {
    res.render('loginPage', { error });
  } else {
    res.cookie('username', username);
    console.log(username);
    res.redirect('/quotes'); //redirect to quotes if the credentilas are valid
  }
});

app.listen(port, function (err) {
  if (err) {
    throw err;
  }
  console.log(`Server is running on http://localhost:${port}`);
});
