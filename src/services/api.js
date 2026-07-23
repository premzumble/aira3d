/**
 * Centralized API Service for communicating with the Vercel Serverless Backend.
 */

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error("VITE_API_URL is not configured in environment variables.");
    throw new Error("API URL not configured. Please set VITE_API_URL.");
  }
  return apiUrl;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = "Server unavailable.";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // Non-JSON response
      if (response.status === 502) errorMessage = "Payment server unreachable.";
      if (response.status === 404) errorMessage = "Backend API endpoint not found.";
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const apiService = {
  createRazorpayOrder: async (orderData) => {
    try {
      const response = await fetch(`${getApiUrl()}/createRazorpayOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return handleResponse(response);
    } catch (error) {
      if (error.message.toLowerCase().includes('failed to fetch')) {
        throw new Error("Cannot connect to backend. Network unavailable.");
      }
      throw error;
    }
  },

  verifyPayment: async (verificationData) => {
    try {
      const response = await fetch(`${getApiUrl()}/verifyPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });
      return handleResponse(response);
    } catch (error) {
      if (error.message.toLowerCase().includes('failed to fetch')) {
        throw new Error("Cannot connect to backend. Network unavailable.");
      }
      throw error;
    }
  },

  addToGoogleSheets: async (registrationData) => {
    try {
      const response = await fetch(`${getApiUrl()}/addToGoogleSheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      return handleResponse(response);
    } catch (error) {
      if (error.message.toLowerCase().includes('failed to fetch')) {
        throw new Error("Cannot connect to backend. Network unavailable.");
      }
      throw error;
    }
  }
};
