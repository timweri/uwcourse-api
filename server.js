const express = require('express');
const app = express();

const mongoose = require('mongoose');
mongoose.connect('mongodb://db-mongo:27017/uwcourseapi', {useNewUrlParser: true});

const PORT = 5000;

app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
