import { addMessageToDb, getMessagesFromDb, markMessageReadInDb } from './api/lib/mongodb.js';

async function testMessages() {
  console.log('Testing adding message to MongoDB Atlas...');
  const msg = await addMessageToDb({
    name: 'Alex Johnson (Test Client)',
    email: 'alex.johnson@techcorp.com',
    subject: 'Cloud Architect Project Discussion',
    message: 'Hello Abdelrahman, I would like to inquire about your availability for a contract project starting next month.',
  });
  console.log('Saved message:', msg);

  console.log('Fetching messages from MongoDB...');
  const allMessages = await getMessagesFromDb();
  console.log('Total messages in DB:', allMessages.length);
  console.log('Latest message name:', allMessages[0]?.name);

  console.log('Testing mark message as read...');
  await markMessageReadInDb(msg.id, true);
  const updatedMessages = await getMessagesFromDb();
  console.log('Message read status:', updatedMessages[0]?.read);

  console.log('All message operations in MongoDB Atlas succeeded!');
}

testMessages().catch(console.error);
