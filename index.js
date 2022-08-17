const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const Redis = require("redis");

const DEFAULT_EXPIRY_TIME = 3600;

const redisClient = Redis.createClient();

const port = 9000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

(async () => {
  await redisClient.connect();
})();

app.get("/photos", async (req, res) => {
  const photos = await redisClient.get("photos");

  if (photos !== null) {
    console.log("cache hit");
    return res.send(JSON.parse(photos));
  } else {
    console.log("cache miss");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos"
    );

    await redisClient.setEx(
      "photos",
      DEFAULT_EXPIRY_TIME,
      JSON.stringify(data)
    );
    return res.send(JSON.stringify(data));
  }
});

app.get("/photos/:id", async (req, res) => {
  const id = req.params.id;

  const photo = await redisClient.get(`photo/${id}`);

  if (photo !== null) {
    console.log("cache hit");
    return res.send(JSON.parse(photo));
  } else {
    console.log("cache miss");
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${id}`
    );

    await redisClient.setEx(
      `photo/${id}`,
      DEFAULT_EXPIRY_TIME,
      JSON.stringify(data)
    );
    return res.send(JSON.stringify(data));
  }
});

app.listen(port, () => console.log(`My app listening on port ${port}!`));
