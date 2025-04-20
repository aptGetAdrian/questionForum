// seed.js
// Script to generate mock data for Users, Questions, Comments, and SubComments

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Models
const User = require('./models/userModel.js');
const Question = require('./models/questionsModel.js');
const Comment = require('./models/commentsModel.js');
const SubComment = require('./models/subCommentModel.js');

// Configuration
const MONGO_URI = 'mongodb://127.0.0.1/vaja3';
const NUM_USERS = 50;
const NUM_QUESTIONS = 100;
const MAX_COMMENTS_PER_QUESTION = 10;
const MAX_SUBCOMMENTS_PER_COMMENT = 5;

async function seed() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Question.deleteMany({});
  await Comment.deleteMany({});
  await SubComment.deleteMany({});

  // Create users
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const user = new User({
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      profilePicture: faker.image.avatar()
    });
    users.push(await user.save());
  }
  console.log(`Created ${users.length} users`);

  // Create questions
  const questions = [];
  for (let i = 0; i < NUM_QUESTIONS; i++) {
    const author = faker.helpers.arrayElement(users);
    const q = new Question({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
      author: author._id,
      createdAt: faker.date.recent(30),
      views: faker.number.int({ min: 0, max: 500 }),
      lastActivity: faker.date.recent(7)
    });
    questions.push(await q.save());
  }
  console.log(`Created ${questions.length} questions`);

  // Create comments and subcomments
  let totalComments = 0;
  let totalSubComments = 0;

  for (const q of questions) {
    const numComments = faker.number.int({ min: 0, max: MAX_COMMENTS_PER_QUESTION });
    for (let j = 0; j < numComments; j++) {
      const author = faker.helpers.arrayElement(users);
      const comment = new Comment({
        content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
        author: author._id,
        question: q._id,
        createdAt: faker.date.between({ from: q.createdAt, to: new Date() }),
        score: faker.number.int({ min: -5, max: 20 }),
        voters: []
      });
      const savedComment = await comment.save();
      totalComments++;

      // SubComments
      const numSub = faker.number.int({ min: 0, max: MAX_SUBCOMMENTS_PER_COMMENT });
      for (let k = 0; k < numSub; k++) {
        const subAuthor = faker.helpers.arrayElement(users);
        const sub = new SubComment({
          content: faker.lorem.sentence(),
          author: subAuthor._id,
          question: q._id,
          comment: savedComment._id,
          createdAt: faker.date.between({ from: savedComment.createdAt, to: new Date() })
        });
        await sub.save();
        totalSubComments++;
        savedComment.subComments.push(sub._id);
      }
      await savedComment.save();
    }
  }
  console.log(`Created ${totalComments} comments and ${totalSubComments} subcomments`);

  await mongoose.connection.close();
  console.log('Seeding complete. Connection closed.');
}

seed().catch(err => {
  console.error(err);
  mongoose.connection.close();
});