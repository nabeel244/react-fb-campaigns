"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      padding: '16px 40px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo/Brand */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          height: '50px'
        }}>
          <img
            src="/logo.png"
            alt="AdRunner Logo"
            style={{
              height: 'auto',
              maxHeight: '50px',
              width: 'auto',
              maxWidth: '200px',
              objectFit: 'contain'
            }}
          />
        </Link>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          gap: '32px',
          alignItems: 'center'
        }}>
          <Link 
            href="/"
            style={{
              textDecoration: 'none',
              color: pathname === '/' ? '#667eea' : '#374151',
              fontWeight: pathname === '/' ? '600' : '500',
              fontSize: '16px',
              transition: 'color 0.2s ease',
              padding: '8px 0',
              borderBottom: pathname === '/' ? '2px solid #667eea' : '2px solid transparent'
            }}
          >
            Home
          </Link>
          <Link 
            href="/privacy-policy"
            style={{
              textDecoration: 'none',
              color: pathname === '/privacy-policy' ? '#667eea' : '#374151',
              fontWeight: pathname === '/privacy-policy' ? '600' : '500',
              fontSize: '16px',
              transition: 'color 0.2s ease',
              padding: '8px 0',
              borderBottom: pathname === '/privacy-policy' ? '2px solid #667eea' : '2px solid transparent'
            }}
          >
            Privacy Policy
          </Link>
          <Link 
            href="/login"
            style={{
              textDecoration: 'none',
              color: pathname === '/login' ? '#667eea' : '#374151',
              fontWeight: pathname === '/login' ? '600' : '500',
              fontSize: '16px',
              transition: 'color 0.2s ease',
              padding: '8px 0',
              borderBottom: pathname === '/login' ? '2px solid #667eea' : '2px solid transparent'
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

