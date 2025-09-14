import React, { useEffect, useState, useMemo } from 'react';
import { fetchHostawayReviews } from '../services/api.js';
import Stars from '../components/Stars.jsx';

export default function AnalyticsPage() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  useEffect(()=>{(async()=>{try{const d=await fetchHostawayReviews();setData(d);}catch(e){setError(e.message);}finally{setLoading(false);}})();},[]);

  const metrics = useMemo(()=>{
    if(!data) return null;
    let totalReviews=0; let sumOverall=0; let ratedCount=0; const channelCounts={};
    Object.values(data.listings).forEach(l=>{
      l.reviews.forEach(r=>{ totalReviews++; if(typeof r.rating==='number'){sumOverall+=r.rating; ratedCount++;} channelCounts[r.channel]=(channelCounts[r.channel]||0)+1; });
    });
    const avgOverall = ratedCount? +(sumOverall/ratedCount).toFixed(2): null;
    return { totalReviews, avgOverall, channelCounts };
  },[data]);

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container" style={{color:'red'}}>{error}</div>;
  if (!metrics) return null;

  return (
    <div className="container">
      <h2 style={{marginTop:0}}>Analytics Overview</h2>
      <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',marginBottom:'2rem'}}>
        <div className="category-card"><h4>Total Reviews</h4><div className="val" style={{fontSize:'1.4rem'}}>{metrics.totalReviews}</div></div>
        <div className="category-card"><h4>Average Rating</h4><div className="val" style={{fontSize:'1.4rem'}}>{metrics.avgOverall ?? '—'} {metrics.avgOverall && <Stars value={metrics.avgOverall} />}</div></div>
        {Object.entries(metrics.channelCounts).map(([ch,count])=> (
          <div key={ch} className="category-card"><h4>{ch} reviews</h4><div className="val" style={{fontSize:'1.2rem'}}>{count}</div></div>
        ))}
      </div>
      <p style={{fontSize:'0.75rem',opacity:0.6}}>Derived from normalized Hostaway mock dataset.</p>
    </div>
  );
}
