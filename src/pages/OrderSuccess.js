import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGetOrderById, apiGetMyOrders } from '../services/api';

const OrderSuccess = () => {
  const location = useLocation();
  const { orderId } = useParams();

  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!order) {
      const fetchOrder = async () => {
        try {
          setIsLoading(true);
          if (orderId) {
            const res = await apiGetOrderById(orderId);
            if (res?.success && res.order) {
              setOrder(res.order);
              return;
            }
          }
          // Fallback: fetch user's most recent order
          const myOrdersRes = await apiGetMyOrders();
          if (myOrdersRes?.orders && myOrdersRes.orders.length > 0) {
            setOrder(myOrdersRes.orders[0]);
          } else {
            setError('No recent order found.');
          }
        } catch (err) {
          setError(err.message || 'Failed to load order confirmation.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrder();
    }
  }, [order, orderId]);

  // Compute estimated delivery date (4 business days from order creation)
  const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const estDeliveryDate = new Date(orderDate);
  estDeliveryDate.setDate(estDeliveryDate.getDate() + 4);
  const formattedEstDelivery = estDeliveryDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-nunito">
      <div>
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          {isLoading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-bold text-gray-700">Verifying and finalizing your order...</p>
            </div>
          ) : error || !order ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm max-w-lg mx-auto space-y-4">
              <span className="text-5xl block">🛍️</span>
              <h2 className="text-xl font-bold text-gray-900">Order Confirmation</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                {error || 'No active order found. Explore our authentic mindful products to place a new order.'}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Link
                  to="/products"
                  className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Browse Store
                </Link>
                <Link
                  to="/profile"
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-saffron-100 shadow-sm text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner ring-8 ring-emerald-50">
                  ✓
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                  Order Confirmed
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Thank You for Your Order!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Your mindful wellness essentials have been confirmed and are being carefully packed for dispatch.
                </p>

                {/* Key Quick Facts Grid */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-saffron-50/40 p-4 rounded-2xl border border-saffron-100/70 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Order ID</span>
                    <span className="font-extrabold text-xs text-gray-900 font-mono">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Payment</span>
                    <span className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                      <span>✓</span> {order.paymentStatus || 'Paid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Estimated Delivery</span>
                    <span className="font-bold text-xs text-gray-900">{formattedEstDelivery}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Paid</span>
                    <span className="font-black text-xs text-saffron-700">₹{order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order Content Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Col: Items Purchased (7 cols) */}
                <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                    <span>📦</span> Items in this Order ({order.items?.length || 1})
                  </h3>

                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                        <div className="w-16 h-16 rounded-xl bg-saffron-50/50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.varietyImage ? (
                            <img
                              src={item.varietyImage}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🧘</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {item.title}
                          </h4>
                          {item.varietyName && (
                            <p className="text-[11px] text-saffron-700 font-semibold">
                              Option: {item.varietyName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Qty: <span className="font-bold text-gray-700">{item.quantity}</span> × ₹{(item.unitPrice || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-black text-gray-900">
                            ₹{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Col: Logistics, Address & Payment Info (5 cols) */}
                <div className="md:col-span-5 space-y-6">
                  {/* Delivery & Logistics Card */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-3.5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span>🚚</span> Delivery Details
                    </h3>

                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-gray-400 font-bold block text-[10px] uppercase">Shipping Address</span>
                        <p className="font-bold text-gray-900 mt-0.5">{order.shippingAddress?.street}</p>
                        <p className="text-gray-600">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                        </p>
                        <p className="text-gray-500 mt-1">📞 {order.shippingAddress?.contact}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-400 font-bold block text-[10px] uppercase">Courier Partner</span>
                        <p className="font-bold text-gray-800 flex items-center justify-between mt-0.5">
                          <span>{order.courierName || 'BlueDart Express'}</span>
                          {order.trackingNumber && (
                            <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                              {order.trackingNumber}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Method</span>
                        <p className="font-bold text-gray-800 mt-0.5">
                          {order.paymentMethod || 'Cash on Delivery (Verified)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Bill Summary */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      Payment Summary
                    </h3>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between text-gray-600">
                        <span>Items Subtotal</span>
                        <span>₹{(order.subtotal || order.totalAmount)?.toLocaleString()}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Coupon Discount ({order.couponCode})</span>
                          <span>-₹{order.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping & Handling</span>
                        <span>{order.shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${order.shippingFee}`}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-100">
                        <span>Grand Total Paid</span>
                        <span className="text-saffron-600">₹{order.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/profile"
                  className="flex-1 py-3.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs rounded-2xl shadow-md transition text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📦</span> View & Track in My Orders
                </Link>
                <Link
                  to="/products"
                  className="flex-1 py-3.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-2xl border border-gray-300 transition text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🧘</span> Continue Shopping Mindful Store
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
