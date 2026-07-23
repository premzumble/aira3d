import * as XLSX from 'xlsx';
import { formatDate } from './formatHelpers.js';

export function exportOrdersToExcel(orders) {
  if (!orders || orders.length === 0) return;

  const data = orders.map(order => {
    const oid = order.orderId || order.id;
    const items = order.items || order.cartItems || [];
    const customerInfo = order.customerInfo || {};
    const date = order.date;
    const dateStr = date
      ? formatDate(date.seconds ? date.seconds * 1000 : date)
      : 'N/A';
    const productSummary = items.map(i => i.name || i.productName || 'Product').join(', ');
    return {
      'Order ID': oid,
      'Date': dateStr,
      'Customer Name': customerInfo.fullName || order.customerName || 'N/A',
      'Email': customerInfo.email || order.customerEmail || 'N/A',
      'Phone': customerInfo.mobileNumber || order.customerPhone || 'N/A',
      'Address': [customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.pinCode].filter(Boolean).join(', ') || 'N/A',
      'Products': productSummary || 'N/A',
      'Quantity': items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      'Subtotal': items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0),
      'Shipping': order.shipping || 100,
      'Total Amount': order.totalAmount || order.amount || 0,
      'Payment Method': order.paymentMethod || 'Online Payment',
      'Status': order.status || 'Pending',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, `Aira3D_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
}
