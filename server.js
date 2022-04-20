// default
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// get config from env
const config = require("./config/config.json");
global.gConfig = config[process.env.NODE_ENV]; // config from env

// parser to json
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// cors option
/*
const cors = require("cors");
const corsOptions = {};
app.use(cors(corsOptions));
*/

// routing
require("./routes/index")(app);

// running
app.listen(global.gConfig.port, () => {
    // console.log(global.gConfig);
    console.log(`Server is running on port ${global.gConfig.port}.`);
});