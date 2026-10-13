import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatHelpers';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ShoppingBagIcon,
  MapPinIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Badge from '../components/ui/Badge';

export default function OrderDetails() {
  const { orderId } = useParams();
  const { currentUser, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  const uid = currentUser?.uid || user?.uid;

  // Safe tracking URL generator to prevent relative-link browser hijacking
  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // If it's a domain name (contains dots but no protocol)
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }
    // If it's just a code / tracking number, fallback to a default tracking page
    return `https://shiprocket.co/tracking/${trimmed}`;
  };

  // Real-time Order Synchronization Listener
  useEffect(() => {
    if (!uid || !orderId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    let unsubscribe;
    
    // Check if it's a Firestore Document ID (20 alphanumeric characters)
    const isDocId = !orderId.includes('-') && orderId.length >= 15;
    
    if (isDocId) {
      const orderRef = doc(db, 'orders', orderId);
      unsubscribe = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          // Strict security & ownership validation
          if (data.userId === uid || data.customerInfo?.userId === uid) {
            setOrder(data);
            setLoading(false);
          } else {
            setError('Unauthorized access. This order does not belong to you.');
            setLoading(false);
          }
        } else {
          fallbackQuery();
        }
      }, (err) => {
        console.error('Error in direct order listener:', err);
        fallbackQuery();
      });
    } else {
      fallbackQuery();
    }

    function fallbackQuery() {
      const cleanId = orderId.replace(/^#/, '');
      
      const q = query(
        collection(db, 'orders'),
        where('orderId', '==', cleanId),
        where('userId', '==', uid)
      );
      
      const unsubQ = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setLoading(false);
        } else {
          // Try legacy customerInfo.userId fallback
          const fallbackQ = query(
            collection(db, 'orders'),
            where('orderId', '==', cleanId),
            where('customerInfo.userId', '==', uid)
          );
          
          getDocs(fallbackQ).then((fallbackSnap) => {
            if (!fallbackSnap.empty) {
              const docSnap = fallbackSnap.docs[0];
              setOrder({ id: docSnap.id, ...docSnap.data() });
            } else {
              setOrder(null);
            }
            setLoading(false);
          }).catch((err) => {
            console.error('Legacy query error:', err);
            setOrder(null);
            setLoading(false);
          });
        }
      }, (err) => {
        console.error('Query listener error:', err);
        setError('Failed to fetch order details. Please try again.');
        setLoading(false);
      });
      
      unsubscribe = unsubQ;
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid, orderId]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-white rounded-3xl border border-gray-100"></div>
              <div className="h-96 bg-white rounded-3xl border border-gray-100"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-white rounded-3xl border border-gray-100"></div>
              <div className="h-48 bg-white rounded-3xl border border-gray-100"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error ? 'Access Denied' : 'Order Not Found'}</h2>
          <p className="text-gray-500 mb-6">{error || 'The order you are looking for does not exist or has been removed.'}</p>
          <Link to="/profile?tab=orders" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/20 transition-all">
            <ArrowLeftIcon className="w-5 h-5" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Normalized Status Flow & Timeline Mapping
  const getStatusIndex = (status) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'pending' || s === 'order placed') return 0;
    if (s === 'paid' || s === 'payment confirmed') return 1;
    if (s === 'processing') return 2;
    if (s === 'packed') return 3;
    if (s === 'shipped') return 4;
    if (s === 'out for delivery' || s === 'out-for-delivery') return 5;
    if (s === 'delivered' || s === 'completed') return 6;
    return -1;
  };

  const getTimelineSteps = () => {
    const isCancelled = order.status?.toLowerCase() === 'cancelled';
    const isReturned = order.status?.toLowerCase() === 'returned';
    const isRefunded = order.status?.toLowerCase() === 'refunded';

    const baseSteps = [
      { key: 'Order Placed', label: 'Order Placed', icon: ClockIcon },
      { key: 'Payment Confirmed', label: 'Payment Confirmed', icon: CreditCardIcon },
      { key: 'Processing', label: 'Processing', icon: ClockIcon },
      { key: 'Packed', label: 'Packed', icon: ShoppingBagIcon },
      { key: 'Shipped', label: 'Shipped', icon: TruckIcon },
      { key: 'Out For Delivery', label: 'Out for Delivery', icon: MapPinIcon },
      { key: 'Delivered', label: 'Delivered', icon: CheckCircleIcon }
    ];

    if (isCancelled) {
      return [
        ...baseSteps.slice(0, 2),
        { key: 'Cancelled', label: 'Order Cancelled', icon: ExclamationCircleIcon, color: 'text-red-500 bg-red-100 border-red-500' }
      ];
    }
    if (isReturned) {
      return [
        ...baseSteps,
        { key: 'Returned', label: 'Order Returned', icon: ArrowLeftIcon, color: 'text-orange-500 bg-orange-100 border-orange-500' }
      ];
    }
    if (isRefunded) {
      return [
        ...baseSteps,
        { key: 'Refunded', label: 'Refund Completed', icon: ShieldCheckIcon, color: 'text-green-500 bg-green-100 border-green-500' }
      ];
    }

    return baseSteps;
  };

  const findHistoryEvent = (key) => {
    if (!order.statusHistory) return null;
    return order.statusHistory.find(event => {
      const s = event.status?.toLowerCase();
      if (key === 'Order Placed') return s === 'order placed' || s === 'pending';
      if (key === 'Payment Confirmed') return s === 'payment confirmed' || s === 'paid';
      if (key === 'Processing') return s === 'processing';
      if (key === 'Packed') return s === 'packed';
      if (key === 'Shipped') return s === 'shipped';
      if (key === 'Out For Delivery') return s === 'out for delivery' || s === 'out-for-delivery';
      if (key === 'Delivered') return s === 'delivered' || s === 'completed';
      return s === key.toLowerCase();
    });
  };

  const steps = getTimelineSteps();
  const currentIdx = getStatusIndex(order.status);
  const isCancelled = order.status?.toLowerCase() === 'cancelled';
  const isReturned = order.status?.toLowerCase() === 'returned';
  const isRefunded = order.status?.toLowerCase() === 'refunded';

  const formatEventDate = (timestampStr) => {
    if (!timestampStr) return '';
    const date = new Date(timestampStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatEventTime = (timestampStr) => {
    if (!timestampStr) return '';
    const date = new Date(timestampStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link to="/profile?tab=orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors mb-4 group">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                  Order details
                </h1>
                <Badge variant={isCancelled ? 'danger' : (order.status === 'Delivered' || order.status === 'Completed') ? 'success' : 'primary'} size="lg" className="capitalize">
                  {order.status || 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-mono font-bold text-gray-500">#{order.orderId || order.id}</span>
                <button 
                  onClick={() => copyToClipboard(order.orderId || order.id, 'orderId')}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {copiedText === 'orderId' ? (
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Placed Date</p>
                <p className="text-gray-900 font-bold">
                  {order.date ? new Date(order.date.seconds ? order.date.seconds * 1000 : order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              {order.estimatedDelivery && (
                <div className="text-right border-l border-gray-100 pl-6">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Est. Delivery</p>
                  <p className="text-gray-900 font-bold text-base">
                    {order.estimatedDelivery}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Progress Timeline */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-orange-500" /> Live Tracking Timeline
              </h2>
              
              <div className="relative pl-8 sm:pl-10 space-y-8">
                {/* Visual Connector Line */}
                <div className="absolute left-4 sm:left-5 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                {steps.map((step, idx) => {
                  const event = findHistoryEvent(step.key);
                  const isCompleted = order.statusHistory ? !!event : idx <= currentIdx;
                  
                  // Fallback date calculations if history not present
                  const eventDate = event ? formatEventDate(event.timestamp) : (isCompleted ? formatEventDate(order.date?.seconds ? order.date.seconds * 1000 : order.date) : '');
                  const eventTime = event ? formatEventTime(event.timestamp) : (isCompleted ? formatEventTime(order.date?.seconds ? order.date.seconds * 1000 : order.date) : '');
                  const eventNote = event?.note || '';
                  
                  const isLastCompleted = order.statusHistory 
                    ? event && order.statusHistory[order.statusHistory.length - 1]?.status === step.key
                    : idx === currentIdx;

                  const Icon = step.icon;

                  return (
                    <div key={step.key} className={`relative flex flex-col gap-1 transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                      
                      {/* Timeline Dot */}
                      <div className={`absolute -left-8 sm:-left-10 top-0.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-all ${
                        isLastCompleted ? 'bg-orange-500 text-white scale-110 ring-4 ring-orange-100' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted && !isLastCompleted ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      {/* Header */}
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className={`font-bold text-sm sm:text-base ${isLastCompleted ? 'text-orange-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCompleted && (
                          <span className="text-xs font-semibold text-gray-400 font-mono">
                            {eventDate} @ {eventTime}
                          </span>
                        )}
                      </div>

                      {/* Customer Note / Feedback */}
                      {isCompleted && eventNote && (
                        <p className="text-xs sm:text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 mt-1 italic">
                          "{eventNote}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment / Tracking Information */}
            {(order.courierName || order.shiprocketCourierName || order.trackingNumber || order.shiprocketTrackingNumber || order.awbCode || order.shiprocketAwbCode) && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-orange-500" /> Shipment & Courier Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                      <span className="text-gray-500 font-medium">Shipping Partner:</span>
                      <span className="font-bold text-gray-900">{order.shippingPartner || order.courierName || order.shiprocketCourierName || 'Shiprocket'}</span>
                    </div>
                    {(order.trackingNumber || order.shiprocketTrackingNumber) && (
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                        <span className="text-gray-500 font-medium">Tracking ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            {order.trackingNumber || order.shiprocketTrackingNumber}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(order.trackingNumber || order.shiprocketTrackingNumber, 'tracking')}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            {copiedText === 'tracking' ? (
                              <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {(order.awbCode || order.shiprocketAwbCode) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">AWB Code:</span>
                        <span className="font-mono font-bold text-gray-900">{order.awbCode || order.shiprocketAwbCode}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center items-stretch sm:items-end">
                    {(order.shipmentUrl || order.shiprocketTrackingUrl) ? (
                      <a 
                        href={getAbsoluteUrl(order.shipmentUrl || order.shiprocketTrackingUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all text-center"
                      >
                        Track Shipment <TruckIcon className="w-5 h-5" />
                      </a>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-gray-500 text-xs font-medium">
                        Tracking link will become available once dispatched by courier.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Products Purchased list */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5 text-orange-500" /> Products Items
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item, i) => {
                  const qty = item.quantity || 1;
                  const unitPrice = (item.price || 0) + (item.customPrice || 0);
                  const cd = item.customData || {};
                  return (
                    <div key={i} className="p-6 flex flex-col sm:flex-row gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{item.name || item.productName}</h3>
                          <p className="font-bold text-gray-950 text-sm sm:text-base">{formatPrice(unitPrice * qty)}</p>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 font-medium">Qty: {qty} × {formatPrice(unitPrice)}</p>
                        
                        {Object.keys(cd).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {cd.name && <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-100">Custom Name: {cd.name}</span>}
                            {cd.licenseNumber && <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-mono">License: {cd.licenseNumber}</span>}
                            {cd.color && <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md capitalize">Color: {cd.color}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sticky Sidebar on Desktop */}
          <div className="space-y-8 lg:sticky lg:top-24">
            
            {/* Payment Summary */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-orange-500" /> Payment Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Shipping</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Payment Status</span>
                  <span className="font-bold text-gray-900 capitalize">{order.paymentStatus || (order.status === 'Pending' ? 'Pending' : 'Paid')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Payment Method</span>
                  <span className="font-bold text-gray-900 uppercase">{order.paymentMethod || 'Razorpay'}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between text-sm text-gray-600 font-medium border-b border-gray-50 pb-3">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs text-gray-950 font-semibold">{order.paymentId}</span>
                  </div>
                )}
                
                <div className="pt-2 flex justify-between items-end">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl sm:text-3xl font-display font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-orange-500" /> Delivery Address
                </h2>
              </div>
              <div className="p-6">
                <p className="font-bold text-gray-900 mb-1">{order.customerName || order.customerInfo?.fullName || 'Customer'}</p>
                <p className="text-sm font-medium text-gray-600 mb-4">{order.customerPhone || order.customerInfo?.mobileNumber || 'N/A'}</p>
                <div className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {order.customerInfo?.address}<br/>
                  {order.customerInfo?.city}, {order.customerInfo?.state}<br/>
                  {order.customerInfo?.pinCode}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
