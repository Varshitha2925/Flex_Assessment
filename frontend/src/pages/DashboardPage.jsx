import React, { useEffect, useState, useMemo } from 'react';
import { fetchHostawayReviews, approveReview, unapproveReview } from '../services/api.js';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [filterChannel, setFilterChannel] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const d = await fetchHostawayReviews();
      if (d && d.status === 'error') {
        setError(`${d.code || 'ERROR'}: ${d.message}`);
        setErrorDetails(d.details || null);
        setData(null);
      } else {
        setData(d);
        setErrorDetails(null);
      }
    } catch (e) {
      setError(e.message);
      setErrorDetails(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Provide safe normalized shape if data missing to prevent crashes
  const safeListings = data?.listings || {};

  const allReviews = useMemo(() => {
    if (!data || !data.listings) return [];
    const out = [];
    Object.values(safeListings).forEach(listing => {
      (listing.reviews || []).forEach(r => out.push({ listingName: listing.listingName, ...r }));
    });
    return out;
  }, [data, safeListings]);

  const rows = useMemo(() => {
    return allReviews.filter(r => (!filterChannel || r.channel === filterChannel) && (!search || r.publicReview?.toLowerCase().includes(search.toLowerCase())));
  }, [allReviews, filterChannel, search]);

  const allChannels = useMemo(() => [...new Set(allReviews.map(r => r.channel).filter(Boolean))], [allReviews]);

  async function toggleApproval(r) {
    if (r.approved) await unapproveReview(r.id); else await approveReview(r.id);
    await load();
  }

  if (loading) return <div style={{padding:'2rem'}}>Loading reviews...</div>;
  if (error) return (
    <div style={{padding:'2rem'}}>
      <div style={{color:'red', marginBottom:'1rem'}}>Error loading Hostaway reviews: {error}</div>
      {errorDetails && (
        <details style={{marginBottom:'1rem'}}>
          <summary>Diagnostics</summary>
          <pre style={{whiteSpace:'pre-wrap', fontSize:12, background:'#222', color:'#eee', padding:'0.75rem', borderRadius:4}}>{JSON.stringify(errorDetails, null, 2)}</pre>
        </details>
      )}
      <button onClick={load}>Retry</button>
    </div>
  );
  if (!data) return null;

  const channelOptions = allChannels;

  return (
    <div className="dash-wrapper">
      <div className="dash-head">
        <h2>Reviews Dashboard</h2>
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-label">Listings</div>
            <div className="stat-value">{data.meta?.listingCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Reviews</div>
            <div className="stat-value">{data.meta?.reviewCount ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{rows.filter(r=>r.approved).length}</div>
          </div>
            <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{rows.filter(r=>!r.approved).length}</div>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <input placeholder="Search review text" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={filterChannel} onChange={e=>setFilterChannel(e.target.value)}>
          <option value=''>All Channels</option>
          {channelOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load}>Reload</button>
      </div>

      <div className="reviews-table-wrap reviews-table-responsive">
        <table className="reviews-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Channel</th>
              <th>Rating</th>
              <th>Excerpt</th>
              <th>Submitted</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const excerpt = r.publicReview?.slice(0, 90) || '';
              return (
                <tr key={r.id}>
                  <td style={{fontWeight:600}}><Link to={`/property/${encodeURIComponent(r.listingName)}`}>{r.listingName}</Link></td>
                  <td><span className="pill">{r.channel}</span></td>
                  <td>{r.rating ?? '-'}</td>
                  <td style={{maxWidth:320}}>{excerpt}{excerpt.length===90 && '…'}</td>
                  <td>{r.submittedAt?.split(' ')[0]}</td>
                  <td>{r.approved ? 'Approved' : 'Pending'}</td>
                  <td>
                    <button className={`approve-btn ${r.approved ? 'secondary':''}`} onClick={()=>toggleApproval(r)}>
                      {r.approved ? 'Unapprove' : 'Approve'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
