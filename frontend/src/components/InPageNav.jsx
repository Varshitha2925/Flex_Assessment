import React, { useEffect, useState } from 'react';

const sections = [
  { id: 'categories', label: 'Categories' },
  { id: 'reviews', label: 'Guest Reviews' }
];

export default function InPageNav() {
  const [active, setActive] = useState('categories');

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0.1 }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
  <div style={{position:'sticky',top:'calc(var(--header-h) + 6px)',background:'var(--bg)',zIndex:40,borderBottom:'1px solid var(--border)',marginTop:'1rem',borderRadius:12}}>
      <nav style={{display:'flex',gap:'1.5rem',padding:'0.85rem 0',fontSize:14,fontWeight:500}}>
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{textDecoration:'none',color:active===s.id? 'var(--brand-dark)' : 'var(--text-light)',position:'relative'}}>
            {s.label}
            {active===s.id && <span style={{position:'absolute',left:0,bottom:-6,height:3,width:'100%',background:'var(--brand-dark)',borderRadius:6}} />}
          </a>
        ))}
      </nav>
    </div>
  );
}
