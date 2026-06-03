import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { getProducts, getCustomers, getOrders } from '../services/api'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0, stockValue: 0 })
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    Promise.all([getProducts(), getCustomers(), getOrders()])
      .then(([p, c, o]) => {
        const totalVal = p.data.reduce((sum, item) => sum + (item.price * item.quantity_in_stock), 0)
        setStats({ 
          products: p.data.length, 
          customers: c.data.length, 
          orders: o.data.length,
          stockValue: totalVal 
        })
        setLowStock(p.data.filter(prod => prod.quantity_in_stock < 5))
        
        // Sort orders by id desc and take top 5
        const sortedOrders = [...o.data].sort((a, b) => b.id - a.id).slice(0, 5)
        setRecentOrders(sortedOrders)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Analyzing inventory network...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Real-time stock valuation, operations summary, and alerts.</p>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }} className="mono">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="stat-grid">
        <StatCard label="Total Products" value={stats.products} type="products" />
        <StatCard label="Active Customers" value={stats.customers} type="customers" />
        <StatCard label="Placed Orders" value={stats.orders} type="orders" />
        <div className="card stat-card">
          <div className="card-body">
            <div className="stat-card-label">Total Stock Value</div>
            <div className="stat-card-value">₹{stats.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <svg className="stat-card-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, flexWrap: 'wrap' }}>
        {/* Recent Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Recent Customer Orders</span>
            <Link to="/orders" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>View All Orders</Link>
          </div>
          <div className="table-container" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="mono">#{o.id}</td>
                      <td style={{ fontWeight: 500 }}>{o.customer.full_name}</td>
                      <td style={{ fontWeight: 600 }} className="text-success">₹{o.total_amount.toFixed(2)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock & Warnings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Stock Alert Level</span>
            {lowStock.length > 0 ? (
              <span className="badge badge-danger">{lowStock.length} critical items</span>
            ) : (
              <span className="badge badge-success">Stock Healthy</span>
            )}
          </div>
          <div className="card-body" style={{ flex: 1, padding: '16px 28px' }}>
            {lowStock.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '24px 0' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>All products have sufficient stock levels.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lowStock.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: 11, marginTop: 2 }}>{p.sku}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="badge badge-danger">{p.quantity_in_stock} left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}