import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6 px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm">
      <Link 
        to={createPageUrl('PassengerHome')} 
        className="text-[#F2F2F2]/60 hover:text-[#F22998] transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-[#F2F2F2]/40" />
          {index === items.length - 1 ? (
            <span className="text-[#F22998] font-medium">{item.label}</span>
          ) : (
            <Link 
              to={createPageUrl(item.page)} 
              className="text-[#F2F2F2]/60 hover:text-[#F22998] transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}