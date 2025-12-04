"use client";
import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <Navigation />

      {/* Hero Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '56px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px',
          letterSpacing: '-1px',
          lineHeight: '1.2'
        }}>
          Manage Your Ad Campaigns
          <br />
          <span style={{ fontSize: '48px' }}>All in One Place</span>
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#6b7280',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Connect your Facebook and Google Ads accounts to view, analyze, and optimize your advertising campaigns with AI-powered insights.
        </p>

        <Link href="/login">
          <button style={{
            backgroundColor: '#667eea',
            color: 'white',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5a67d8';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#667eea';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
          >
            Get Started
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '60px',
          color: '#1f2937'
        }}>
          Powerful Features
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px'
        }}>
          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              📊
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              Unified Dashboard
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              View all your Facebook and Google Ads accounts in one convenient dashboard with real-time performance metrics.
            </p>
          </div>

          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              🤖
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              AI-Powered Insights
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Get intelligent campaign analysis and recommendations powered by advanced AI to optimize your advertising performance.
            </p>
          </div>

          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              🔒
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              Secure & Private
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Your data is encrypted and secure. We follow industry best practices to protect your advertising account information.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        marginBottom: '80px',
        marginTop: '80px'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '24px'
        }}>
          Ready to Get Started?
        </h2>
        <p style={{
          fontSize: '20px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Connect your accounts today and start managing your campaigns more efficiently.
        </p>
        <Link href="/login">
          <button style={{
            backgroundColor: 'white',
            color: '#667eea',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
          }}
          >
            Login Now
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px',
        backgroundColor: '#1f2937',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <p style={{ marginBottom: '16px' }}>
            © {new Date().getFullYear()} AdRunner. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <Link href="/privacy-policy" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

