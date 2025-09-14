import React, { useEffect, useState, useMemo } from 'react';
import { fetchHostawayReviews } from '../services/api.js';
import { Link } from 'react-router-dom';
import Stars from '../components/Stars.jsx';

export default function ReviewsPage() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [channel,setChannel] = useState('');

  useEffect(()=>{(async ()=>{try{const d=await fetchHostawayReviews();setData(d);}catch(e){setError(e.message);}finally{setLoading(false);}})();},[]);

  const approved = useMemo(()=> {
    if(!data) return [];
    const arr=[]; Object.values(data.listings).forEach(l=> l.reviews.filter(r=>r.approved).forEach(r=>arr.push({...r, listing:l.listingName})));
    return arr.filter(r=> !channel || r.channel===channel).sort((a,b)=> new Date(b.submittedAt)-new Date(a.submittedAt));
  },[data,channel]);

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container" style={{color:'red'}}>{error}</div>;

  const channels = [...new Set(approved.map(r=>r.channel))];

  return (
    <div className="container">
      <h2 style={{marginTop:0}}>Approved Reviews</h2>
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={channel} onChange={e=>setChannel(e.target.value)}>
          <option value=''>All Channels</option>
          {channels.map(c=> <option key={c}>{c}</option>)}
        </select>
        <div style={{fontSize:'0.75rem',opacity:0.6}}>{approved.length} shown</div>
      </div>
      <div className="reviews-grid">
        {approved.map(r => (
          <article key={r.id} className="review-card">
            <div className="header">
              <span>{r.submittedAt?.split(' ')[0]}</span>
              <span>{r.channel}</span>
            </div>
            <div className="rating"><Stars value={r.rating||0} /> <span>{r.rating ?? '—'}</span></div>
            <p>{r.publicReview}</p>
            <div className="guest">— {r.guestName} • <Link to={`/property/${encodeURIComponent(r.listing)}`}>{r.listing}</Link></div>
          </article>
        ))}
      </div>
    </div>
  );
}
