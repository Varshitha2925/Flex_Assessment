import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div style={{display:'flex',alignItems:'center',gap:'0.65rem',fontWeight:600,fontSize:'1.05rem'}}>
        <span style={{display:'inline-block',width:20,height:20,border:'2px solid #fff',borderRadius:4,position:'relative'}}>
          <span style={{position:'absolute',left:3,top:6,width:10,height:8,border:'2px solid #fff',borderTop:'none'}}></span>
        </span>
        <span>the flex.</span>
      </div>
      <nav style={{display:'flex',gap:'1.4rem',marginLeft:'auto',fontSize:'0.82rem',fontWeight:500}}>
        <NavLink to="/" end style={({isActive})=>({color:'#fff',opacity:isActive?1:0.68,textDecoration:'none',position:'relative'})}>Dashboard</NavLink>
        <NavLink to="/properties" style={({isActive})=>({color:'#fff',opacity:isActive?1:0.68,textDecoration:'none'})}>Properties</NavLink>
        <NavLink to="/reviews" style={({isActive})=>({color:'#fff',opacity:isActive?1:0.68,textDecoration:'none'})}>Reviews</NavLink>
        <NavLink to="/analytics" style={({isActive})=>({color:'#fff',opacity:isActive?1:0.68,textDecoration:'none'})}>Analytics</NavLink>
      </nav>
    </header>
  );
}
