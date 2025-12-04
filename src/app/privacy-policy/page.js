"use client";
import Navigation from "@/components/Navigation";

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <Navigation />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 40px',
        backgroundColor: 'white',
        marginTop: '40px',
        marginBottom: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          marginBottom: '16px',
          color: '#1f2937',
          borderBottom: '3px solid #667eea',
          paddingBottom: '16px'
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '40px'
        }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            1. Introduction
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            Welcome to AdRunner ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application that integrates with Facebook Ads and Google Ads platforms.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            2. Information We Collect
          </h2>
          
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '12px',
            marginTop: '24px',
            color: '#4b5563'
          }}>
            2.1 Account Information
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            When you log in using Facebook or Google, we collect your email address and basic profile information provided by these services.
          </p>

          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '12px',
            marginTop: '24px',
            color: '#4b5563'
          }}>
            2.2 Advertising Account Data
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We access and store information about your advertising accounts, campaigns, ad sets, and performance metrics from Facebook Ads and Google Ads platforms. This includes:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Account IDs and names</li>
            <li>Campaign performance data (impressions, clicks, spend, conversions)</li>
            <li>Campaign settings and configurations</li>
            <li>Ad creative information</li>
          </ul>

          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '12px',
            marginTop: '24px',
            color: '#4b5563'
          }}>
            2.3 Access Tokens
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We securely store access tokens provided by Facebook and Google to maintain your session and access your advertising data. These tokens are encrypted and stored securely.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            3. How We Use Your Information
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We use the information we collect to:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Provide and maintain our service</li>
            <li>Display your advertising accounts and campaigns</li>
            <li>Generate AI-powered insights and analytics</li>
            <li>Improve our application and user experience</li>
            <li>Communicate with you about your account and our services</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            4. Data Sharing and Disclosure
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li><strong>Service Providers:</strong> We may share data with trusted service providers who assist in operating our application, subject to confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</li>
            <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred to the new entity.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            5. Data Security
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Secure token storage and management</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
          </ul>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            6. Your Rights and Choices
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            You have the right to:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Access your personal information</li>
            <li>Request deletion of your data</li>
            <li>Revoke access to your Facebook or Google accounts at any time</li>
            <li>Opt out of certain data processing activities</li>
          </ul>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            To exercise these rights, please contact us using the information provided below.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            7. Third-Party Services
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            Our application integrates with Facebook Ads and Google Ads platforms. Your use of these platforms is subject to their respective privacy policies:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>Facebook Privacy Policy</a></li>
            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>Google Privacy Policy</a></li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            8. Data Retention
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We retain your information for as long as necessary to provide our services and fulfill the purposes described in this Privacy Policy. When you disconnect your accounts or delete your account, we will delete or anonymize your data in accordance with our data retention policies.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            9. Changes to This Privacy Policy
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            10. Contact Us
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {/* <strong>Email:</strong> privacy@adrunner.com<br /> */}
            <strong>Website:</strong> <a href="/" style={{ color: '#667eea', textDecoration: 'underline' }}>https://fb-campaign.vercel.app</a>
          </p>
        </section>
      </div>
    </div>
  );
}

