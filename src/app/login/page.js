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
      <h1 style={{ fontSize: '30px', fontWeight: '600', marginBottom: '20px', color: 'black' }}>Login with Facebook</h1>
      <button
        onClick={() => signIn("facebook")}
        style={{
          width: '300px',
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
        }}
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
    </div>
  );
}
