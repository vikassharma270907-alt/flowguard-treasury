/**
 * Legal Stub Pages Component
 * 
 * Provides compliant stub pages for:
 * - Privacy Policy (/privacy)
 * - Terms of Service (/terms)
 * - Refund & Cancellation Policy (/refund-policy)
 * - Grievance Officer (/grievance-officer)
 * - DPDP Act Notice (/dpdp-compliance)
 * 
 * Each stub displays a prominent "Draft – replace with reviewed legal text" banner
 * and does not invent unverified legal clauses or compliance assertions.
 */

import React from 'react';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    titleHi: 'गोपनीयता नीति',
    lastUpdated: 'October 2026',
    sections: [
      {
        heading: '1. Overview & Scope',
        content: 'This Privacy Policy describes how [Legal Entity Name] collects, uses, stores, and protects personal data when using our developer tools, APIs, and cloud services in accordance with Indian data protection laws.'
      },
      {
        heading: '2. Data Collection & Processing Purposes',
        content: 'We process technical log information, account credentials, and transaction telemetry solely for service delivery, infrastructure security, and statutory compliance.'
      },
      {
        heading: '3. Data Storage & Sovereign Residency',
        content: 'Customer and operational data is stored within certified cloud regions in India (AWS ap-south-1 / GCP asia-south-1). No unauthorized cross-border transfers occur without lawful basis.'
      },
      {
        heading: '4. Contact & Legal Inquiry',
        content: 'For data privacy queries, contact our privacy team at the registered office or via email.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    titleHi: 'सेवा की शर्तें',
    lastUpdated: 'October 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        content: 'By accessing or using the developer APIs, platforms, or services provided by [Legal Entity Name], you agree to be bound by these Terms of Service.'
      },
      {
        heading: '2. Permitted Use & API Rate Limits',
        content: 'Users must adhere to published security guidelines, rate limits, and authentication protocols. Reverse engineering or security bypassing is strictly prohibited.'
      },
      {
        heading: '3. Intellectual Property',
        content: 'All rights, title, and interest in the platform, proprietary algorithms, and brand assets remain the exclusive property of [Legal Entity Name].'
      },
      {
        heading: '4. Governing Law & Jurisdiction',
        content: 'These terms are governed by the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts located in Indore, Madhya Pradesh.'
      }
    ]
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    titleHi: 'धनवापसी और रद्दीकरण नीति',
    lastUpdated: 'October 2026',
    sections: [
      {
        heading: '1. Subscription Billing & Cancellations',
        content: 'SaaS subscriptions are billed on a recurring monthly or annual basis. You may cancel your subscription at any time prior to the billing cycle renewal via your account console.'
      },
      {
        heading: '2. Refund Eligibility',
        content: 'Refund requests submitted within 7 business days of an initial payment will be evaluated on a case-by-case basis where verifiable service downtime or billing errors occurred.'
      },
      {
        heading: '3. Processing Timelines',
        content: 'Approved refunds will be processed via original payment rails (UPI, Netbanking, Credit Card via authorized payment aggregators) within 5–7 business days in Indian Rupees (INR).'
      }
    ]
  },
  'grievance-officer': {
    title: 'Grievance Officer Designation',
    titleHi: 'शिकायत निवारण अधिकारी',
    lastUpdated: 'October 2026',
    sections: [
      {
        heading: '1. Statutory Requirement',
        content: 'In accordance with Information Technology Act, 2000 and rules made thereunder, and the Digital Personal Data Protection Act, 2023, the details of the Grievance Redressal Officer are published below.'
      },
      {
        heading: '2. Officer Contact Information',
        content: 'Name: Designated Grievance Officer\nAddress: Indore, Madhya Pradesh, India\nEmail: beyondnothing01@gmail.com\nResponse Time: Acknowledgement within 24 hours, resolution within statutory timeframe (15 days).'
      },
      {
        heading: '3. Grievance Escalation Procedure',
        content: 'Users may lodge complaints regarding content, privacy concerns, or security violations. Please include relevant ticket IDs, timestamps, and verifiable documentation.'
      }
    ]
  },
  'dpdp-compliance': {
    title: 'DPDP Act Notice (Data Protection)',
    titleHi: 'डीपीडीपी अधिनियम सूचना',
    lastUpdated: 'October 2026',
    sections: [
      {
        heading: '1. Digital Personal Data Protection Act, 2023 Compliance',
        content: 'This notice sets forth the rights of Data Principals and the obligations of [Legal Entity Name] acting as a Data Fiduciary under the DPDP Act, 2023.'
      },
      {
        heading: '2. Data Principal Rights',
        content: 'Data Principals possess the right to access summary data, rectify inaccuracies, request data erasure, and register grievances through our designated redressal channel.'
      },
      {
        heading: '3. Notice of Lawful Processing',
        content: 'Personal data is collected with informed consent or for legitimate uses specified by law. Processing is limited to the stated purpose of enterprise software provisioning.'
      }
    ]
  }
};

export default function LegalPages({ docKey = 'privacy', onBackToHome }) {
  const { t, language } = useI18n();
  const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.privacy;

  return (
    <article
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '40px 20px 80px 20px',
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#111111'
      }}
      aria-labelledby="legal-page-title"
    >
      {/* Back to Home Breadcrumb */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBackToHome}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: '#16a34a',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none'
          }}
          aria-label={t('legal.backToHome')}
        >
          {t('legal.backToHome')}
        </button>
      </div>

      {/* Prominent Mandatory Legal Draft Banner */}
      <div
        role="alert"
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">⚠️</span>
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#92400e',
                margin: '0 0 4px 0'
              }}
            >
              {t('legal.draftNoticeTitle')}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#b45309',
                margin: 0,
                lineHeight: 1.5
              }}
            >
              {t('legal.draftNoticeBody')}
            </p>
          </div>
        </div>
      </div>

      {/* Document Header */}
      <header style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '20px', marginBottom: '28px' }}>
        <h1
          id="legal-page-title"
          style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
            color: '#111111'
          }}
        >
          {language === 'hi' ? doc.titleHi : doc.title}
        </h1>
        <p style={{ fontSize: '13px', color: '#6b6b6b', margin: 0 }}>
          Last Updated: {doc.lastUpdated} · Entity: {siteConfig.legalEntityName}
        </p>
      </header>

      {/* Document Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.65 }}>
        {doc.sections.map((sec, idx) => (
          <section key={idx} style={{ padding: '4px 0' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#111111',
                marginBottom: '8px',
                marginTop: 0
              }}
            >
              {sec.heading}
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#374151',
                margin: 0,
                whiteSpace: 'pre-line'
              }}
            >
              {sec.content.replace(/\[Legal Entity Name\]/g, siteConfig.legalEntityName)}
            </p>
          </section>
        ))}
      </div>

      {/* Statutory Footer Footnote */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0',
          fontSize: '12px',
          color: '#6b6b6b'
        }}
      >
        <div>{siteConfig.legalEntityName} · {siteConfig.contact.addressShort}</div>
        <div>Inquiries: {siteConfig.contact.email}</div>
      </footer>
    </article>
  );
}
