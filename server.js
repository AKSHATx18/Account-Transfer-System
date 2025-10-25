const express = require('express');
const mongoose = require('mongoose');
const Account = require('./models/Account');

const app = express();
app.use(express.json());

mongoose
  .connect('mongodb://localhost:27017/bankDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

async function createSampleAccounts() {
  const count = await Account.countDocuments();
  if (count === 0) {
    await Account.create([
      { name: 'Alice', balance: 1000 },
      { name: 'Bob', balance: 500 }
    ]);
    console.log('💾 Sample accounts created.');
  }
}
createSampleAccounts();

app.post('/transfer', async (req, res) => {
  try {
    const { senderName, receiverName, amount } = req.body;

    if (!senderName || !receiverName || !amount) {
      return res.status(400).json({ error: 'Please provide senderName, receiverName, and amount.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Transfer amount must be greater than 0.' });
    }

    const sender = await Account.findOne({ name: senderName });
    const receiver = await Account.findOne({ name: receiverName });

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'Sender or Receiver account not found.' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance in sender account.' });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({
      message: `Transfer successful! ₹${amount} transferred from ${senderName} to ${receiverName}.`,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance
    });
  } catch (err) {
    console.error('Error during transfer:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/accounts', async (req, res) => {
  const accounts = await Account.find();
  res.json(accounts);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
