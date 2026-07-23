import crypto from 'crypto';
import admin, { db } from './utils/firebaseAdmin.js';
import { allowCors } from './utils/cors.js';
import { createShiprocketOrder, generateAWB } from './utils/shiprocket.js';

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'HD1uBdFArQCa48gBjj1RXFp9';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
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
              batch.update(productRef, {
                stock: admin.firestore.FieldValue.increment(-item.quantity)
              });
            });
            await batch.commit().catch(e => console.error("Error updating inventory:", e));
          }

          // 3. Create Shiprocket order
          try {
            let totalWeight = 0;
            let maxLength = 0;
            let maxWidth = 0;
            let maxHeight = 0;
            
            const orderItems = await Promise.all(orderData.items.map(async (item) => {
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
            
            if (srResponse && srResponse.order_id) {
              let awbData = null;
              if (srResponse.shipment_id) {
                 awbData = await generateAWB(srResponse.shipment_id);
              }

              await orderRef.update({
                shiprocketOrderId: srResponse.order_id,
                shiprocketShipmentId: srResponse.shipment_id,
                shiprocketStatus: srResponse.status,
                shiprocketAwbCode: awbData?.response?.data?.awb_code || null,
                shiprocketCourierName: awbData?.response?.data?.courier_name || null,
                shiprocketTrackingUrl: awbData?.response?.data?.awb_code ? `https://shiprocket.co/tracking/${awbData.response.data.awb_code}` : null
              });
            }
          } catch (srError) {
            console.error("Error creating Shiprocket order:", srError);
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
}

export default allowCors(handler);
