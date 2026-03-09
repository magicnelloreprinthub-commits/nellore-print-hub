import { type ReactNode, createContext, useContext, useState } from "react";

export type Language = "en" | "te" | "hi" | "ar";

export const LANGUAGES: {
  code: Language;
  label: string;
  native: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English", native: "EN", dir: "ltr" },
  { code: "te", label: "Telugu", native: "తె", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हि", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "ع", dir: "rtl" },
];

export const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      quote: "Quote",
      gallery: "Gallery",
      contact: "Contact",
    },
    hero: {
      badge: "Premium Printing Solutions in Nellore",
      title1: "Your Vision",
      title2: "Printed",
      title3: "to Perfection",
      subtitle:
        "From business cards to massive flex banners — we bring your brand to life with vivid, high-impact printing.",
      cta: "Start Your Order",
      viewServices: "View Services",
    },
    services: {
      badge: "What We Do",
      heading: "Our Services",
      subtitle:
        "End-to-end printing solutions for businesses and individuals across Nellore.",
      items: [
        {
          title: "Business Cards",
          description: "Luxury visiting card printing with premium finishes",
        },
        {
          title: "Flex Banners",
          description: "High-impact outdoor advertising banners",
        },
        {
          title: "Sticker Printing",
          description: "Die-cut & vinyl stickers for every surface",
        },
        {
          title: "T-Shirt Printing",
          description: "DTF & sublimation printing on all fabrics",
        },
        {
          title: "Packaging Boxes",
          description: "Custom printed boxes for your brand",
        },
        {
          title: "Graphic Design",
          description: "Branding & marketing designs that stand out",
        },
      ],
    },
    quote: {
      badge: "Get a Quote",
      heading1: "Let's Print",
      heading2: "Your Idea",
      subtitle:
        "Fill in the details and we'll get back to you with a custom quote within 24 hours.",
      features: [
        {
          title: "Fast Turnaround",
          desc: "Same-day delivery for urgent orders",
        },
        {
          title: "Premium Quality",
          desc: "Vivid colors, sharp details, durable prints",
        },
        {
          title: "Competitive Pricing",
          desc: "Best rates in Nellore, no compromises",
        },
      ],
      form: {
        name: "Your Name",
        namePlaceholder: "e.g. Ravi Kumar",
        mobile: "Mobile Number",
        mobilePlaceholder: "+91 98765 43210",
        service: "Service Required",
        servicePlaceholder: "Select a service",
        details: "Project Details",
        detailsPlaceholder:
          "Describe your project: size, quantity, design requirements, deadline...",
        fileLabel: "Attach Design File",
        fileOptional: "(optional)",
        fileUpload: "Click to upload your design (PDF, PNG, JPG, AI)",
        submit: "Submit Request",
        submitting: "Submitting...",
        required: "*",
      },
      services: [
        "Digital Printing",
        "Flex Banner",
        "Sticker Printing",
        "T-Shirt Printing",
      ],
      successMsg: "Quote submitted! We'll reach out soon.",
      submittingMsg: "Submitting your quote request...",
      errorRequired: "Please fill in all required fields.",
      errorFailed: "Failed to submit quote. Please try again.",
      successToast: "Quote request submitted! We'll contact you shortly.",
    },
    gallery: {
      badge: "Our Portfolio",
      heading: "Our Work",
      subtitle: "A glimpse of what we create for our clients across Nellore.",
    },
    contact: {
      badge: "Reach Out",
      heading: "Contact Us",
      subtitle:
        "We're based in Nellore and ready to help with all your printing needs.",
      phone: "Phone",
      email: "Email",
      address: "Address",
      openMap: "Open Shop Location",
      viewOnMap: "View on Google Maps",
    },
    footer: {
      tagline:
        "Premium printing solutions in Dargamitta, Nellore, Andhra Pradesh.",
      copyright: "Nellore Print Hub | Magic Advertising",
    },
    whatsapp: "WhatsApp",
    admin: {
      title: "Admin Panel",
      quotes: "Quote Requests",
      noQuotes: "No quote requests yet.",
      name: "Name",
      mobile: "Mobile",
      service: "Service",
      details: "Details",
      submitted: "Submitted",
      back: "Back to site",
    },
  },
  te: {
    nav: {
      home: "హోమ్",
      about: "గురించి",
      services: "సేవలు",
      quote: "కోట్",
      gallery: "గ్యాలరీ",
      contact: "సంప్రదించండి",
    },
    hero: {
      badge: "నెల్లూరులో ప్రీమియం ప్రింటింగ్ సొల్యూషన్స్",
      title1: "మీ దృష్టి",
      title2: "ముద్రించబడింది",
      title3: "పరిపూర్ణంగా",
      subtitle:
        "బిజినెస్ కార్డులు నుండి పెద్ద ఫ్లెక్స్ బ్యానర్ల వరకు — మేము మీ బ్రాండ్‌ను స్పష్టమైన ప్రింటింగ్‌తో జీవం పోస్తాం.",
      cta: "ఆర్డర్ ప్రారంభించండి",
      viewServices: "సేవలు చూడండి",
    },
    services: {
      badge: "మేమేమి చేస్తాము",
      heading: "మా సేవలు",
      subtitle: "నెల్లూరు అంతటా వ్యాపారాలు మరియు వ్యక్తులకు సంపూర్ణ ప్రింటింగ్ సొల్యూషన్స్.",
      items: [
        {
          title: "బిజినెస్ కార్డులు",
          description: "ప్రీమియం ఫినిష్‌తో లగ్జరీ విజిటింగ్ కార్డ్ ప్రింటింగ్",
        },
        {
          title: "ఫ్లెక్స్ బ్యానర్లు",
          description: "అధిక ప్రభావం కలిగిన అవుట్‌డోర్ అడ్వర్టైజింగ్ బ్యానర్లు",
        },
        { title: "స్టికర్ ప్రింటింగ్", description: "ప్రతి ఉపరితలానికి డై-కట్ & వినైల్ స్టికర్లు" },
        {
          title: "టీ-షర్ట్ ప్రింటింగ్",
          description: "అన్ని ఫ్యాబ్రిక్స్‌పై DTF & సబ్లిమేషన్ ప్రింటింగ్",
        },
        { title: "ప్యాకేజింగ్ బాక్సులు", description: "మీ బ్రాండ్ కోసం కస్టమ్ ప్రింటెడ్ బాక్సులు" },
        { title: "గ్రాఫిక్ డిజైన్", description: "నిలబడే బ్రాండింగ్ & మార్కెటింగ్ డిజైన్లు" },
      ],
    },
    quote: {
      badge: "కోట్ పొందండి",
      heading1: "మనం ప్రింట్ చేద్దాం",
      heading2: "మీ ఆలోచన",
      subtitle: "వివరాలు నింపండి, మేము 24 గంటల్లో కస్టమ్ కోట్‌తో మీకు తిరిగి వస్తాము.",
      features: [
        { title: "వేగవంతమైన డెలివరీ", desc: "అర్జెంట్ ఆర్డర్లకు అదే రోజు డెలివరీ" },
        {
          title: "ప్రీమియం నాణ్యత",
          desc: "స్పష్టమైన రంగులు, తీక్షణమైన వివరాలు, మన్నికైన ప్రింట్లు",
        },
        { title: "పోటీ ధరలు", desc: "నెల్లూరులో అత్యుత్తమ రేట్లు" },
      ],
      form: {
        name: "మీ పేరు",
        namePlaceholder: "ఉదా. రవి కుమార్",
        mobile: "మొబైల్ నంబర్",
        mobilePlaceholder: "+91 98765 43210",
        service: "అవసరమైన సేవ",
        servicePlaceholder: "సేవ ఎంచుకోండి",
        details: "ప్రాజెక్ట్ వివరాలు",
        detailsPlaceholder:
          "మీ ప్రాజెక్ట్ గురించి వివరించండి: పరిమాణం, పరిమాణం, డిజైన్ అవసరాలు...",
        fileLabel: "డిజైన్ ఫైల్ జోడించండి",
        fileOptional: "(ఐచ్ఛికం)",
        fileUpload: "మీ డిజైన్ అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి (PDF, PNG, JPG, AI)",
        submit: "అభ్యర్థన సమర్పించండి",
        submitting: "సమర్పిస్తున్నాం...",
        required: "*",
      },
      services: ["డిజిటల్ ప్రింటింగ్", "ఫ్లెక్స్ బ్యానర్", "స్టికర్ ప్రింటింగ్", "టీ-షర్ట్ ప్రింటింగ్"],
      successMsg: "కోట్ సమర్పించబడింది! మేము త్వరలో సంప్రదిస్తాం.",
      submittingMsg: "మీ కోట్ అభ్యర్థన సమర్పిస్తున్నాం...",
      errorRequired: "దయచేసి అన్ని అవసరమైన ఫీల్డ్‌లు నింపండి.",
      errorFailed: "కోట్ సమర్పించడం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
      successToast: "కోట్ అభ్యర్థన సమర్పించబడింది! మేము త్వరలో మీకు సంప్రదిస్తాం.",
    },
    gallery: {
      badge: "మా పోర్ట్‌ఫోలియో",
      heading: "మా పని",
      subtitle: "నెల్లూరు అంతటా మా క్లయింట్లకు మేము సృష్టించే వాటిని చూడండి.",
    },
    contact: {
      badge: "సంప్రదించండి",
      heading: "మాకు సంప్రదించండి",
      subtitle:
        "మేము నెల్లూరులో ఉన్నాం మరియు మీ అన్ని ప్రింటింగ్ అవసరాలకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాం.",
      phone: "ఫోన్",
      email: "ఇమెయిల్",
      address: "చిరునామా",
      openMap: "షాప్ లొకేషన్ తెరవండి",
      viewOnMap: "గూగుల్ మ్యాప్స్‌లో చూడండి",
    },
    footer: {
      tagline: "దర్గామిట్ట, నెల్లూరు, ఆంధ్రప్రదేశ్‌లో ప్రీమియం ప్రింటింగ్ సొల్యూషన్స్.",
      copyright: "నెల్లూరు ప్రింట్ హబ్ | మ్యాజిక్ అడ్వర్టైజింగ్",
    },
    whatsapp: "వాట్సాప్",
    admin: {
      title: "అడ్మిన్ ప్యానెల్",
      quotes: "కోట్ అభ్యర్థనలు",
      noQuotes: "ఇంకా కోట్ అభ్యర్థనలు లేవు.",
      name: "పేరు",
      mobile: "మొబైల్",
      service: "సేవ",
      details: "వివరాలు",
      submitted: "సమర్పించబడింది",
      back: "సైట్‌కి తిరిగి వెళ్ళండి",
    },
  },
  hi: {
    nav: {
      home: "होम",
      about: "हमारे बारे में",
      services: "सेवाएं",
      quote: "कोट",
      gallery: "गैलरी",
      contact: "संपर्क",
    },
    hero: {
      badge: "नेल्लोर में प्रीमियम प्रिंटिंग सॉल्यूशन्स",
      title1: "आपकी सोच",
      title2: "प्रिंट",
      title3: "परफेक्शन के साथ",
      subtitle:
        "बिज़नेस कार्ड से लेकर बड़े फ्लेक्स बैनर तक — हम आपके ब्रांड को जीवंत और प्रभावशाली प्रिंटिंग से जीवित करते हैं।",
      cta: "ऑर्डर शुरू करें",
      viewServices: "सेवाएं देखें",
    },
    services: {
      badge: "हम क्या करते हैं",
      heading: "हमारी सेवाएं",
      subtitle: "नेल्लोर में व्यवसायों और व्यक्तियों के लिए संपूर्ण प्रिंटिंग सॉल्यूशन्स।",
      items: [
        {
          title: "बिज़नेस कार्ड",
          description: "प्रीमियम फिनिश के साथ लग्ज़री विज़िटिंग कार्ड प्रिंटिंग",
        },
        { title: "फ्लेक्स बैनर", description: "उच्च प्रभावशाली आउटडोर विज्ञापन बैनर" },
        {
          title: "स्टिकर प्रिंटिंग",
          description: "हर सतह के लिए डाई-कट और विनाइल स्टिकर",
        },
        {
          title: "टी-शर्ट प्रिंटिंग",
          description: "सभी कपड़ों पर DTF और सब्लिमेशन प्रिंटिंग",
        },
        { title: "पैकेजिंग बॉक्स", description: "आपके ब्रांड के लिए कस्टम प्रिंटेड बॉक्स" },
        {
          title: "ग्राफिक डिज़ाइन",
          description: "अलग दिखने वाली ब्रांडिंग और मार्केटिंग डिज़ाइन",
        },
      ],
    },
    quote: {
      badge: "कोट प्राप्त करें",
      heading1: "चलिए प्रिंट करें",
      heading2: "आपका आइडिया",
      subtitle: "विवरण भरें और हम 24 घंटे के भीतर कस्टम कोट के साथ वापस आएंगे।",
      features: [
        { title: "तेज़ डिलीवरी", desc: "अर्जेंट ऑर्डर के लिए उसी दिन डिलीवरी" },
        { title: "प्रीमियम क्वालिटी", desc: "जीवंत रंग, तेज़ विवरण, टिकाऊ प्रिंट" },
        { title: "प्रतिस्पर्धी मूल्य", desc: "नेल्लोर में सबसे अच्छी दरें" },
      ],
      form: {
        name: "आपका नाम",
        namePlaceholder: "जैसे रवि कुमार",
        mobile: "मोबाइल नंबर",
        mobilePlaceholder: "+91 98765 43210",
        service: "सेवा आवश्यक",
        servicePlaceholder: "एक सेवा चुनें",
        details: "प्रोजेक्ट विवरण",
        detailsPlaceholder:
          "अपने प्रोजेक्ट का विवरण दें: आकार, मात्रा, डिज़ाइन आवश्यकताएं...",
        fileLabel: "डिज़ाइन फ़ाइल संलग्न करें",
        fileOptional: "(वैकल्पिक)",
        fileUpload: "अपना डिज़ाइन अपलोड करने के लिए क्लिक करें (PDF, PNG, JPG, AI)",
        submit: "अनुरोध सबमिट करें",
        submitting: "सबमिट हो रहा है...",
        required: "*",
      },
      services: ["डिजिटल प्रिंटिंग", "फ्लेक्स बैनर", "स्टिकर प्रिंटिंग", "टी-शर्ट प्रिंटिंग"],
      successMsg: "कोट सबमिट हो गया! हम जल्द ही संपर्क करेंगे।",
      submittingMsg: "आपका कोट अनुरोध सबमिट हो रहा है...",
      errorRequired: "कृपया सभी आवश्यक फ़ील्ड भरें।",
      errorFailed: "कोट सबमिट करने में विफल। कृपया पुनः प्रयास करें।",
      successToast: "कोट अनुरोध सबमिट हो गया! हम जल्द ही आपसे संपर्क करेंगे।",
    },
    gallery: {
      badge: "हमारा पोर्टफोलियो",
      heading: "हमारा काम",
      subtitle: "नेल्लोर में हमारे ग्राहकों के लिए हम जो बनाते हैं उसकी एक झलक।",
    },
    contact: {
      badge: "संपर्क करें",
      heading: "हमसे संपर्क करें",
      subtitle:
        "हम नेल्लोर में स्थित हैं और आपकी सभी प्रिंटिंग ज़रूरतों में मदद करने के लिए तैयार हैं।",
      phone: "फोन",
      email: "ईमेल",
      address: "पता",
      openMap: "शॉप लोकेशन खोलें",
      viewOnMap: "Google Maps पर देखें",
    },
    footer: {
      tagline: "दर्गामिट्टा, नेल्लोर, आंध्र प्रदेश में प्रीमियम प्रिंटिंग सॉल्यूशन्स।",
      copyright: "नेल्लोर प्रिंट हब | मैजिक एडवर्टाइजिंग",
    },
    whatsapp: "WhatsApp",
    admin: {
      title: "एडमिन पैनल",
      quotes: "कोट अनुरोध",
      noQuotes: "अभी तक कोई कोट अनुरोध नहीं।",
      name: "नाम",
      mobile: "मोबाइल",
      service: "सेवा",
      details: "विवरण",
      submitted: "सबमिट किया",
      back: "साइट पर वापस जाएं",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      about: "عن الشركة",
      services: "الخدمات",
      quote: "عرض سعر",
      gallery: "معرض",
      contact: "اتصل بنا",
    },
    hero: {
      badge: "حلول الطباعة المتميزة في نيلور",
      title1: "رؤيتك",
      title2: "مطبوعة",
      title3: "إلى الكمال",
      subtitle:
        "من بطاقات الأعمال إلى اللافتات العملاقة — نحن نجسّد علامتك التجارية بطباعة حيّة وعالية التأثير.",
      cta: "ابدأ طلبك",
      viewServices: "عرض الخدمات",
    },
    services: {
      badge: "ما نقدمه",
      heading: "خدماتنا",
      subtitle: "حلول طباعة متكاملة للشركات والأفراد في نيلور.",
      items: [
        {
          title: "بطاقات الأعمال",
          description: "طباعة بطاقات الزيارة الفاخرة بتشطيبات متميزة",
        },
        {
          title: "لافتات فلكس",
          description: "لافتات إعلانية خارجية عالية التأثير",
        },
        {
          title: "طباعة الملصقات",
          description: "ملصقات مقطوعة وفينيل لكل سطح",
        },
        {
          title: "طباعة التيشيرتات",
          description: "طباعة DTF والتسامي على جميع الأقمشة",
        },
        {
          title: "صناديق التغليف",
          description: "صناديق مطبوعة مخصصة لعلامتك التجارية",
        },
        {
          title: "تصميم جرافيك",
          description: "تصاميم علامة تجارية وتسويق مميزة",
        },
      ],
    },
    quote: {
      badge: "احصل على عرض سعر",
      heading1: "دعنا نطبع",
      heading2: "فكرتك",
      subtitle: "أدخل التفاصيل وسنعود إليك بعرض سعر مخصص خلال 24 ساعة.",
      features: [
        { title: "تسليم سريع", desc: "توصيل في نفس اليوم للطلبات العاجلة" },
        { title: "جودة متميزة", desc: "ألوان زاهية، تفاصيل حادة، طباعة متينة" },
        { title: "أسعار تنافسية", desc: "أفضل الأسعار في نيلور بدون تنازلات" },
      ],
      form: {
        name: "اسمك",
        namePlaceholder: "مثال: رافي كومار",
        mobile: "رقم الجوال",
        mobilePlaceholder: "+91 98765 43210",
        service: "الخدمة المطلوبة",
        servicePlaceholder: "اختر خدمة",
        details: "تفاصيل المشروع",
        detailsPlaceholder:
          "صف مشروعك: الحجم، الكمية، متطلبات التصميم، الموعد النهائي...",
        fileLabel: "أرفق ملف التصميم",
        fileOptional: "(اختياري)",
        fileUpload: "انقر لرفع تصميمك (PDF, PNG, JPG, AI)",
        submit: "إرسال الطلب",
        submitting: "جارٍ الإرسال...",
        required: "*",
      },
      services: [
        "الطباعة الرقمية",
        "لافتة فلكس",
        "طباعة الملصقات",
        "طباعة التيشيرتات",
      ],
      successMsg: "تم إرسال عرض السعر! سنتواصل معك قريباً.",
      submittingMsg: "جارٍ إرسال طلب عرض السعر...",
      errorRequired: "يرجى ملء جميع الحقول المطلوبة.",
      errorFailed: "فشل إرسال عرض السعر. يرجى المحاولة مرة أخرى.",
      successToast: "تم إرسال طلب عرض السعر! سنتواصل معك قريباً.",
    },
    gallery: {
      badge: "معرض أعمالنا",
      heading: "أعمالنا",
      subtitle: "لمحة عما نصنعه لعملائنا في نيلور.",
    },
    contact: {
      badge: "تواصل معنا",
      heading: "اتصل بنا",
      subtitle:
        "نحن مقيمون في نيلور ومستعدون لمساعدتك في جميع احتياجات الطباعة.",
      phone: "هاتف",
      email: "البريد الإلكتروني",
      address: "العنوان",
      openMap: "افتح موقع المتجر",
      viewOnMap: "عرض على خرائط Google",
    },
    footer: {
      tagline: "حلول طباعة متميزة في دارجاميتا، نيلور، أندرا براديش.",
      copyright: "نيلور برينت هب | ماجيك أدفيرتايزينج",
    },
    whatsapp: "واتساب",
    admin: {
      title: "لوحة الإدارة",
      quotes: "طلبات عروض الأسعار",
      noQuotes: "لا توجد طلبات عروض أسعار بعد.",
      name: "الاسم",
      mobile: "الجوال",
      service: "الخدمة",
      details: "التفاصيل",
      submitted: "تم الإرسال",
      back: "العودة إلى الموقع",
    },
  },
};

export type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    const dir = LANGUAGES.find((l) => l.code === newLang)?.dir ?? "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", newLang);
  };

  const t = translations[lang];
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
