import Razorpay from 'razorpay';
import { allowCors } from './utils/cors.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TGW27NmzmuAvsg',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'HD1uBdFArQCa48gBjj1RXFp9'
});

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: receipt || `order_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default allowCors(handler);
