import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, deleteCustomer } from '../services/api'

const empty = { full_name: '', email: '', phone: '' }

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

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(empty)
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)
  const [search, setSearch]       = useState('')

  const load = () => getCustomers().then(r => setCustomers(r.data))
  useEffect(() => { load() }, [])

  const notify = (msg, type = 'success') => setToast({ msg, type })

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) return notify('Name and email are required', 'error')
    if (!/\S+@\S+\.\S+/.test(form.email)) return notify('Please enter a valid email address', 'error')
    setLoading(true)
    try {
      await createCustomer(form)
      notify('Customer registered successfully')
      setShowModal(false)
      setForm(empty)
      load()
    } catch (e) {
      notify(e.response?.data?.detail || 'Error registering customer', 'error')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer? All their associated order history will be deleted as well.')) return
    try { 
      await deleteCustomer(id)
      notify('Customer profile removed')
      load() 
    } catch (e) { 
      notify(e.response?.data?.detail || 'Cannot delete customer', 'error') 
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers Database</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage client profiles, purchase histories, and contact information.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add Customer
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
                placeholder="Search customers by name or email..." 
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
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, fontSize: 15 }}>{c.full_name}</td>
                  <td className="mono">{c.email}</td>
                  <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => handleDelete(c.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    {customers.length === 0 ? 'No customers registered yet. Click "+ Add Customer" to begin.' : 'No customers match your search query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Register Customer</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  value={form.full_name} 
                  onChange={e => setForm({...form, full_name: e.target.value})} 
                  placeholder="e.g., Jane Smith" 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="e.g., jane.smith@gmail.com" 
                />
              </div>
              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  placeholder="e.g., 9876543210" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Registering...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
