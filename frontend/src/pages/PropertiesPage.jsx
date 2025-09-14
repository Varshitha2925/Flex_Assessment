import React, { useEffect, useState } from 'react';
import { fetchHostawayReviews } from '../services/api.js';
import { Link } from 'react-router-dom';

export default function PropertiesPage() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  useEffect(()=>{
    (async ()=>{
      try {
        const d = await fetchHostawayReviews();
        setData(d);
      } catch(e){ setError(e.message);} finally { setLoading(false);}  
    })();
  },[]);

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container" style={{color:'red'}}>{error}</div>;
  if (!data) return null;

  const listings = Object.values(data.listings);

  return (
    <div className="container">
      <h2 style={{marginTop:0}}>Properties</h2>
      <div style={{display:'grid',gap:'1.4rem',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
        {listings.map(l => (
          <Link key={l.listingName} to={`/property/${encodeURIComponent(l.listingName)}`} style={{textDecoration:'none',color:'inherit'}}>
            <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',boxShadow:'var(--shadow)'}}>
              <img alt={l.listingName} src={`https://picsum.photos/seed/${encodeURIComponent(l.listingName)}/600/400`} style={{width:'100%',aspectRatio:'3/2',objectFit:'cover'}} />
              <div style={{padding:'0.75rem 0.9rem 0.95rem'}}>
                <div style={{fontWeight:600,fontSize:'0.95rem'}}>{l.listingName}</div>
                <div style={{fontSize:'0.7rem',opacity:0.6}}>Reviews: {l.aggregates.totalReviews}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
