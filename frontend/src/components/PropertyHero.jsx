import React from 'react';

export default function PropertyHero({ title, image, rating, totalReviews, categories=[] }) {
  return (
    <section style={{position:'relative',borderRadius:'0 0 28px 28px',overflow:'hidden',marginBottom:'1.6rem'}}>
      <div style={{position:'relative',height:320,background:'#ccc'}}>
        <img src={image} alt="Property" style={{objectFit:'cover',width:'100%',height:'100%',filter:'brightness(0.62)'}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0.32),rgba(20,60,57,0.78))'}} />
        <div style={{position:'absolute',left:'min(6vw,110px)',bottom:38,color:'#fff',maxWidth:'72%',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <h1 style={{fontSize:'clamp(2.3rem,5vw,4.1rem)',margin:0,lineHeight:1.05,letterSpacing:'-0.02em'}}>{title}</h1>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',fontSize:14,fontWeight:600}}>
            {typeof rating === 'number' && (
              <span style={{background:'rgba(255,255,255,0.18)',backdropFilter:'blur(4px)',padding:'0.45rem 0.75rem',borderRadius:24,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:15}}>{rating.toFixed(2)}</span>
                {typeof totalReviews === 'number' && <span style={{opacity:0.75,fontSize:12}}>({totalReviews})</span>}
              </span>
            )}
            {categories.slice(0,6).map(cat => (
              <span key={cat} style={{background:'rgba(255,255,255,0.16)',padding:'0.35rem 0.7rem',borderRadius:18,fontSize:11,letterSpacing:'0.05em',textTransform:'uppercase'}}>{cat}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
