/**
 * Site Configuration for Indian Developer Tools / SaaS Product
 * Single source of truth for branding, navigation, business details, booking, and feature flags.
 * 
 * Rules:
 * - Brand name comes from one config value (PRODUCT_NAME).
 * - Trust badges and tricolor line are DISABLED by default.
 * - CIN and GSTIN render ONLY if set in config.
 * - Booking provider is Calendly via NEXT_PUBLIC_CALENDLY_URL.
 */

// SINGLE SOURCE OF TRUTH FOR PRODUCT NAME
export const PRODUCT_NAME = "YourBrand";

// Support email across the entire project
export const SUPPORT_EMAIL = "beyondnothing01@gmail.com";

// Resolve Calendly URL from Next.js (process.env) or Vite (import.meta.env)
const CALENDLY_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CALENDLY_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.NEXT_PUBLIC_CALENDLY_URL || import.meta.env?.VITE_NEXT_PUBLIC_CALENDLY_URL)) ||
  "https://cal.id/vikas-sharma-ykmxxw/partnership-call";


export const siteConfig = {
  name: PRODUCT_NAME,
  legalEntityName: `${PRODUCT_NAME} Technologies Pvt. Ltd.`,
  taglineKey: "brand.tagline",
  registrationTextKey: "brand.registeredText",

  // Booking & Demo scheduling configuration
  booking: {
    provider: "calendly",
    url: CALENDLY_URL
  },

  // Feature Flags - Security and Compliance defaults
  flags: {
    /**
     * Trust badges (Data stored in India, UPI/Razorpay supported, GST-compliant invoices)
     * are config-driven and DISABLED by default.
     * MUST only be enabled if true, certified, and legally verified by the business.
     */
    trustBadges: false,

    /**
     * Optional subtle 2px tricolor accent line.
     * DISABLED by default.
     */
    tricolorLine: false,

    /**
     * Optional status/playground indicator in header.
     * Rendered ONLY if true and a valid route or URL is configured below.
     */
    headerPlaygroundIndicator: false,
  },

  // Indian Corporate & Tax Compliance Details (Config-driven & Optional)
  // CIN and GSTIN render ONLY if provided as non-empty valid strings.
  businessDetails: {
    cin: "", // Leave empty until issued by Ministry of Corporate Affairs
    gstin: "", // Leave empty until GSTIN is verified
    incorporationAct: "Registered under the Companies Act, 2013",
    dataResidency: "India (AWS ap-south-1 / GCP asia-south1)"
  },

  // Contact & Office Details in India (Indore, Madhya Pradesh)
  contact: {
    email: SUPPORT_EMAIL,
    salesEmail: SUPPORT_EMAIL,
    city: "Indore",
    state: "Madhya Pradesh",
    address: "Indore, Madhya Pradesh, India",
    addressShort: "Indore, Madhya Pradesh, India"
  },

  // Social & Messaging Links (Rendered as inline SVGs without third-party icon dependencies)
  socials: [
    {
      name: "GitHub",
      href: "https://github.com/yourbrand",
      icon: "github"
    },
    {
      name: "X",
      href: "https://x.com/yourbrand_dev",
      icon: "x"
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/yourbrand",
      icon: "linkedin"
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@yourbrand",
      icon: "youtube"
    },
    {
      name: "Instagram",
      href: "https://instagram.com/yourbrand.dev",
      icon: "instagram"
    }
  ],

  // Trust Badges tailored for Indian Enterprises, SMEs, and Developers
  // Only rendered if flags.trustBadges === true.
  trustBadges: [
    { key: "trustBadges.dataIndia", icon: "shield" },
    { key: "trustBadges.upiRazorpay", icon: "upi" },
    { key: "trustBadges.gstCompliant", icon: "file-check" }
  ],

  // Header Navigation Links
  // Desktop nav visible from lg (1024px) up; collapsible hamburger drawer below 1024px.
  headerNav: [
    { labelKey: "nav.home", href: "/", id: "overview", isExternal: false },
    { labelKey: "nav.howItWorks", href: "#how-it-works", id: "enclave", isExternal: false },
    { labelKey: "nav.pricing", href: "#pricing", id: "pricing", isExternal: false },
    { labelKey: "nav.docs", href: "https://docs.yourbrand.dev", isExternal: true },
    { labelKey: "nav.github", href: "https://github.com/yourbrand", isExternal: true }
  ],

  // Optional status/playground indicator config
  headerPlayground: {
    labelKey: "nav.playground",
    href: "",
    id: "voice"
  },

  // Header Call-To-Action (Single primary CTA)
  headerCta: {
    labelKey: "nav.bookDemo",
    ariaLabelKey: "nav.bookDemoAria"
  },

  // Footer Navigation Columns (2 columns on mobile, 5 on desktop)
  // Column 1 is Brand + Contact block. Columns 2-5 are defined here:
  footerColumns: [
    {
      titleKey: "columns.product",
      links: [
        { labelKey: "links.quickstart", href: "#quickstart", id: "overview" },
        { labelKey: "links.howItWorks", href: "#how-it-works", id: "enclave" },
        { labelKey: "links.apiReference", href: "https://docs.yourbrand.dev/api", isExternal: true },
        { labelKey: "links.pricingInr", href: "#pricing", id: "pricing" },
        { labelKey: "links.changelog", href: "#changelog" }
      ]
    },
    {
      titleKey: "columns.forBusiness",
      links: [
        { labelKey: "links.bookCall", isBooking: true },
        { labelKey: "links.contactSales", href: `mailto:${SUPPORT_EMAIL}` },
        { labelKey: "links.gstBilling", href: "#gst-billing" },
        { labelKey: "links.enterprise", href: "#enterprise", id: "admin" },
        { labelKey: "links.partners", href: "#partners" },
        { labelKey: "links.caseStudies", href: "#case-studies" }
      ]
    },
    {
      titleKey: "columns.developers",
      links: [
        { labelKey: "links.docs", href: "https://docs.yourbrand.dev", isExternal: true },
        { labelKey: "links.github", href: "https://github.com/yourbrand", isExternal: true },
        { labelKey: "links.npm", href: "https://npmjs.com/package/@yourbrand/sdk", isExternal: true },
        { labelKey: "links.community", href: "https://discord.gg/yourbrand", isExternal: true },
        { labelKey: "links.hackathons", href: "#hackathons" }
      ]
    },
    {
      titleKey: "columns.companyLegal",
      links: [
        { labelKey: "links.about", href: "#about" },
        { labelKey: "links.careers", href: "#careers" },
        { labelKey: "links.blog", href: "#blog" },
        { labelKey: "links.privacyPolicy", href: "/privacy", id: "privacy" },
        { labelKey: "links.termsOfService", href: "/terms", id: "terms" },
        { labelKey: "links.refundPolicy", href: "/refund-policy", id: "refund-policy" },
        { labelKey: "links.grievanceOfficer", href: "/grievance-officer", id: "grievance-officer" },
        { labelKey: "links.dpdpAct", href: "/dpdp-compliance", id: "dpdp-compliance" }
      ]
    }
  ],

  // System status indicator in footer
  systemStatus: {
    statusKey: "footer.systemsOperational",
    href: "https://status.yourbrand.dev"
  }
};
