require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require("mongodb")
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const shortid = require('shortid')
const validUrl = require('valid-url')



const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;


//Middlewares
app.use(bodyParser.urlencoded({
  extended:false
}));
app.use(express.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//DB Connection

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser:true,
  useUnifiedTopology:true,
  serverSelectionTimeoutMS:6000

})

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error'));
connection.once('open', () => {
  console.log("Connected successfully")
});
//Schema and model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url:String,
  short_url:String}
);
const URL = mongoose.model("URL", urlSchema);

//API Routes
app.post('/api/shorturl/new', async function (req, res) {

  const url = req.body.url
  const urlCode = shortid.generate()

  // check if the url is valid or not
  if (!validUrl.isWebUri(url)) {
    res.status(401).json({
      error: 'invalid URL'
    })
  } else {
    try {
      // check if its already in the database
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        // if its not exist yet then create new one and response with the result
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server erorr...')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }
})

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
})
