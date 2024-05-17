const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const dotenv = require("dotenv");


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

dotenv.config();

const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;


// MongoDB connection URI
// const uri = `mongodb+srv://${username}:${password}@cluster0.9ar5xe5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${username}:${password}@cluster0.q3nnrm3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'templates')));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

async function fetchWithRetry(url, options = {}, retries = 25, backoff = 300) {
  const fetch = (await import('node-fetch')).default;

  try {
      const response = await fetch(url, options);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
  } catch (error) {
      console.log(`Fetch attempt failed with error: ${error.message}, retrying... Attempts left: ${retries - 1}`);
      if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          return fetchWithRetry(url, options, retries - 1, backoff * 2);
      } else {
          throw new Error('Max retries reached. ' + error.message);
      }
  }
}

app.get("/", (req, res) => {
  const url = "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1";
  const options = {
    method: "GET",
    headers: {
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NDUwZjc2YWM4OTJlMmYxMWJmMThlOTY4N2Q4MTZlNSIsInN1YiI6IjY2MzU2Y2U3NjY1NjVhMDEyODE0YjZjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oRaqRpBYSpYWZRM-FYFBVkTbsX_eGSsx1Njb2fogCpk",
      Accept: "application/json",
    }
  };
  
  fetchWithRetry(url, options, retries=3, backoff=300)
  .then(data => {
    // Pass the movie data to the index.ejs template
    res.render("index", { movies: data.results });
  })
  .catch(error => {
    console.error('There was a problem with your fetch operation:', error);
    // In case of error, render the index page with an empty movie list
    res.render("index", { movies: [] });
  });
});

// Express route to render the movie page
// Express route to render the movie page
app.get("/movie/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NDUwZjc2YWM4OTJlMmYxMWJmMThlOTY4N2Q4MTZlNSIsInN1YiI6IjY2MzU2Y2U3NjY1NjVhMDEyODE0YjZjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oRaqRpBYSpYWZRM-FYFBVkTbsX_eGSsx1Njb2fogCpk",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const movie = await response.json();
    res.render("movie", { movie });
  } catch (error) {
    console.error("Error fetching movie data:", error);
    res.status(500).send("Error fetching movie data");
  }
});


// POST endpoint for search
app.post('/search', async (req, res) => {
  try {
      // Extract the search query from the request body
      const { query } = req.body;

      // Make a fetch request to the TMDB API
      const response = await fetch(`https://api.themoviedb.org/3/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NDUwZjc2YWM4OTJlMmYxMWJmMThlOTY4N2Q4MTZlNSIsInN1YiI6IjY2MzU2Y2U3NjY1NjVhMDEyODE0YjZjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oRaqRpBYSpYWZRM-FYFBVkTbsX_eGSsx1Njb2fogCpk",
            Accept: "application/json",
          },
          });

      const data = await response.json();

      res.render('search-results', { movies: data.results });
  } catch (error) {
      console.error('Error searching for movies:', error);
      res.status(500).send('Internal Server Error');
  }
});

// GET endpoint for displaying all movies in the watchlist
app.get('/watchlist', async (req, res) => {
  try {
      const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      await client.connect()
      .then(() => console.log('Connected successfully to MongoDB'))
      .catch(err => console.error('Failed to connect to MongoDB', err));

      const movies = await client.db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .find({}).toArray();

      await client.close();

      function formatRuntime(runtime) {
        const minutes = parseInt(runtime, 10);
        console.log(minutes)
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      }

      // Render the EJS template with the list of movies
      res.render('watchlist', { movies, formatRuntime });
  } catch (error) {
      console.error('Error fetching movies from watchlist:', error);
      res.status(500).send('Internal Server Error');
  }
});

// POST endpoint for adding a movie to the watchlist
app.post('/addToWatchlist', async (req, res) => {
  const { movieId, movieTitle, movieRuntime, posterPath } = req.body;
  console.log(req.body)

  async function main () {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    try {
      await client.connect();
      const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne({ movieId, movieTitle, movieRuntime, posterPath });

      res.redirect('/watchlist');
    } catch (e) {
      console.error(e);
    } finally {
      await client.close();
    }    
  }
  main().catch(console.error);
});

app.post('/removeFromWatchlist', async (req, res) => {
  const { movieId } = req.body;
  async function main () {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    try {
      await client.connect();
      const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteOne({ movieId: movieId });
      res.redirect('/watchlist');
    } catch (e) {
      console.error(e);
    } finally {
      await client.close();
    }    
  }
  main().catch(console.error);
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function processInput() {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    dataInput = dataInput.toString().trim();  // Convert buffer to string and trim whitespace
    console.log(`Received command: ${dataInput}`);  // Echo the command back to the user

    if (dataInput === "stop") {
      console.log("Shutting down the server");
      process.exit(0);  // It's usually better to exit with code 0 for normal shutdown
    } else {
      console.log(`Invalid command: ${dataInput}`);
      console.log("Type 'stop' to shutdown the server.");
    }
  }
}

process.stdin.on('readable', processInput);
