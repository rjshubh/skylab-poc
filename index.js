const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.port || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();


//Set reponse
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}


//Make reuqets to github to fetch data
async function getRepos(req, res, next){
    try {
        console.log('Fetching data...');

        const{ username }=req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;

        // Set data to redis with expiration of 1 hour
        client.setex(username, 3600, repos); // key, expirn, value


        res.send(setResponse(username, repos));
        
    } catch (err) {
        console.log(err);
    }
}

// Cache middleware to store the value in cache
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next(); // go forward and make the actual request
    }
  });
}

app.get('/repos/:username', cache, getRepos);


app.listen(5000, () => {
    console.log(`App listening on ${PORT}`);
});


