import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHostawayReviews, fetchGoogleReviews } from '../services/api.js';
import { PLACE_ID_MAP } from '../config/places.js';
import Stars from '../components/Stars.jsx';
import PropertyHero from '../components/PropertyHero.jsx';

export default function PropertyPage() {
  const { name } = useParams();
  const decoded = decodeURIComponent(name);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [google, setGoogle] = useState(null);
  const [placeIdInput, setPlaceIdInput] = useState('');
  const [placeIdUsed, setPlaceIdUsed] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const approvedReviews = useMemo(() => (listing?.reviews || []).filter(r => r.approved), [listing]);
  const categories = listing?.aggregates?.categories || {};

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const d = await fetchHostawayReviews();
        if (!active) return;
        setListing(d.listings[decoded]);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [decoded]);

  // Auto-load Google reviews using mapping if available
  useEffect(() => {
    if (!listing?.listingName) return;
    const mapped = PLACE_ID_MAP[listing.listingName];
    if (!mapped) return; // no automatic mapping
    let active = true;
    setGoogleLoading(true);
    (async () => {
      const g = await fetchGoogleReviews(mapped);
      if (active) {
        setGoogle(g);
        setPlaceIdUsed(mapped);
        setGoogleLoading(false);
      }
    })();
    return () => { active = false; };
  }, [listing?.listingName]);

  async function manualLoad() {
    if (!placeIdInput.trim()) return;
    setGoogleLoading(true);
    const g = await fetchGoogleReviews(placeIdInput.trim());
    setGoogle(g);
    setPlaceIdUsed(placeIdInput.trim());
    setGoogleLoading(false);
  }

  if (loading) return <div style={{padding:'1rem'}}>Loading property...</div>;
  if (error) return <div style={{padding:'1rem', color:'red'}}>Error: {error}</div>;
  if (!listing) return <div style={{padding:'1rem'}}>No such property. <Link to='/'>Back</Link></div>;

  return (
    <>
      <PropertyHero
        title={listing.listingName}
        image={'https://picsum.photos/1600/900?blur=2&random=' + encodeURIComponent(listing.listingName)}
        rating={listing.aggregates?.avgOverall}
        totalReviews={listing.aggregates?.totalReviews}
        categories={Object.keys(categories)}
      />
      <div className="container" style={{marginTop:'1.5rem'}}>
        <section className="section-block" id="categories" style={{scrollMarginTop:'80px'}}>
          <h3>Category Performance</h3>
          <div className="category-grid">
            {Object.entries(categories).map(([cat, val]) => (
              <div key={cat} className="category-card">
                <h4>{cat}</h4>
                <div className="val">{val.avg} <span style={{fontSize:'0.65rem',color:'var(--text-light)'}}>({val.count})</span></div>
                <div><Stars value={val.avg/2} outOf={5} /></div>
              </div>
            ))}
          </div>
        </section>
  <section className="section-block" id="reviews" style={{scrollMarginTop:'80px'}}>
          <h3>Approved Guest Reviews</h3>
          {approvedReviews.length === 0 && <div style={{color:'var(--text-light)'}}>No approved reviews yet.</div>}
          <div className="reviews-grid compact">
            {approvedReviews.map(r => (
              <article key={r.id} className="review-card">
                <div className="header">
                  <span>{r.submittedAt?.split(' ')[0]}</span>
                  <span>{r.channel}</span>
                </div>
                <div className="rating"><Stars value={r.rating || 0} /> <span style={{marginLeft:6}}>{r.rating ?? '—'}</span></div>
                <p>{r.publicReview}</p>
                <div className="guest">— {r.guestName}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block" id="google" style={{scrollMarginTop:'80px'}}>
          <h3>Google Reviews</h3>
          <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center', marginBottom:'0.75rem'}}>
            <input
              placeholder="Enter Google Place ID"
              value={placeIdInput}
              onChange={e=>setPlaceIdInput(e.target.value)}
              style={{flex:'1 1 260px', padding:'0.5rem 0.6rem', border:'1px solid var(--border)', borderRadius:8, font:'inherit'}}
            />
            <button
              onClick={manualLoad}
              disabled={googleLoading || !placeIdInput.trim()}
              style={{background:'var(--accent)', color:'#fff', border:'none', padding:'0.55rem 0.9rem', borderRadius:8, font:'inherit', cursor:'pointer', fontWeight:600, opacity: googleLoading ? 0.6 : 1}}
            >{googleLoading ? 'Loading...' : 'Load'}</button>
            {placeIdUsed && <span style={{fontSize:'0.65rem', background:'#eef3f0', padding:'0.35rem 0.55rem', borderRadius:14}}>Using: {placeIdUsed.slice(0,10)}{placeIdUsed.length>10?'…':''}</span>}
          </div>
          {!google && !googleLoading && !placeIdUsed && (
            <div style={{fontSize:'0.75rem', color:'var(--text-light)'}}>Provide a Place ID above or define a mapping in <code>config/places.js</code>.</div>
          )}
          {googleLoading && <div style={{fontSize:'0.8rem'}}>Fetching Google data…</div>}
          {google && google.status === 'not-configured' && (
            <div style={{fontSize:'0.8rem', background:'#fff7e6', border:'1px solid #ffe2ad', padding:'0.75rem 1rem', borderRadius:6}}>
              API key not configured on this environment.
            </div>
          )}
          {google && google.status === 'error' && (
            <div style={{fontSize:'0.8rem', background:'#ffecec', border:'1px solid #ffb5b5', padding:'0.75rem 1rem', borderRadius:6}}>
              Google fetch error: <strong>{google.code}</strong> – {google.message}
            </div>
          )}
          {google && google.status === 'success' && (
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              <div style={{fontSize:'0.85rem'}}>Rating: <strong>{google.rating ?? '—'}</strong> ({google.userRatingsTotal ?? 0} total) <span style={{fontSize:'0.65rem', marginLeft:6, background:'#eef3f0', padding:'2px 6px', borderRadius:12}}>{google.mode}</span></div>
              {google.reviews.length === 0 && <div style={{fontSize:'0.75rem', color:'var(--text-light)'}}>No Google reviews returned.</div>}
              {google.reviews.map(rv => (
                <div key={rv.id} className="review-card" style={{padding:'0.75rem 1rem'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                    <strong style={{fontSize:'0.75rem'}}>{rv.author}</strong>
                    <span style={{fontSize:'0.7rem'}}>{rv.rating?.toFixed ? rv.rating.toFixed(1) : rv.rating}</span>
                  </div>
                  <p style={{fontSize:'0.75rem', lineHeight:1.3}}>{rv.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        {google && false && (
          <section className="section-block" id="google" style={{scrollMarginTop:'80px'}}>
            <h3>Google Reviews (Prototype)</h3>
            {google.status === 'not-configured' && (
              <div style={{fontSize:'0.8rem', background:'#fff7e6', border:'1px solid #ffe2ad', padding:'0.75rem 1rem', borderRadius:6}}>
                External API key not configured. Set <code>GOOGLE_PLACES_API_KEY</code> to enable live data.
              </div>
            )}
            {google.status === 'success' && (
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                <div style={{fontSize:'0.85rem'}}>Rating (stub): <strong>{google.rating}</strong></div>
                {google.reviews.map(rv => (
                  <div key={rv.id} className="review-card" style={{padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                      <strong style={{fontSize:'0.75rem'}}>{rv.author}</strong>
                      <span style={{fontSize:'0.7rem'}}>{rv.rating.toFixed(1)}</span>
                    </div>
                    <p style={{fontSize:'0.75rem', lineHeight:1.3}}>{rv.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        <p style={{marginTop:'3rem'}}><Link to='/'>&larr; Back to Dashboard</Link></p>
      </div>
    </>
  );
}
