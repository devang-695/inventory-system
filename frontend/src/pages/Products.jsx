import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api'

const empty = { name: '', sku: '', price: '', quantity_in_stock: '' }

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

export default function Products() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => getProducts().then(r => setProducts(r.data))
  useEffect(() => { load() }, [])

  const notify = (msg, type = 'success') => setToast({ msg, type })

  const openAdd = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (p) => { 
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, price: p.price, quantity_in_stock: p.quantity_in_stock })
    setShowModal(true) 
  }

  const handleSubmit = async () => {
    const payload = { ...form, price: parseFloat(form.price), quantity_in_stock: parseInt(form.quantity_in_stock) }
    if (!payload.name || !payload.sku || isNaN(payload.price) || isNaN(payload.quantity_in_stock))
      return notify('Please fill all fields correctly', 'error')
    if (payload.price < 0 || payload.quantity_in_stock < 0)
      return notify('Price and quantity must be non-negative', 'error')
    setLoading(true)
    try {
      editing ? await updateProduct(editing.id, payload) : await createProduct(payload)
      notify(editing ? 'Product updated successfully' : 'Product created successfully')
      setShowModal(false)
      load()
    } catch (e) {
      notify(e.response?.data?.detail || 'Error saving product', 'error')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product? All historical logs referencing it will also be updated.')) return
    try { 
      await deleteProduct(id)
      notify('Product deleted successfully')
      load() 
    } catch (e) { 
      notify(e.response?.data?.detail || 'Cannot delete product', 'error') 
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage inventory items, pricing, SKUs, and stock limits.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Product
        </button>
      </div>

      <div className="card">
        {/* Search and Filters */}
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
                placeholder="Search products by name or SKU..." 
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
                <th>Product Details</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Quantity in Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {p.sku}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>₹{p.price.toFixed(2)}</td>
                  <td>
                    {p.quantity_in_stock < 5 ? (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {p.quantity_in_stock} (Low Stock)
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {p.quantity_in_stock}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => openEdit(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => handleDelete(p.id)}>
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    {products.length === 0 ? 'No products registered yet. Click "+ Add Product" to begin.' : 'No products match your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Modify Product' : 'Register New Product'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g., Mechanical Keyboard" 
                />
              </div>
              <div className="form-group">
                <label>SKU / Barcode ID</label>
                <input 
                  value={form.sku} 
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, sku: e.target.value })} 
                  placeholder="e.g., KB-MECH-01" 
                  style={editing ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit Price (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={form.price} 
                    onChange={e => setForm({ ...form, price: e.target.value })} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={form.quantity_in_stock} 
                    onChange={e => setForm({ ...form, quantity_in_stock: e.target.value })} 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}