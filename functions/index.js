const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
const Razorpay = require('razorpay');

admin.initializeApp();
const db = admin.firestore();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id || 'rzp_test_YourRazorpayKey',
  key_secret: functions.config().razorpay.key_secret || 'YourRazorpaySecret'
});

exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
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
  });
});

exports.verifyPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId } = req.body;

      const crypto = require('crypto');
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', razorpay.key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        
        // If this is an eCommerce order, process it
        if (firestoreOrderId) {
          const orderRef = db.collection('orders').doc(firestoreOrderId);
          const orderDoc = await orderRef.get();
          
          if (orderDoc.exists) {
            const orderData = orderDoc.data();
            
            // 1. Update order status
            await orderRef.update({
              status: 'Paid',
              paymentId: razorpay_payment_id,
              paidAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Decrement inventory
            if (orderData.items && Array.isArray(orderData.items)) {
              const batch = db.batch();
              orderData.items.forEach(item => {
                const productRef = db.collection('products').doc(item.id);
                // Only decrement if product still exists, though firestore increment handles non-existent gracefully if we use set with merge
                batch.update(productRef, {
                  stock: admin.firestore.FieldValue.increment(-item.quantity)
                });
              });
              await batch.commit().catch(e => console.error("Error updating inventory:", e));
            }

            // 3. Create Shiprocket order
            try {
              const { createShiprocketOrder } = require('./shiprocket');
              
              // Calculate total dimensions & weight
              let totalWeight = 0;
              let maxLength = 0;
              let maxWidth = 0;
              let maxHeight = 0;
              
              const orderItems = await Promise.all(orderData.items.map(async (item) => {
                // Fetch product for dimensions
                const pDoc = await db.collection('products').doc(item.id).get();
                const pData = pDoc.data() || {};
                
                const weight = parseFloat(pData.weight) || 0.5;
                totalWeight += weight * item.quantity;
                
                maxLength = Math.max(maxLength, parseFloat(pData.length) || 10);
                maxWidth = Math.max(maxWidth, parseFloat(pData.width) || 10);
                maxHeight = Math.max(maxHeight, parseFloat(pData.height) || 10);
                
                return {
                  name: item.name,
                  sku: pData.sku || item.id,
                  units: item.quantity,
                  selling_price: item.price,
                  discount: 0,
                  tax: 0,
                  hsn: 44111200
                };
              }));

              const shiprocketPayload = {
                order_id: orderData.orderId,
                order_date: new Date().toISOString().slice(0, 10),
                pickup_location: "Primary",
                channel_id: "",
                comment: `Customization: ${JSON.stringify(orderData.items.map(i => i.customData || {}))}`,
                billing_customer_name: orderData.customerInfo.fullName,
                billing_last_name: "",
                billing_address: orderData.customerInfo.address,
                billing_address_2: "",
                billing_city: orderData.customerInfo.city,
                billing_pincode: orderData.customerInfo.pinCode,
                billing_state: orderData.customerInfo.state,
                billing_country: "India",
                billing_email: orderData.customerInfo.email,
                billing_phone: orderData.customerInfo.mobileNumber,
                shipping_is_billing: true,
                order_items: orderItems,
                payment_method: "Prepaid",
                sub_total: orderData.totalAmount,
                length: maxLength,
                breadth: maxWidth,
                height: maxHeight,
                weight: totalWeight
              };

              const srResponse = await createShiprocketOrder(shiprocketPayload);
              
              // Update order with Shiprocket details
              if (srResponse && srResponse.order_id) {
                await orderRef.update({
                  shiprocketOrderId: srResponse.order_id,
                  shiprocketShipmentId: srResponse.shipment_id,
                  shiprocketStatus: srResponse.status,
                });
              }
            } catch (srError) {
              console.error("Error creating Shiprocket order:", srError);
              // We don't fail the payment verification if Shiprocket fails, 
              // we can manually sync it later or retry.
            }
          }
        }

        res.status(200).json({
          success: true,
          message: 'Payment verified successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

exports.addToGoogleSheets = functions.firestore
  .document('workshop_registrations/{registrationId}')
  .onCreate(async (snap, context) => {
    try {
      const registration = snap.data();
      const { google } = require('googleapis');
      
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: functions.config().google.client_email,
          private_key: functions.config().google.private_key.replace(/\\n/g, '\n')
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = functions.config().google.sheet_id;

      const values = [
        [
          registration.name,
          registration.email,
          registration.phone,
          registration.city,
          registration.experience,
          registration.workshopDate,
          registration.workshopTime,
          `₹${registration.amount}`,
          registration.status,
          registration.registeredAt ? registration.registeredAt.toDate().toLocaleString() : new Date().toLocaleString()
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values
        }
      });

      console.log('Registration added to Google Sheets');
      return null;
    } catch (error) {
      console.error('Error adding to Google Sheets:', error);
      return null;
    }
  });
