import {
  addMessageToDb,
  getMessagesFromDb,
  markMessageReadInDb,
  deleteMessageFromDb,
} from './lib/mongodb.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Retrieve all messages
  if (req.method === 'GET') {
    try {
      const messages = await getMessagesFromDb();
      return res.status(200).json({ success: true, messages });
    } catch (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // POST: Add new message from contact form
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, email, subject, message } = payload || {};

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }

      const savedMessage = await addMessageToDb({ name, email, subject, message });
      return res.status(201).json({
        success: true,
        message: 'Message sent and saved to database successfully!',
        data: savedMessage,
      });
    } catch (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to save message to database',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // PATCH: Mark message as read/unread
  if (req.method === 'PATCH') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, read } = payload || {};

      if (!id) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      await markMessageReadInDb(id, read !== false);
      return res.status(200).json({ success: true, message: 'Message status updated' });
    } catch (err) {
      console.error('Error updating message status:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to update message status',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // DELETE: Delete a message by ID
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || {};
      let messageId = id;

      if (!messageId && req.body) {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        messageId = payload?.id;
      }

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      await deleteMessageFromDb(messageId);
      return res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
