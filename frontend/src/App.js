import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "https://inventory-backend-jyub.onrender.com";
const API = process.env.REACT_APP_API_URL;

function App() {
  const [view, setView] = useState('dashboard');
  const [metrics, setMetrics] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: [] });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Form Configurations
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', quantity: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' });
  const [orderForm, setOrderForm] = useState({ customer_id: '', product_id: '', quantity: '' });

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    try {
      const mRes = await axios.get(`${API_BASE}dashboard/summary`);
      setMetrics(mRes.data);
      const pRes = await axios.get(`${API_BASE}/products`);
      setProducts(pRes.data);
      const cRes = await axios.get(`${API_BASE}/customers`);
      setCustomers(cRes.data);
      const oRes = await axios.get(`${API_BASE}/orders`);
      setOrders(oRes.data);
    } catch (err) {
      console.error("Network synchronization anomaly", err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/products`, productForm);
      setProductForm({ name: '', sku: '', price: '', quantity: '' });
      fetchData();
    } catch(err) { alert(err.response?.data?.detail || "Error adding product"); }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Delete this inventory asset?")) {
      await axios.delete(`${API_BASE}/products/${id}`);
      fetchData();
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/customers`, customerForm);
      setCustomerForm({ name: '', email: '', phone: '' });
      fetchData();
    } catch(err) { alert(err.response?.data?.detail || "Email validation error"); }
  };

  const handleDeleteCustomer = async (id) => {
    if(window.confirm("Remove this client file?")) {
      await axios.delete(`${API_BASE}/customers/${id}`);
      fetchData();
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(orderForm.customer_id),
        items: [{ product_id: parseInt(orderForm.product_id), quantity: parseInt(orderForm.quantity) }]
      };
      await axios.post(`${API_BASE}/orders`, payload);
      setOrderForm({ customer_id: '', product_id: '', quantity: '' });
      fetchData();
      alert("Transactional Order processing finalized successfully!");
    } catch(err) { alert(err.response?.data?.detail || "Insufficient stock or order submission error"); }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar Layout */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-md">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-emerald-400">Inventory Hub</h2>
        <nav className="space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full text-left px-4 py-2.5 rounded-lg transition ${view === 'dashboard' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-gray-300'}`}>📈 Dashboard</button>
          <button onClick={() => setView('products')} className={`w-full text-left px-4 py-2.5 rounded-lg transition ${view === 'products' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-gray-300'}`}>📦 Products</button>
          <button onClick={() => setView('customers')} className={`w-full text-left px-4 py-2.5 rounded-lg transition ${view === 'customers' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-gray-300'}`}>👥 Customers</button>
          <button onClick={() => setView('orders')} className={`w-full text-left px-4 py-2.5 rounded-lg transition ${view === 'orders' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-gray-300'}`}>📋 Order Engine</button>
        </nav>
      </div>

      {/* Main Panel Frame */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-gray-900">System Metrics Engine</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-gray-400 uppercase">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.total_products}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-gray-400 uppercase">Registered Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.total_customers}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-gray-400 uppercase">Orders Finalized</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.total_orders}</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
              <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center">⚠️ Low Stock Alerts (Qty &lt; 5)</h3>
              <ul className="list-disc pl-5 text-red-700 space-y-1">
                {metrics.low_stock_products.map((p, idx) => <li key={idx} className="font-medium">{p}</li>)}
                {metrics.low_stock_products.length === 0 && <li>All distribution assets optimally balanced!</li>}
              </ul>
            </div>
          </div>
        )}

        {view === 'products' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Catalog Management</h1>
            <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl shadow-sm border space-y-4 max-w-4xl">
              <h3 className="text-lg font-bold text-gray-700">Add New Inventory Unit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input type="text" placeholder="Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
                <input type="text" placeholder="SKU" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
                <input type="number" placeholder="Price" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
                <input type="number" placeholder="Quantity" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
              </div>
              <button type="submit" className="bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition">Save Product</button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b text-gray-600 text-sm font-semibold">
                    <th className="p-4">ID</th><th className="p-4">Product Name</th><th className="p-4">SKU Code</th><th className="p-4">Unit Valuation Price</th><th className="p-4">Available Units</th><th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-mono text-gray-400">#{p.id}</td>
                      <td className="p-4 font-semibold text-gray-900">{p.name}</td>
                      <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-mono">{p.sku}</span></td>
                      <td className="p-4 font-medium text-emerald-600">${p.price}</td>
                      <td className="p-4">{p.quantity} units</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 font-semibold hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'customers' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Client Directory</h1>
            <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-xl shadow-sm border space-y-4 max-w-4xl">
              <h3 className="text-lg font-bold text-gray-700">Add New Customer File</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Full Name" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
                <input type="email" placeholder="Email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
                <input type="text" placeholder="Phone" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="border p-2.5 rounded-lg w-full" required />
              </div>
              <button type="submit" className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition">Register Profile</button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b text-gray-600 text-sm font-semibold">
                    <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Email Channel</th><th className="p-4">Phone Number</th><th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-mono text-gray-400">#{c.id}</td>
                      <td className="p-4 font-semibold text-gray-900">{c.name}</td>
                      <td className="p-4">{c.email}</td>
                      <td className="p-4 font-mono text-gray-600">{c.phone}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-600 font-semibold hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Transactional Order Desk</h1>
            <form onSubmit={handleCreateOrder} className="bg-white p-6 rounded-xl shadow-sm border space-y-4 max-w-4xl">
              <h3 className="text-lg font-bold text-gray-700">Generate New Order Transaction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select value={orderForm.customer_id} onChange={e => setOrderForm({...orderForm, customer_id: e.target.value})} className="border p-2.5 rounded-lg w-full bg-white" required>
                  <option value="">Select Target Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
                </select>
                <select value={orderForm.product_id} onChange={e => setOrderForm({...orderForm, product_id: e.target.value})} className="border p-2.5 rounded-lg w-full bg-white" required>
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price} ({p.quantity} left)</option>)}
                </select>
                <input type="number" placeholder="Quantity Ordered" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} className="border p-2.5 rounded-lg w-full" min="1" required />
              </div>
              <button type="submit" className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition">Finalize Order</button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b text-gray-600 text-sm font-semibold">
                    <th className="p-4">Order ID</th><th className="p-4">Client ID Context</th><th className="p-4">Calculated Gross Bill Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 font-mono font-bold text-indigo-600">#ORD-{o.id}</td>
                      <td className="p-4">Account Reference ID: {o.customer_id}</td>
                      <td className="p-4 font-extrabold text-gray-900">${o.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;