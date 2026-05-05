require('dotenv').config();
const mongoose = require('mongoose');
const Meme = require('../models/Meme');
const memesData = require('../data/memes.json');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Meme.deleteMany({});
  console.log('Cleared existing memes');

  await Meme.insertMany(memesData);
  console.log(`✅ Seeded ${memesData.length} memes`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
