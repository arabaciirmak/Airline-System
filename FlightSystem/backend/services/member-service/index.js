const express = require('express');
const cors = require('cors');
const { Member, MilesTransaction } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { publishMessage, QUEUE_NAMES } = require('../../config/queue');
const { sendEmail, getWelcomeEmailTemplate } = require('../../config/email');
require('dotenv').config();

const app = express();
const PORT = process.env.MEMBER_SERVICE_PORT || 3002;

app.use(cors());
app.use(express.json());

function generateMemberNumber() {
  return 'MS' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// GET /api/v1/Member/profile
app.get('/api/v1/Member/profile', authenticate, async (req, res) => {
  try {
    const member = await Member.findOne({
      where: { cognitoUserId: req.user.sub }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      milesPoints: member.milesPoints
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/Member/register
app.post('/api/v1/Member/register', authenticate, async (req, res) => {
  try {
    const { firstName, middleName, lastName, dateOfBirth, email } = req.body;

    // Check if member already exists
    const existingMember = await Member.findOne({
      where: { cognitoUserId: req.user.sub }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Member already registered' });
    }

    const memberNumber = generateMemberNumber();
    const member = await Member.create({
      memberNumber,
      cognitoUserId: req.user.sub,
      firstName,
      middleName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      email: email || req.user.email,
      milesPoints: 0
    });

    // Add to queue for welcome email
    await publishMessage(QUEUE_NAMES.NEW_MEMBER, {
      memberId: member.id,
      memberNumber: member.memberNumber,
      email: member.email,
      firstName: member.firstName
    });

    res.status(201).json({
      memberNumber: member.memberNumber,
      message: 'Member registered successfully'
    });
  } catch (error) {
    console.error('Member registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/Member/add-miles (for external airlines - authenticated)
app.post('/api/v1/Member/add-miles', authenticate, async (req, res) => {
  try {
    const { memberNumber, miles, description } = req.body;

    if (!memberNumber || !miles) {
      return res.status(400).json({ error: 'memberNumber and miles are required' });
    }

    const member = await Member.findOne({
      where: { memberNumber }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Add miles
    member.milesPoints += parseInt(miles);
    await member.save();

    // Create transaction record
    await MilesTransaction.create({
      memberId: member.id,
      miles: parseInt(miles),
      transactionType: 'external',
      description: description || 'External airline miles'
    });

    res.json({
      memberNumber: member.memberNumber,
      newBalance: member.milesPoints,
      message: 'Miles added successfully'
    });
  } catch (error) {
    console.error('Add miles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/Member/:memberNumber
app.get('/api/v1/Member/:memberNumber', authenticate, async (req, res) => {
  try {
    const member = await Member.findOne({
      where: { memberNumber: req.params.memberNumber }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      milesPoints: member.milesPoints
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Member Service running on port ${PORT}`);
});

module.exports = app;
