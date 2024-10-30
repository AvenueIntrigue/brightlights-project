import React from 'react';
import './SkeletonComponent.css';

export const SkeletonImage = () => <div className="skeleton image"></div>;

export const SkeletonText = ({ short }: { short?: boolean }) => (
  <div className={`skeleton text ${short ? 'short' : ''}`}></div>
);
