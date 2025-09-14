import React from 'react';

export default function Stars({ value = 0, outOf = 5 }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.25 && value - full < 0.75; // simple half logic
  const roundedFull = hasHalf ? full : Math.round(value);
  return (
    <span className="stars" aria-label={`Rating ${value} of ${outOf}`} style={{position:'relative'}}>
      {Array.from({ length: outOf }).map((_, i) => {
        const isFull = i < roundedFull;
        const showHalf = hasHalf && i === full;
        return (
          <span key={i} className={`star ${isFull ? 'filled' : ''}`} style={showHalf ? {background:'linear-gradient(90deg,var(--accent) 0 50%, #d0d5db 50%)'} : undefined}></span>
        );
      })}
    </span>
  );
}
