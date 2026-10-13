import crypto from 'crypto';
import { db, FieldValue } from './utils/firebaseAdmin.js';
import { allowCors } from './utils/cors.js';
import { createShiprocketOrder, generateAWB } from './utils/shiprocket.js';

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'HD1uBdFArQCa48gBjj1RXFp9';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId, enrollmentId, courseId } = req.body;

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
          
          if (orderData.status !== 'Pending') {
            return res.status(200).json({
              success: true,
              message: 'Order already processed'
            });
          }
          
          // 1. Update order status
          await orderRef.update({
            status: 'Paid',
            paymentId: razorpay_payment_id,
            paidAt: FieldValue.serverTimestamp(),
            statusHistory: FieldValue.arrayUnion({
              status: 'Payment Confirmed',
              timestamp: new Date().toISOString(),
              updatedBy: 'system',
              note: 'Payment successfully verified via Razorpay.'
            })
          });

          // 2. Decrement inventory
          if (orderData.items && Array.isArray(orderData.items)) {
            const batch = db.batch();
            orderData.items.forEach(item => {
              const productRef = db.collection('products').doc(item.id);
              batch.update(productRef, {
                stock: FieldValue.increment(-item.quantity)
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

              const trackingUrl = awbData?.response?.data?.awb_code ? `https://shiprocket.co/tracking/${awbData.response.data.awb_code}` : null;
              const courier = awbData?.response?.data?.courier_name || null;
              const awb = awbData?.response?.data?.awb_code || null;

              await orderRef.update({
                status: 'Shipped',
                shiprocketOrderId: srResponse.order_id,
                shiprocketShipmentId: srResponse.shipment_id,
                shiprocketStatus: srResponse.status,
                shiprocketAwbCode: awb,
                shiprocketCourierName: courier,
                shiprocketTrackingUrl: trackingUrl,
                statusHistory: FieldValue.arrayUnion({
                  status: 'Shipped',
                  timestamp: new Date().toISOString(),
                  updatedBy: 'system',
                  note: `Package shipped via ${courier || 'Courier'}. AWB: ${awb || 'N/A'}`
                })
              });
            }
          } catch (srError) {
            console.error("Error creating Shiprocket order:", srError);
          }
        }
      }

      // If this is a Course Enrollment, process it securely on the backend
      if (enrollmentId) {
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const enrollmentDoc = await enrollmentRef.get();

        if (enrollmentDoc.exists) {
          const enrollData = enrollmentDoc.data();
          
          // 0. Idempotency Check: Do not re-process if already confirmed
          if (enrollData.enrollmentStatus === 'Confirmed') {
            return res.status(200).json({
              success: true,
              message: 'Payment verified and enrollment already processed'
            });
          }
          
          // 1. & 2. Atomic Batch Update: Enrollment Status & Seat Count
          const batch = db.batch();

          batch.update(enrollmentRef, {
            paymentStatus: 'Paid',
            enrollmentStatus: 'Confirmed',
            paymentId: razorpay_payment_id,
            updatedAt: FieldValue.serverTimestamp()
          });

          if (courseId) {
            const courseRef = db.collection('courses').doc(courseId);
            batch.update(courseRef, {
              enrolledCount: FieldValue.increment(1)
            });
          }

          try {
            await batch.commit();
          } catch (dbErr) {
            console.error("Atomic database update failed:", dbErr);
            throw new Error("Failed to finalize database records");
          }

          // 3. Send Email Confirmation
          try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
              await transporter.sendMail({
                from: `"Aira3D Courses" <${process.env.SMTP_USER}>`,
                to: enrollData.email,
                subject: `Enrollment Confirmed: ${enrollData.courseTitle}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f97316;">Welcome to Aira3D, ${enrollData.fullName}!</h2>
                    <p>Your enrollment has been successfully confirmed.</p>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0;">Course Details</h3>
                      <p><strong>Course:</strong> ${enrollData.courseTitle}</p>
                      <p><strong>Amount Paid:</strong> ₹${enrollData.amount}</p>
                      <p><strong>Order ID:</strong> ${enrollmentId}</p>
                      <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                    </div>
                    <p>You can now access your course content from your dashboard.</p>
                    <p>Happy Learning!<br>The Aira3D Team</p>
                  </div>
                `
              });
            } else {
              console.warn("SMTP credentials not provided. Email not sent.");
            }
          } catch (emailErr) {
            console.error("Email failed:", emailErr);
          }

          // 4. Send WhatsApp Confirmation (if configured)
          try {
            const waToken = process.env.WHATSAPP_API_TOKEN;
            const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
            if (waToken && waPhoneId && enrollData.phone) {
              // Format phone number to E.164 (strip non-digits, ensure country code)
              let toPhone = enrollData.phone.replace(/\D/g, '');
              if (toPhone.length === 10) toPhone = '91' + toPhone;

              await fetch(`https://graph.facebook.com/v17.0/${waPhoneId}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${waToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: toPhone,
                  type: "template",
                  template: {
                    name: "course_enrollment_confirmation", // Replace with your approved template name
                    language: { code: "en" },
                    components: [
                      {
                        type: "body",
                        parameters: [
                          { type: "text", text: enrollData.fullName },
                          { type: "text", text: enrollData.courseTitle }
                        ]
                      }
                    ]
                  }
                })
              });
            } else {
              console.warn("WhatsApp credentials or phone number missing. WhatsApp not sent.");
            }
          } catch (waErr) {
            console.error("WhatsApp failed:", waErr);
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
