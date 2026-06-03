import { useEffect, useState } from 'react'
import { getOrders, getProducts, getCustomers, createOrder, deleteOrder } from '../services/api'

function Toast({ msg, type, onClose }) {
  useEffect(() => { 
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t) 
  }, [onClose])
  
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span>{msg}</span>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [detail, setDetail]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({ customer_id: '', items: [{ product_id: '', quantity: 1 }] })

  const load = () => getOrders().then(r => setOrders(r.data))
  
  useEffect(() => {
    load()
    getProducts().then(r => setProducts(r.data))
    getCustomers().then(r => setCustomers(r.data))
  }, [])

  const notify = (msg, type = 'success') => setToast({ msg, type })

  const addItem    = ()  => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const updateItem = (i, field, val) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    setForm({ ...form, items })
  }

  // Calculate live running total for the modal
  const runningTotal = form.items.reduce((total, item) => {
    const p = products.find(prod => prod.id === parseInt(item.product_id))
    if (p && !isNaN(item.quantity)) {
      return total + (p.price * item.quantity)
    }
    return total
  }, 0)

  const handleSubmit = async () => {
    if (!form.customer_id) return notify('Please select a customer', 'error')
    if (form.items.some(i => !i.product_id || i.quantity < 1)) return notify('Please fill all item rows correctly', 'error')
    
    // Check stock validation before submitting to avoid server error
    for (const item of form.items) {
      const p = products.find(prod => prod.id === parseInt(item.product_id))
      if (p && p.quantity_in_stock < parseInt(item.quantity)) {
        return notify(`Insufficient stock for '${p.name}'. Only ${p.quantity_in_stock} left.`, 'error')
      }
    }

    setLoading(true)
    try {
      await createOrder({
        customer_id: parseInt(form.customer_id),
        items: form.items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) }))
      })
      notify('Order registered successfully')
      setShowModal(false)
      setForm({ customer_id: '', items: [{ product_id: '', quantity: 1 }] })
      load()
      // Refresh products list to update stock limits
      getProducts().then(r => setProducts(r.data))
    } catch (e) {
      notify(e.response?.data?.detail || 'Error creating order', 'error')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to cancel and delete this order? All inventory stock will be restored.')) return
    try { 
      await deleteOrder(id)
      notify('Order deleted and stock restored')
      load()
      // Refresh products list to update stock limits
      getProducts().then(r => setProducts(r.data))
    }
    catch (e) { 
      notify('Cannot cancel order', 'error') 
    }
  }

  const filteredOrders = orders.filter(o => 
    o.customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  )

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Track client orders, invoice status, and stock allocation.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            <line x1="12" y1="11" x2="16" y2="11" />
            <line x1="14" y1="9" x2="14" y2="13" />
          </svg>
          New Order
        </button>
      </div>

      <div className="card">
        {/* Search Bar */}
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="search-container" style={{ width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', stroke: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                className="search-input" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search orders by customer name or Order ID..." 
                style={{ paddingLeft: 42 }}
              />
            </div>
            {search && (
              <button className="btn btn-ghost" style={{ padding: '12px 16px' }} onClick={() => setSearch('')}>Clear</button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Total Invoice</th>
                <th>Date Placed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id}>
                  <td className="mono" style={{ color: 'var(--accent)' }}>#{o.id}</td>
                  <td style={{ fontWeight: 600 }}>{o.customer.full_name}</td>
                  <td>
                    <span className="badge badge-accent">
                      {o.order_items.length} unique item{o.order_items.length > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }} className="text-success">₹{o.total_amount.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setDetail(o)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Details
                      </button>
                      <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => handleDelete(o.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    {orders.length === 0 ? 'No orders processed yet. Click "+ New Order" to start.' : 'No orders found for your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Sales Order</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Name</label>
                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                  <option value="">Select Customer profile</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items List</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 42px', gap: 12, alignItems: 'center' }}>
                      <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                        <option value="">Choose item...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                            {p.name} (Stock: {p.quantity_in_stock} | ₹{p.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} 
                        placeholder="Qty" 
                      />
                      {form.items.length > 1 ? (
                        <button className="btn btn-danger" style={{ padding: 10, height: 42, width: 42 }} onClick={() => removeItem(i)}>✕</button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%', borderStyle: 'dashed' }} onClick={addItem}>
                  + Add Item Line
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Live Running Total:</span>
              <strong style={{ fontSize: 20, color: 'var(--success)' }}>₹{runningTotal.toFixed(2)}</strong>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Placing Order...' : 'Submit Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Sales Invoice #{detail.id}</h2>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{detail.customer.full_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{detail.customer.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Invoice Date:</span>
                  <div style={{ fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{new Date(detail.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.order_items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unit_price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Invoice Total:</span>
              <strong style={{ fontSize: 22, color: 'var(--success)' }}>₹{detail.total_amount.toFixed(2)}</strong>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setDetail(null)}>Close Invoice</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
