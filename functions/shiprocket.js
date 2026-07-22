const axios = require('axios');
const functions = require('firebase-functions');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/payload';

/**
 * Get Shiprocket Authentication Token
 */
async function getShiprocketToken() {
  try {
    // We can use process.env or functions.config()
    // Let's use functions.config() as it's standard for Firebase Functions v1
    const email = process.env.SHIPROCKET_EMAIL || functions.config().shiprocket?.email;
    const password = process.env.SHIPROCKET_PASSWORD || functions.config().shiprocket?.password;

    if (!email || !password) {
      throw new Error('Shiprocket credentials not configured');
    }

    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

/**
 * Check Serviceability for a Pin Code
 */
async function checkServiceability(pickup_postcode, delivery_postcode, weight, cod = 0) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.get(`${BASE_URL}/courier/serviceability/`, {
      params: {
        pickup_postcode,
        delivery_postcode,
        weight,
        cod
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
    throw new Error('Failed to check serviceability');
  }
}

/**
 * Create a Shiprocket Custom Order
 */
async function createShiprocketOrder(orderData) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    throw new Error('Failed to create Shiprocket order');
  }
}

module.exports = {
  getShiprocketToken,
  checkServiceability,
  createShiprocketOrder
};
