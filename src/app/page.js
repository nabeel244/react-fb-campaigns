"use client";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (status === "authenticated" && session?.provider) {
      if (session.provider === "facebook") {
        router.push("/dashboard");
      } else if (session.provider === "google") {
        router.push("/google");
      }
    }
  }, [status, session, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If authenticated, don't show homepage (will redirect)
  if (status === "authenticated") {
    return null;
  }

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

      {/* How It Works Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          How It Works
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '60px',
          maxWidth: '600px',
          margin: '0 auto 60px'
        }}>
          Get started in three simple steps and transform how you manage your ad campaigns
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          position: 'relative'
        }}>
          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#667eea',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
              fontWeight: '700',
              color: 'white'
            }}>
              1
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Connect Your Accounts
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Securely link your Facebook Ads and Google Ads accounts with just one click using OAuth authentication.
            </p>
          </div>

          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#667eea',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
              fontWeight: '700',
              color: 'white'
            }}>
              2
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              View Your Campaigns
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Access all your ad accounts, campaigns, and performance metrics from a single unified dashboard.
            </p>
          </div>

          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#667eea',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
              fontWeight: '700',
              color: 'white'
            }}>
              3
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Get AI Insights
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Leverage AI-powered analytics and recommendations to optimize your campaigns and improve ROI.
            </p>
          </div>
        </div>
      </section>

      {/* Stats/Benefits Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        marginTop: '80px',
        marginBottom: '80px'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          textAlign: 'center',
          color: 'white',
          marginBottom: '60px'
        }}>
          Why Choose AdRunner?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              2+
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Platforms Supported
            </div>
            <div style={{
              fontSize: '16px',
              opacity: '0.9'
            }}>
              Facebook Ads & Google Ads
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              ⚡
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Real-Time Updates
            </div>
            <div style={{
              fontSize: '16px',
              opacity: '0.9'
            }}>
              Get instant campaign data
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              🔒
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              100% Secure
            </div>
            <div style={{
              fontSize: '16px',
              opacity: '0.9'
            }}>
              Enterprise-grade security
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              🤖
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              AI-Powered
            </div>
            <div style={{
              fontSize: '16px',
              opacity: '0.9'
            }}>
              Smart recommendations
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Supported Platforms
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '60px',
          maxWidth: '600px',
          margin: '0 auto 60px'
        }}>
          Connect with the advertising platforms you already use
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px'
        }}>
          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              📘
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#1877F2'
            }}>
              Facebook Ads
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Manage all your Facebook and Instagram ad campaigns, view performance metrics, and optimize your advertising strategy.
            </p>
          </div>

          <div style={{
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              🔵
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#4285F4'
            }}>
              Google Ads
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Access your Google Ads accounts, monitor campaigns across Search, Display, and YouTube, and track ROI in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: '80px 40px',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#ffffff'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '60px',
          color: '#1f2937'
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Is my data secure?
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Yes, absolutely. We use OAuth authentication, which means we never store your passwords. Your data is encrypted and we follow industry best practices to ensure maximum security.
            </p>
          </div>

          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Can I manage multiple ad accounts?
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Yes! AdRunner automatically detects and displays all ad accounts associated with your Facebook and Google accounts, including manager accounts and client accounts.
            </p>
          </div>

          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              How does the AI assistant work?
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Our AI assistant analyzes your campaign data and provides intelligent insights, recommendations, and answers to your questions about campaign performance, optimization strategies, and best practices.
            </p>
          </div>

          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Is there a free trial?
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              AdRunner is currently available to use at no cost. Connect your accounts and start managing your campaigns today!
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
