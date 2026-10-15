/**
 * Site Configuration for Indian Developer Tools / SaaS Product
 * Single source of truth for branding, navigation, business details, and links.
 */

// SINGLE SOURCE OF TRUTH FOR PRODUCT NAME
export const PRODUCT_NAME = "YourBrand";

export const siteConfig = {
  name: PRODUCT_NAME,
  legalEntityName: `${PRODUCT_NAME} Technologies Pvt. Ltd.`,
  taglineKey: "brand.tagline",
  registrationTextKey: "brand.registeredText",

  // Indian Corporate & Tax Compliance Details (Config-driven & Optional)
  businessDetails: {
    cin: "U72900KA2024PTC189420",
    gstin: "29AABCY8942Q1Z5",
    incorporationAct: "Registered under the Companies Act, 2013",
    dataResidency: "India (MeitY empaneled AWS ap-south-1 / GCP asia-south1)"
  },

  // Contact & Registered Office in India
  contact: {
    email: "support@yourbrand.dev",
    salesEmail: "sales@yourbrand.dev",
    phone: "+91 80 4567 8900",
    phoneDisplay: "+91 80 4567 8900",
    address: "Prestige Cyber Towers, 4th Floor, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India",
    addressShort: "Bengaluru, Karnataka, India"
  },

  // Social & Messaging Links (including Indian WhatsApp Business)
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
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/918045678900?text=Hi%20YourBrand%20Team,%20I%20would%20like%20to%20learn%20more.",
      icon: "whatsapp"
    }
  ],

  // Trust Badges tailored for Indian Enterprises, SMEs, and Developers
  trustBadges: [
    { key: "trustBadges.dataIndia", icon: "shield" },
    { key: "trustBadges.upiRazorpay", icon: "upi" },
    { key: "trustBadges.gstCompliant", icon: "file-check" }
  ],

  // Header Navigation Links
  headerNav: [
    { labelKey: "nav.home", href: "/", id: "overview", isExternal: false },
    { labelKey: "nav.howItWorks", href: "#how-it-works", id: "enclave", isExternal: false },
    { labelKey: "nav.pricing", href: "#pricing", id: "pricing", isExternal: false },
    { labelKey: "nav.docs", href: "https://docs.yourbrand.dev", isExternal: true },
    { labelKey: "nav.github", href: "https://github.com/yourbrand", isExternal: true },
    { labelKey: "nav.contactSales", href: "mailto:sales@yourbrand.dev?subject=Enterprise%20Inquiry", isExternal: false }
  ],

  headerPlayground: {
    labelKey: "nav.playground",
    id: "voice"
  },

  headerCta: {
    labelKey: "nav.bookDemo",
    href: "https://calendly.com/yourbrand-demo",
    isExternal: true
  },

  // Footer 4 Navigation Columns (Column 1 is Brand + Contact Block)
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
        { labelKey: "links.contactSales", href: "mailto:sales@yourbrand.dev" },
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
        { labelKey: "links.privacyPolicy", href: "#privacy" },
        { labelKey: "links.termsOfService", href: "#terms" },
        { labelKey: "links.refundPolicy", href: "#refund-policy" },
        { labelKey: "links.grievanceOfficer", href: "#grievance-officer" },
        { labelKey: "links.dpdpAct", href: "#dpdp-compliance" }
      ]
    }
  ],

  systemStatus: {
    statusKey: "footer.systemsOperational",
    href: "https://status.yourbrand.dev"
  }
};
