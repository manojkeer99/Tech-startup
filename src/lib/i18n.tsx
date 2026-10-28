import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '@/types';

export const DICTIONARY = {
  en: {
    // Brand
    brandName: 'THE CREATORS',
    tagline: 'Build. Break. On Demand.',
    subTagline: 'Websites, applications, software, video post-production, game mods, and graphic design — seven disciplines, one senior team. Built to spec, tracked live.',
    freelanceStudio: 'Creative Engineering Studio',
    
    // Navigation
    navHome: 'Home',
    navServices: 'Services',
    navProcess: 'Process',
    navCommunity: 'Community',
    navContact: 'Contact',
    navStartProject: 'Request a Project',
    navLogin: 'Log in',
    navSignup: 'Sign up',
    navDashboard: 'Dashboard',
    navAdmin: 'Admin Panel',
    navLogout: 'Log out',

    // Hero
    heroPill: 'High-Impact Digital Production',
    heroLine1: 'WE BUILD',
    heroLine2: 'DIGITAL',
    heroLine3: 'EXCELLENCE',
    heroCtaPrimary: 'Discuss Your Requirements',
    heroCtaSecondary: 'Explore Services',
    heroStat1Label: 'Disciplines',
    heroStat1Value: '7 Disciplines',
    heroStat2Label: 'Live Tracking',
    heroStat2Value: 'Direct Milestone',
    heroStat3Label: 'First Response',
    heroStat3Value: '< 24 Hours',

    // Persistent announcement tagline
    taglineBanner: 'No generic packages or hidden costs. We consult directly with you on your requirements and craft a targeted agreement.',

    // Services section
    servicesHeadingKicker: 'Core Capabilities',
    servicesTitle: 'Seven disciplines tailored to your exact scope',
    servicesSubtitle: 'Explore our full-spectrum production disciplines built to exact specifications with live milestone tracking.',
    viewService: 'View details',
    customScopeBadge: 'Custom Discussion',
    inquiryFree: 'Direct Consultation · Free Intake',

    // Process section
    processKicker: 'How We Work',
    processTitle: 'From technical brief to production launch',
    step1Title: 'Direct Requirement Intake',
    step1Desc: 'Choose your discipline, detail your objectives, and attach reference files. Takes minutes, zero commitment.',
    step2Title: 'Scoping & Strategy',
    step2Desc: 'Our senior team reviews your specifications personally and responds with a tailored scope within 24 hours.',
    step3Title: 'Transparent Production',
    step3Desc: 'Development runs in focused sprints with live status, progress percentages, and direct milestone messages.',
    step4Title: 'Delivery & Deployment',
    step4Desc: 'Full source code, production assets, comprehensive documentation, and a dedicated post-launch support window.',

    // Pillars
    pillarsKicker: 'Our Philosophy',
    pillarsTitle: 'Engineered with accountability and craft',
    pillar1Title: 'Direct Senior Communication',
    pillar1Desc: 'You talk directly with the engineers and designers building your project — never account managers.',
    pillar2Title: 'Zero Cookie-Cutter Templates',
    pillar2Desc: 'Every line of code and pixel of design is custom engineered for your product identity.',
    pillar3Title: 'Real-Time Progress Tracking',
    pillar3Desc: 'Watch milestone percentages and production notes update live on your client dashboard.',
    pillar4Title: 'Transparent Negotiations',
    pillar4Desc: 'All project budgets and milestones are agreed upfront through direct dialogue before execution.',

    // Community / Social
    communityKicker: 'Official Channels',
    communityTitle: 'Connect with our engineering community',
    communityDesc: 'Join our official Discord community for project announcements, behind-the-scenes engineering, and direct team discussions.',
    joinDiscord: 'Join Official Discord',
    followInstagram: 'Follow on Instagram',

    // CTA
    ctaTitle: 'Have a project in mind? Let\'s discuss your scope.',
    ctaSubtitle: 'Submit your requirements in minutes. Our team reviews every brief and responds with a tailored roadmap within 24 hours.',
    ctaButton: 'Request a Project',

    // Project Form
    projectIntakeKicker: 'Project Intake',
    projectIntakeTitle: 'Discuss your project requirements',
    projectIntakeSubtitle: 'Provide as much context as possible. Scope, timeline, and pricing are discussed directly with you before work begins.',
    step1Label: '01 · Select Service',
    step2Label: '02 · Project Details',
    step3Label: '03 · References & Files',
    fullName: 'Full name',
    emailAddress: 'Email address',
    contactNumber: 'Phone / WhatsApp (optional)',
    ageField: 'Age (optional)',
    projectTitle: 'Project title',
    projectDesc: 'Project overview & goals',
    projectRequirements: 'Key requirements & must-haves',
    budgetField: 'Project discussion preference',
    deadlineField: 'Target completion date',
    referencesField: 'Reference links / Competitors',
    attachmentsLabel: 'Attach files (PDF, images, brief, zip — up to 5 files, 2MB each)',
    submitProjectButton: 'Submit Project Request',
    submitting: 'Submitting...',
    submissionSuccess: 'Project Request Received',
    copyId: 'Copy Reference ID',
    copied: 'Copied!',
    whatNext: 'Next Steps',
    nextStep1: 'Our engineering lead evaluates your brief (< 24h).',
    nextStep2: 'We schedule a direct scoping dialogue to agree on timeline and milestones.',
    nextStep3: 'Production begins with live progress tracking in your dashboard.',
    trackInDashboard: 'Track in Dashboard',
    createAccountToTrack: 'Create Account to Track',
    submitAnother: 'Submit Another Request',

    // Contact Form
    contactTitle: 'Get in touch with our team',
    contactSubtitle: 'Have a question before submitting a project? Send us a direct inquiry.',
    subject: 'Subject',
    message: 'Message',
    sendMessage: 'Send message',
    messageSent: 'Message sent successfully. We will reply within 24 hours.',
    preferEmail: 'Direct email: thecreators.pvt.ltd@gmail.com',

    // Auth
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Access your projects, deliverables, and milestone tracker.',
    password: 'Password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    forgotPassword: 'Forgot password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    continueWithGoogle: 'Continue with Google',
    createAccountTitle: 'Create Client Account',
    createAccountSubtitle: 'Track your projects in real time with milestone updates.',
    welcomeTokensNotice: 'Instant client portal access upon registration.',
    resetPasswordTitle: 'Reset your password',
    resetPasswordSubtitle: 'Enter your registered email and we will send a secure single-use reset link.',
    sendResetLink: 'Generate reset link',
    resetSuccess: 'Password reset link generated.',
    updatePassword: 'Update password',
    backToLogin: 'Back to login',

    // Dashboard
    dashboardKicker: 'Client Portal',
    myProjects: 'My Projects',
    newProject: 'New Project',
    tokenWallet: 'Deliverables',
    notifications: 'Notifications',
    profile: 'Profile',
    activeProjects: 'Active Projects',
    totalProjects: 'Total Projects',
    tokenBalance: 'Deliverables',
    clientSince: 'Client Since',
    progress: 'Progress',
    noProjectsYet: 'No project requests submitted yet.',
    submitFirstProject: 'Submit your first project brief to begin tracking live.',
    updatesFromTeam: 'Team updates & notes',
    noUpdatesYet: 'No updates posted yet. Our team will review your brief shortly.',
    markAllRead: 'Mark all read',

    // Admin
    adminTitle: 'Studio Mission Control',
    adminSubtitle: 'Client pipeline, project approvals, deliverable management, and activity audit.',
    tabOverview: 'Overview',
    tabProjects: 'Projects Pipeline',
    tabClients: 'Clients & Users',
    tabTokens: 'Project Ledger',
    tabServices: 'Services',
    tabIntegrations: 'Integrations',
    tabAudit: 'Audit Trail',
    clientDirectory: 'Client Accounts',
    projectPipeline: 'Project Pipeline',
    statusSubmitted: 'Submitted',
    statusApproved: 'Approved',
    statusInProgress: 'In Progress',
    statusDelivered: 'Delivered',
    statusCompleted: 'Completed',
    statusRejected: 'Rejected',
    approveProject: 'Approve Project',
    rejectProject: 'Reject Project',
    publishUpdate: 'Publish Update',
    updateProgress: 'Update Progress',
    messageToClient: 'Direct update note to client',
    adjustTokens: 'Manage User',
    suspendAccount: 'Suspend Account',
    reinstateAccount: 'Reinstate Account',
    deleteProject: 'Delete Project',

    // Themes
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',

    // Languages
    langEn: 'English',
    langHi: 'हिंदी (Hindi)',

    // Common
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    loading: 'Loading...',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
  },
  hi: {
    // Brand
    brandName: 'THE CREATORS',
    tagline: 'बिल्ड. ब्रेक. ऑन डिमांड.',
    subTagline: 'वेबसाइट्स, ऍप्लिकेशन्स, कस्टम सॉफ्टवेयर, वीडियो एडिटिंग, गेम मॉड्स और ग्राफ़िक डिज़ाइन — सात विधाएं, एक विशेषज्ञ टीम। विनिर्देशानुसार निर्मित, लाइव ट्रैकिंग।',
    freelanceStudio: 'क्रिएटिव इंजीनियरिंग स्टूडियो',

    // Navigation
    navHome: 'होम',
    navServices: 'सेवाएं',
    navProcess: 'प्रक्रिया',
    navCommunity: 'समुदाय',
    navContact: 'संपर्क',
    navStartProject: 'प्रोजेक्ट का अनुरोध करें',
    navLogin: 'लॉग इन',
    navSignup: 'साइन अप',
    navDashboard: 'डैशबोर्ड',
    navAdmin: 'एडमिन पैनल',
    navLogout: 'लॉग आउट',

    // Hero
    heroPill: 'उच्च-स्तरीय डिजिटल उत्पादन',
    heroLine1: 'हम बनाते हैं',
    heroLine2: 'डिजिटल',
    heroLine3: 'उत्कृष्टता',
    heroCtaPrimary: 'अपनी आवश्यकताएं बताएं',
    heroCtaSecondary: 'सेवाएं देखें',
    heroStat1Label: 'विशेषज्ञ विधाएं',
    heroStat1Value: '7 विधाएं',
    heroStat2Label: 'लाइव ट्रैकिंग',
    heroStat2Value: 'सीधा माइलस्टोन',
    heroStat3Label: 'प्रथम प्रतिक्रिया',
    heroStat3Value: '< 24 घंटे',

    // Persistent announcement tagline
    taglineBanner: 'कोई जेनेरिक पैकेज या छुपा शुल्क नहीं। हम सीधे आपसे आवश्यकताओं पर चर्चा करते हैं और एक पारदर्शी प्रस्ताव तैयार करते हैं।',

    // Services section
    servicesHeadingKicker: 'मुख्य क्षमताएं',
    servicesTitle: 'आपकी सटीक आवश्यकताओं के अनुसार सात विधाएं',
    servicesSubtitle: 'लाइव माइलस्टोन ट्रैकिंग और वरिष्ठ इंजीनियरिंग टीम के साथ हमारी पूर्ण-स्पेक्ट्रम उत्पादन विधाएं देखें।',
    viewService: 'विवरण देखें',
    customScopeBadge: 'कस्टम चर्चा',
    inquiryFree: 'सीधा परामर्श · निःशुल्क अनुरोध',

    // Process section
    processKicker: 'हमारी कार्यप्रणाली',
    processTitle: 'तकनीकी ब्रीफ से लेकर लॉन्च तक',
    step1Title: 'सीधी आवश्यकता इनटेक',
    step1Desc: 'अपनी विधा चुनें, अपने उद्देश्य लिखें, और संदर्भ फ़ाइलें जोड़ें। केवल कुछ मिनट, बिना किसी बाध्यता के।',
    step2Title: 'स्कोपिंग एवं रणनीति',
    step2Desc: 'हमारी वरिष्ठ टीम व्यक्तिगत रूप से आपके विनिर्देशों की समीक्षा करती है और 24 घंटे में अनुकूलित स्कोप प्रदान करती है।',
    step3Title: 'पारदर्शी उत्पादन',
    step3Desc: 'विकास केंद्रित स्प्रिंट्स में चलता है, जिसमें लाइव स्थिति, प्रगति प्रतिशत और सीधे अपडेट संदेश होते हैं।',
    step4Title: 'वितरण एवं डिप्लॉयमेंट',
    step4Desc: 'पूर्ण सोर्स कोड, प्रोडक्शन एसेट्स, विस्तृत दस्तावेज़ीकरण और लॉन्च के बाद समर्पित समर्थन अवधि।',

    // Pillars
    pillarsKicker: 'हमारा दृष्टिकोण',
    pillarsTitle: 'विश्वसनीयता और शिल्प कौशल से निर्मित',
    pillar1Title: 'वरिष्ठ टीम से सीधा संवाद',
    pillar1Desc: 'आप सीधे उन डेवलपर्स और डिज़ाइनर्स से बात करते हैं जो आपका प्रोजेक्ट बना रहे हैं — किसी मध्यस्थ से नहीं।',
    pillar2Title: 'कोई रेडीमेड टेम्पलेट नहीं',
    pillar2Desc: 'कोड की हर पंक्ति और डिज़ाइन का हर पिक्सेल आपके उत्पाद की पहचान के लिए विशेष रूप से तैयार किया गया है।',
    pillar3Title: 'रियल-टाइम प्रगति ट्रैकिंग',
    pillar3Desc: 'माइलस्टोन प्रतिशत और उत्पादन नोट्स को अपने क्लाइंट डैशबोर्ड में लाइव अपडेट होते देखें।',
    pillar4Title: 'पारदर्शी मूल्य निर्धारण चर्चा',
    pillar4Desc: 'सभी प्रोजेक्ट बजट और माइलस्टोन काम शुरू करने से पहले सीधी बातचीत द्वारा तय किए जाते हैं।',

    // Community / Social
    communityKicker: 'आधिकारिक चैनल',
    communityTitle: 'हमारे इंजीनियरिंग समुदाय से जुड़ें',
    communityDesc: 'प्रोजेक्ट घोषणाओं, पर्दे के पीछे की इंजीनियरिंग और टीम से सीधे संवाद के लिए हमारे आधिकारिक डिस्कॉर्ड समुदाय से जुड़ें।',
    joinDiscord: 'आधिकारिक डिस्कॉर्ड से जुड़ें',
    followInstagram: 'इंस्टाग्राम पर फॉलो करें',

    // CTA
    ctaTitle: 'कोई प्रोजेक्ट आपके विचार में है? आइए चर्चा करें।',
    ctaSubtitle: 'कुछ ही मिनटों में अपनी आवश्यकताएं भेजें। हमारी टीम हर ब्रीफ की समीक्षा करती है और 24 घंटे में योजना साझा करती है।',
    ctaButton: 'प्रोजेक्ट का अनुरोध करें',

    // Project Form
    projectIntakeKicker: 'प्रोजेक्ट अनुरोध',
    projectIntakeTitle: 'अपने प्रोजेक्ट की आवश्यकताएं साझा करें',
    projectIntakeSubtitle: 'जितना अधिक संदर्भ देंगे, उतना सटीक हमारा प्रस्ताव होगा। काम शुरू करने से पहले स्कोप और बजट पर सीधे चर्चा होगी।',
    step1Label: '01 · सेवा चुनें',
    step2Label: '02 · प्रोजेक्ट विवरण',
    step3Label: '03 · संदर्भ एवं फ़ाइलें',
    fullName: 'पूरा नाम',
    emailAddress: 'ईमेल पता',
    contactNumber: 'फ़ोन / व्हाट्सएप (वैकल्पिक)',
    ageField: 'आयु (वैकल्पिक)',
    projectTitle: 'प्रोजेक्ट शीर्षक',
    projectDesc: 'प्रोजेक्ट अवलोकन एवं लक्ष्य',
    projectRequirements: 'आवश्यक सुविधाएं एवं शर्तें',
    budgetField: 'प्रोजेक्ट बजट प्राथमिक चयन',
    deadlineField: 'अपेक्षित पूर्णता तिथि',
    referencesField: 'संदर्भ लिंक्स / उदाहरण',
    attachmentsLabel: 'फ़ाइलें संलग्न करें (PDF, इमेज, ब्रीफ, ज़िप — अधिकतम 5 फ़ाइलें, प्रत्येक 2MB तक)',
    submitProjectButton: 'प्रोजेक्ट अनुरोध सबमिट करें',
    submitting: 'सबमिट हो रहा है...',
    submissionSuccess: 'प्रोजेक्ट अनुरोध प्राप्त हुआ',
    copyId: 'रेफरेंस आईडी कॉपी करें',
    copied: 'कॉपी हो गया!',
    whatNext: 'आगे क्या होगा',
    nextStep1: 'हमारी इंजीनियरिंग टीम आपकी ब्रीफ का मूल्यांकन करती है (< 24 घंटे)।',
    nextStep2: 'हम समयसीमा और माइलस्टोन तय करने के लिए सीधी बातचीत करते हैं।',
    nextStep3: 'आपके डैशबोर्ड में लाइव ट्रैकिंग के साथ उत्पादन शुरू होता है।',
    trackInDashboard: 'डैशबोर्ड में ट्रैक करें',
    createAccountToTrack: 'ट्रैक करने के लिए खाता बनाएं',
    submitAnother: 'एक और अनुरोध सबमिट करें',

    // Contact Form
    contactTitle: 'हमारी टीम से संपर्क करें',
    contactSubtitle: 'प्रोजेक्ट सबमिट करने से पहले कोई प्रश्न है? हमें सीधा संदेश भेजें।',
    subject: 'विषय',
    message: 'संदेश',
    sendMessage: 'संदेश भेजें',
    messageSent: 'संदेश सफलतापूर्वक भेजा गया। हम 24 घंटे के भीतर उत्तर देंगे।',
    preferEmail: 'सीधा ईमेल: thecreators.pvt.ltd@gmail.com',

    // Auth
    loginTitle: 'वापसी पर स्वागत है',
    loginSubtitle: 'अपने प्रोजेक्ट्स, डिलिवरेबल्स और माइलस्टोन ट्रैकर तक पहुंचें।',
    password: 'पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    dontHaveAccount: 'खाता नहीं है?',
    alreadyHaveAccount: 'पहले से पंजीकृत हैं?',
    continueWithGoogle: 'गूगल से जारी रखें',
    createAccountTitle: 'क्लाइंट खाता बनाएं',
    createAccountSubtitle: 'माइलस्टोन अपडेट्स के साथ अपने प्रोजेक्ट्स को रियल टाइम में ट्रैक करें।',
    welcomeTokensNotice: 'पंजीकरण पर त्वरित क्लाइंट पोर्टल एक्सेस उपलब्ध है।',
    resetPasswordTitle: 'अपना पासवर्ड रीसेट करें',
    resetPasswordSubtitle: 'अपना पंजीकृत ईमेल दर्ज करें और हम एक सुरक्षित रीसेट लिंक प्रदान करेंगे।',
    sendResetLink: 'रीसेट लिंक जनरेट करें',
    resetSuccess: 'पासवर्ड रीसेट लिंक तैयार हो गया है।',
    updatePassword: 'पासवर्ड अपडेट करें',
    backToLogin: 'लॉग इन पर वापस जाएं',

    // Dashboard
    dashboardKicker: 'क्लाइंट पोर्टल',
    myProjects: 'मेरे प्रोजेक्ट्स',
    newProject: 'नया प्रोजेक्ट',
    tokenWallet: 'डिलिवरेबल्स',
    notifications: 'सूचनाएं',
    profile: 'प्रोफ़ाइल',
    activeProjects: 'सक्रिय प्रोजेक्ट्स',
    totalProjects: 'कुल प्रोजेक्ट्स',
    tokenBalance: 'डिलिवरेबल्स',
    clientSince: 'सदस्यता तिथि',
    progress: 'प्रगति',
    noProjectsYet: 'अभी तक कोई प्रोजेक्ट अनुरोध सबमिट नहीं हुआ है।',
    submitFirstProject: 'लाइव ट्रैकिंग शुरू करने के लिए अपना पहला प्रोजेक्ट सबमिट करें।',
    updatesFromTeam: 'टीम से अपडेट्स एवं नोट्स',
    noUpdatesYet: 'अभी तक कोई अपडेट नहीं है। हमारी टीम जल्द ही समीक्षा करेगी।',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',

    // Admin
    adminTitle: 'स्टूडियो मिशन कंट्रोल',
    adminSubtitle: 'क्लाइंट पाइपलाइन, प्रोजेक्ट स्वीकृतियां, कार्य प्रबंधन और ऑडिट ट्रेल।',
    tabOverview: 'अवलोकन',
    tabProjects: 'प्रोजेक्ट पाइपलाइन',
    tabClients: 'क्लाइंट्स एवं उपयोगकर्ता',
    tabTokens: 'प्रोजेक्ट लेज़र',
    tabServices: 'सेवाएं',
    tabIntegrations: 'इंटीग्रेशन्स',
    tabAudit: 'ऑडिट ट्रेल',
    clientDirectory: 'क्लाइंट खाते',
    projectPipeline: 'प्रोजेक्ट पाइपलाइन',
    statusSubmitted: 'सबमिट हुआ',
    statusApproved: 'स्वीकृत',
    statusInProgress: 'प्रगति पर',
    statusDelivered: 'डिलीवर हुआ',
    statusCompleted: 'पूर्ण हुआ',
    statusRejected: 'अस्वीकृत',
    approveProject: 'प्रोजेक्ट स्वीकृत करें',
    rejectProject: 'प्रोजेक्ट अस्वीकृत करें',
    publishUpdate: 'अपडेट प्रकाशित करें',
    updateProgress: 'प्रगति अपडेट करें',
    messageToClient: 'क्लाइंट को सीधा संदेश',
    adjustTokens: 'उपयोगकर्ता प्रबंधित करें',
    suspendAccount: 'खाता निलंबित करें',
    reinstateAccount: 'खाता बहाल करें',
    deleteProject: 'प्रोजेक्ट हटाएं',

    // Themes
    themeLight: 'लाइट मोड',
    themeDark: 'डार्क मोड',
    themeSystem: 'सिस्टम डिफॉल्ट',

    // Languages
    langEn: 'English',
    langHi: 'हिंदी (Hindi)',

    // Common
    cancel: 'रद्द करें',
    save: 'सहेजें',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    actions: 'क्रियाएं',
    status: 'स्थिति',
    date: 'दिनांक',
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => DICTIONARY.en[key] ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tc_lang') as Language;
      if (stored === 'en' || stored === 'hi') {
        setLanguageState(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('tc_lang', lang);
    } catch {
      // Ignore
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = DICTIONARY[language] || DICTIONARY.en;
    return (dict as Record<string, string>)[key] || DICTIONARY.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
