"use client";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If the URL contains '#_=_', remove it and redirect to the home page
    if (window.location.hash === "#_=_") {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
      router.push("/"); // Redirect to home page
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <h1 style={{ fontSize: '30px', fontWeight: '600', marginBottom: '30px', color: 'black' }}>Login to Ad Platform</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
        <button
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#1877F2',
            color: 'white',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#166FE5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#1877F2'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            style={{ marginRight: '10px' }}
            viewBox="0 0 24 24"
          >
            <path
              d="M22.675 0H1.325C.595 0 0 .595 0 1.325v21.351C0 23.405.595 24 1.325 24h11.497v-9.294H9.404v-3.622h3.418V9.222c0-4.227 2.485-6.557 6.286-6.557 1.828 0 3.716.325 3.716.325v4.084h-2.09c-2.045 0-2.68 1.27-2.68 2.568v3.318h4.274l-.682 3.622h-3.592V24h7.372c.73 0 1.325-.595 1.325-1.325V1.325C24 .595 23.405 0 22.675 0z"
            />
          </svg>
          Login with Facebook
        </button>

        <button
          onClick={() => signIn("google", { callbackUrl: "/google" })}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#ffffff',
            color: '#3c4043',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #dadce0',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.15)';
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ marginRight: '10px' }}
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Login with Google
        </button>
      </div>
    </div>
  );
}
