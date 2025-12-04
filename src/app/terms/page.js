"use client";
import Navigation from "@/components/Navigation";

export default function TermsPage() {
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
          Terms & Conditions
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
            1. Acceptance of Terms
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            By accessing and using AdRunner ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            2. Description of Service
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            AdRunner is a platform that allows you to manage and analyze your Facebook Ads and Google Ads campaigns. The Service provides:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Integration with Facebook Ads and Google Ads platforms</li>
            <li>Unified dashboard for viewing advertising accounts and campaigns</li>
            <li>AI-powered insights and analytics</li>
            <li>Campaign performance monitoring</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            3. User Accounts and Authentication
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            To use the Service, you must:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Be at least 18 years of age</li>
            <li>Have valid Facebook or Google accounts with appropriate permissions</li>
            <li>Have active advertising accounts on Facebook Ads or Google Ads platforms</li>
            <li>Provide accurate and complete information</li>
          </ul>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            4. Third-Party Platform Integration
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            Our Service integrates with Facebook Ads and Google Ads platforms. By using our Service, you acknowledge that:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Your use of Facebook Ads and Google Ads platforms is subject to their respective terms of service</li>
            <li>We are not responsible for the policies, practices, or content of third-party platforms</li>
            <li>You grant us permission to access your advertising data from these platforms</li>
            <li>You may revoke access to your accounts at any time through the platform settings</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            5. Use Restrictions
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            You agree not to:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any laws or regulations in your jurisdiction</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Reverse engineer, decompile, or disassemble the Service</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            6. Intellectual Property
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            The Service and its original content, features, and functionality are owned by AdRunner and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            7. Data and Privacy
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            8. Disclaimer of Warranties
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:
          </p>
          <ul style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginLeft: '24px',
            marginBottom: '16px'
          }}>
            <li>The Service will be uninterrupted or error-free</li>
            <li>Defects will be corrected</li>
            <li>The Service is free of viruses or other harmful components</li>
            <li>The information provided is accurate, complete, or current</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            9. Limitation of Liability
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            To the maximum extent permitted by law, AdRunner shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            10. Indemnification
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            You agree to indemnify and hold harmless AdRunner, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or related to your use of the Service or violation of these Terms.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            11. Termination
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            12. Changes to Terms
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            13. Governing Law
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in [Your Jurisdiction].
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#374151'
          }}>
            14. Contact Information
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.8',
            marginBottom: '16px'
          }}>
            If you have any questions about these Terms, please contact us at:
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
            <strong>Email:</strong> legal@adrunner.com<br />
            <strong>Website:</strong> <a href="/" style={{ color: '#667eea', textDecoration: 'underline' }}>https://adrunner.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

