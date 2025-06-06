const mongoose = require('mongoose');
require('dotenv').config();

const mongoDB = async () => {
    await (
        mongoose.connect(process.env.MONGO_URL)
    );
};

module.exports = mongoDB;