const fs = require("fs");
const path = require("path");

// require json file with animal data
const { animals } = require("./data/animals");
const express = require("express");
//instantiate the server
const app = express();

// =============== START OF MIDDLEWARE ===================
// parse incoming string or array data takes incoming POST data and converts it to key/value pairings that can be accessed in the req.body object.
//The extended: true option set inside the method call informs our server that there may be sub-array data nested in it as well,
//so it needs to look as deep into the POST data as possible to parse all of the data correctly.
app.use(express.urlencoded({ extended: true }));

// parse incoming JSON data
// The express.json() method we used takes incoming POST data in the form of JSON and parses it into the req.body JavaScript object.
// Both of the above middleware functions need to be set up every time you create a server that's looking to accept POST data.
app.use(express.json());

// instructs the server to make certain files readily available and to not gate it behind a server endpoint.
// All front of our frontend (css/java/images/ect in the 'public folder') will now be available.
// provide a file path to a location in our application (in this case, the public folder) and instruct the server to make these files static resources.
app.use(express.static('public'));

// =============== END OF MIDDLEWARE ===================

//filter
function filterByQuery(query, animalsArray) {
  let personalityTraitsArray = [];
  // Note that we save the animalsArray as filteredResults here:
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    // Save personalityTraits as a dedicated array.
    // If personalityTraits is a string, place it into a new array and save.
    if (typeof query.personalityTraits === "string") {
      personalityTraitsArray = [query.personalityTraits];
    } else {
      personalityTraitsArray = query.personalityTraits;
    }
    // Loop through each trait in the personalityTraits array:
    personalityTraitsArray.forEach((trait) => {
      // Check the trait against each animal in the filteredResults array.
      // Remember, it is initially a copy of the animalsArray,
      // but here we're updating it for each trait in the .forEach() loop.
      // For each trait being targeted by the filter, the filteredResults
      // array will then contain only the entries that contain the trait,
      // so at the end we'll have an array of animals that have every one
      // of the traits when the .forEach() loop is finished.
      filteredResults = filteredResults.filter(
        (animal) => animal.personalityTraits.indexOf(trait) !== -1
      );
    });
  }
  if (query.diet) {
    filteredResults = filteredResults.filter(
      (animal) => animal.diet === query.diet
    );
  }
  if (query.species) {
    filteredResults = filteredResults.filter(
      (animal) => animal.species === query.species
    );
  }
  if (query.name) {
    filteredResults = filteredResults.filter(
      (animal) => animal.name === query.name
    );
  }
  // return the filtered results:
  return filteredResults;
}

// returns animal at stated index number
function findById(id, animalsArray) {
  const result = animalsArray.filter((animal) => animal.id === id)[0];
  return result;
}

//route to get all animals with a query
app.get("/api/animals", (req, res) => {
  let results = animals;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
});
//route to get single animal with a param
app.get("/api/animals/:id", (req, res) => {
  const result = findById(req.params.id, animals);
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

// function to take animal from post and store in JSON file

function createNewAnimal(body, animalsArray) {
  const animal = body;
  animalsArray.push(animal);
  fs.writeFileSync(
    path.join(__dirname, "./data/animals.json"),
    JSON.stringify({ animals: animalsArray }, null, 2)
  );
  return animal;
}

//route that accepts data
app.post("/api/animals", (req, res) => {
  // set id based on the what the next index of the array will be
  req.body.id = animals.length.toString();

  // if any data in req.body is incorrect, send 400 error back
  if (!validateAnimal(req.body)) {
    res.status(400).send("The animal is not properly formatted.");
  } else {
    // add animal to json file and aminals array into this function
    const animal = createNewAnimal(req.body, animals);

    res.json(animal);
  }
});

function validateAnimal(animal) {
  if (!animal.name || typeof animal.name !== "string") {
    return false;
  }
  if (!animal.species || typeof animal.species !== "string") {
    return false;
  }
  if (!animal.diet || typeof animal.diet !== "string") {
    return false;
  }
  if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
    return false;
  }
  return true;
}

// "/" brings user to the root of the server.
// which then directs user to index.html file. 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});
// directs user to zookeepers page
app.get('/zookeepers', (req, res) => {
  res.sendFile(path.join(__dirname, './public/zookeepers.html'));
});
// '/animals directs user to animals.html page'
app.get("/animals", (req, res) => {
  res.sendFile(path.join(__dirname, './public/animals.html'));
});



//Port location
const PORT = process.env.PORT || 3001;

//listen for requests
app.listen(PORT, () => {
  console.log(`API server now on port ${PORT}`);
});


//