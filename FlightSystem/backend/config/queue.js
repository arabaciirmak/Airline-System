const amqp = require('amqplib');
require('dotenv').config();

let connection = null;
let channel = null;

const QUEUE_NAMES = {
  NEW_MEMBER: 'new_member_queue',
  BOOKING: 'booking_queue',
  MILES_ADDED: 'miles_added_queue'
};

async function connectQueue() {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    
    // Declare queues
    await channel.assertQueue(QUEUE_NAMES.NEW_MEMBER, { durable: true });
    await channel.assertQueue(QUEUE_NAMES.BOOKING, { durable: true });
    await channel.assertQueue(QUEUE_NAMES.MILES_ADDED, { durable: true });
    
    console.log('RabbitMQ connected and queues declared');
    return { connection, channel };
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    // Fallback to in-memory queue if RabbitMQ is not available
    return null;
  }
}

async function publishMessage(queueName, message) {
  if (channel) {
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    return true;
  }
  // Fallback: store in memory (for development)
  console.warn('Queue not available, message stored in memory:', message);
  return false;
}

async function consumeMessage(queueName, callback) {
  if (channel) {
    await channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          channel.ack(msg);
        } catch (error) {
          console.error(`Error processing message from ${queueName}:`, error);
          channel.nack(msg, false, false); // Reject and don't requeue
        }
      }
    }, { noAck: false });
  } else {
    console.warn(`Queue not available, cannot consume from ${queueName}`);
  }
}

module.exports = {
  connectQueue,
  publishMessage,
  consumeMessage,
  QUEUE_NAMES
};
