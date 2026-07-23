import axios from 'axios';

let shiprocketToken = null;
let tokenExpiry = null;

export const authenticateShiprocket = async () => {
  try {
    if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
      return shiprocketToken;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      console.warn("Shiprocket credentials not provided in environment variables.");
      return null;
    }

    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email,
      password
    });

    shiprocketToken = response.data.token;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 9);
    tokenExpiry = expiryDate;

    return shiprocketToken;
  } catch (error) {
    console.error('Shiprocket authentication failed:', error.response?.data || error.message);
    throw error;
  }
};

export const createShiprocketOrder = async (orderData) => {
  try {
    const token = await authenticateShiprocket();
    if (!token) return null;

    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create Shiprocket order:', error.response?.data || error.message);
    throw error;
  }
};

export const generateAWB = async (shipmentId) => {
  try {
    const token = await authenticateShiprocket();
    if (!token) return null;

    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      shipment_id: shipmentId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to generate AWB:', error.response?.data || error.message);
    throw error;
  }
};
