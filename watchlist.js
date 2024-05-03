const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection URI
const uri = "mongodb://localhost:27017";
const dbName = "movieWatchlist";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// Routes
app.get("/", (req, res) => {
  res.send("Hello World")
  // res.render("index");
});

// // Route to handle adding movies to watchlist
// app.post("/addMovie", async (req, res) => {
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   try {
//     await client.connect();
//     const db = client.db(dbName);
//     const collection = db.collection("movies");

//     const newMovie = {
//       title: req.body.title,
//       genre: req.body.genre,
//       releaseYear: req.body.releaseYear,
//     };

//     await collection.insertOne(newMovie);
//     console.log("Movie added to watchlist:", newMovie);
//     res.redirect("/");
//   } catch (err) {
//     console.log(err);
//     res.redirect("/");
//   } finally {
//     await client.close();
//   }
// });

// // Route to display watchlist
// app.get("/watchlist", async (req, res) => {
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   try {
//     await client.connect();
//     const db = client.db(dbName);
//     const collection = db.collection("movies");

//     const movies = await collection.find({}).toArray();
//     res.render("watchlist", { movies: movies });
//   } catch (err) {
//     console.log(err);
//   } finally {
//     await client.close();
//   }
// });

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
