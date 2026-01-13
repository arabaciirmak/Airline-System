const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Yaşar Airlines" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

function getWelcomeEmailTemplate(memberName, memberNumber) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #002060;">Welcome to Miles&Smiles!</h2>
      <p>Dear ${memberName},</p>
      <p>Thank you for joining Miles&Smiles! Your membership number is: <strong>${memberNumber}</strong></p>
      <p>Start earning miles on every flight and enjoy exclusive benefits.</p>
      <p>Best regards,<br>Yaşar Airlines Team</p>
    </div>
  `;
}

function getMilesAddedEmailTemplate(memberName, milesAdded, totalMiles) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #002060;">Miles Added to Your Account</h2>
      <p>Dear ${memberName},</p>
      <p>Great news! <strong>${milesAdded} miles</strong> have been added to your Miles&Smiles account.</p>
      <p>Your total miles balance is now: <strong>${totalMiles} miles</strong></p>
      <p>Thank you for flying with us!</p>
      <p>Best regards,<br>Yaşar Airlines Team</p>
    </div>
  `;
}

module.exports = {
  sendEmail,
  getWelcomeEmailTemplate,
  getMilesAddedEmailTemplate
};
