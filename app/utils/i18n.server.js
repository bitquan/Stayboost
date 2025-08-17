// Internationalization (i18n) System for StayBoost
// Priority #18 - Multi-language support for global stores

/**
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for all i18n functions
 * - [ ] Create integration tests with Remix routes
 * - [ ] Test browser language detection
 * - [ ] Validate all translation strings
 * - [ ] Test RTL language support
 * - [ ] Add E2E tests for language switching
 * - [ ] Integration with popup settings UI
 * - [ ] Test language persistence in session
 */

/**
 * Supported Languages Configuration
 */
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/dd/yyyy',
    numberFormat: 'en-US',
    currencySymbol: '$'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'es-ES',
    currencySymbol: '€'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'fr-FR',
    currencySymbol: '€'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'dd.MM.yyyy',
    numberFormat: 'de-DE',
    currencySymbol: '€'
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'it-IT',
    currencySymbol: '€'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'pt-BR',
    currencySymbol: 'R$'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: 'ja-JP',
    currencySymbol: '¥'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'yyyy-MM-dd',
    numberFormat: 'zh-CN',
    currencySymbol: '¥'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'ar-SA',
    currencySymbol: 'ر.س'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'hi-IN',
    currencySymbol: '₹'
  }
};

/**
 * Translation Namespaces
 */
export const TRANSLATION_NAMESPACES = {
  COMMON: 'common',
  POPUP: 'popup',
  ADMIN: 'admin',
  ERRORS: 'errors',
  VALIDATION: 'validation',
  EMAILS: 'emails'
};

/**
 * Translation Storage - In production, this would be in a database
 */
export const TRANSLATIONS = {
  en: {
    common: {
      yes: 'Yes',
      no: 'No',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information'
    },
    popup: {
      defaultTitle: "Don't leave yet!",
      defaultMessage: 'Get 10% off your first order',
      claimOffer: 'Claim Offer',
      dismiss: 'No thanks',
      emailPlaceholder: 'Enter your email address',
      invalidEmail: 'Please enter a valid email address',
      thankYou: 'Thank you! Check your email for the discount code.',
      alreadySubscribed: 'You are already subscribed to our newsletter.',
      countdownPrefix: 'Offer expires in:',
      limitedTime: 'Limited time offer'
    },
    admin: {
      dashboard: 'Dashboard',
      settings: 'Settings',
      analytics: 'Analytics',
      templates: 'Templates',
      testing: 'A/B Testing',
      languages: 'Languages',
      popupEnabled: 'Popup Enabled',
      popupTitle: 'Popup Title',
      popupMessage: 'Popup Message',
      discountCode: 'Discount Code',
      discountPercentage: 'Discount Percentage',
      delaySeconds: 'Delay (seconds)',
      showOnce: 'Show once per session'
    },
    errors: {
      genericError: 'Something went wrong. Please try again.',
      networkError: 'Network error. Please check your connection.',
      validationError: 'Please check your input and try again.',
      notFound: 'The requested resource was not found.',
      unauthorized: 'You are not authorized to perform this action.',
      serverError: 'Server error. Please try again later.'
    },
    validation: {
      required: 'This field is required',
      minLength: 'Must be at least {min} characters',
      maxLength: 'Must be no more than {max} characters',
      invalidEmail: 'Please enter a valid email address',
      invalidUrl: 'Please enter a valid URL',
      invalidNumber: 'Please enter a valid number',
      minValue: 'Must be at least {min}',
      maxValue: 'Must be no more than {max}'
    },
    emails: {
      welcomeSubject: 'Welcome to our store!',
      discountSubject: 'Your discount code is ready',
      welcomeGreeting: 'Hi there!',
      discountMessage: 'Use code {code} to get {percentage}% off your order.',
      expiresMessage: 'This offer expires on {date}.',
      shopNow: 'Shop Now',
      unsubscribe: 'Unsubscribe'
    }
  },
  
  es: {
    common: {
      yes: 'Sí',
      no: 'No',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información'
    },
    popup: {
      defaultTitle: '¡No te vayas todavía!',
      defaultMessage: 'Obtén 10% de descuento en tu primer pedido',
      claimOffer: 'Reclamar Oferta',
      dismiss: 'No gracias',
      emailPlaceholder: 'Ingresa tu dirección de correo',
      invalidEmail: 'Por favor ingresa un correo válido',
      thankYou: '¡Gracias! Revisa tu correo para el código de descuento.',
      alreadySubscribed: 'Ya estás suscrito a nuestro boletín.',
      countdownPrefix: 'La oferta expira en:',
      limitedTime: 'Oferta por tiempo limitado'
    },
    admin: {
      dashboard: 'Panel',
      settings: 'Configuración',
      analytics: 'Analíticas',
      templates: 'Plantillas',
      testing: 'Pruebas A/B',
      languages: 'Idiomas',
      popupEnabled: 'Popup Habilitado',
      popupTitle: 'Título del Popup',
      popupMessage: 'Mensaje del Popup',
      discountCode: 'Código de Descuento',
      discountPercentage: 'Porcentaje de Descuento',
      delaySeconds: 'Retraso (segundos)',
      showOnce: 'Mostrar una vez por sesión'
    },
    errors: {
      genericError: 'Algo salió mal. Por favor intenta de nuevo.',
      networkError: 'Error de red. Verifica tu conexión.',
      validationError: 'Verifica tu entrada e intenta de nuevo.',
      notFound: 'El recurso solicitado no fue encontrado.',
      unauthorized: 'No estás autorizado para realizar esta acción.',
      serverError: 'Error del servidor. Intenta más tarde.'
    },
    validation: {
      required: 'Este campo es requerido',
      minLength: 'Debe tener al menos {min} caracteres',
      maxLength: 'No debe tener más de {max} caracteres',
      invalidEmail: 'Por favor ingresa un correo válido',
      invalidUrl: 'Por favor ingresa una URL válida',
      invalidNumber: 'Por favor ingresa un número válido',
      minValue: 'Debe ser al menos {min}',
      maxValue: 'No debe ser más de {max}'
    },
    emails: {
      welcomeSubject: '¡Bienvenido a nuestra tienda!',
      discountSubject: 'Tu código de descuento está listo',
      welcomeGreeting: '¡Hola!',
      discountMessage: 'Usa el código {code} para obtener {percentage}% de descuento.',
      expiresMessage: 'Esta oferta expira el {date}.',
      shopNow: 'Comprar Ahora',
      unsubscribe: 'Darse de baja'
    }
  },

  fr: {
    common: {
      yes: 'Oui',
      no: 'Non',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Avertissement',
      info: 'Information'
    },
    popup: {
      defaultTitle: 'Ne partez pas encore !',
      defaultMessage: 'Obtenez 10% de réduction sur votre première commande',
      claimOffer: 'Réclamez l\'offre',
      dismiss: 'Non merci',
      emailPlaceholder: 'Entrez votre adresse e-mail',
      invalidEmail: 'Veuillez entrer un e-mail valide',
      thankYou: 'Merci ! Vérifiez votre e-mail pour le code de réduction.',
      alreadySubscribed: 'Vous êtes déjà abonné à notre newsletter.',
      countdownPrefix: 'L\'offre expire dans :',
      limitedTime: 'Offre à durée limitée'
    },
    admin: {
      dashboard: 'Tableau de bord',
      settings: 'Paramètres',
      analytics: 'Analytiques',
      templates: 'Modèles',
      testing: 'Tests A/B',
      languages: 'Langues',
      popupEnabled: 'Popup Activé',
      popupTitle: 'Titre du Popup',
      popupMessage: 'Message du Popup',
      discountCode: 'Code de Réduction',
      discountPercentage: 'Pourcentage de Réduction',
      delaySeconds: 'Délai (secondes)',
      showOnce: 'Afficher une fois par session'
    },
    errors: {
      genericError: 'Quelque chose s\'est mal passé. Veuillez réessayer.',
      networkError: 'Erreur réseau. Vérifiez votre connexion.',
      validationError: 'Vérifiez votre saisie et réessayez.',
      notFound: 'La ressource demandée n\'a pas été trouvée.',
      unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action.',
      serverError: 'Erreur serveur. Veuillez réessayer plus tard.'
    },
    validation: {
      required: 'Ce champ est requis',
      minLength: 'Doit contenir au moins {min} caractères',
      maxLength: 'Ne doit pas dépasser {max} caractères',
      invalidEmail: 'Veuillez entrer un e-mail valide',
      invalidUrl: 'Veuillez entrer une URL valide',
      invalidNumber: 'Veuillez entrer un nombre valide',
      minValue: 'Doit être au moins {min}',
      maxValue: 'Ne doit pas dépasser {max}'
    },
    emails: {
      welcomeSubject: 'Bienvenue dans notre boutique !',
      discountSubject: 'Votre code de réduction est prêt',
      welcomeGreeting: 'Bonjour !',
      discountMessage: 'Utilisez le code {code} pour obtenir {percentage}% de réduction.',
      expiresMessage: 'Cette offre expire le {date}.',
      shopNow: 'Acheter Maintenant',
      unsubscribe: 'Se désabonner'
    }
  }

  // Additional languages would be added here...
};

/**
 * Internationalization Manager Class
 */
export class I18nManager {
  constructor(defaultLanguage = 'en') {
    this.defaultLanguage = defaultLanguage;
    this.currentLanguage = defaultLanguage;
    this.translations = TRANSLATIONS;
    this.fallbackChain = ['en']; // Always fallback to English
  }

  /**
   * Set the current language
   */
  setLanguage(languageCode) {
    if (!this.isLanguageSupported(languageCode)) {
      console.warn(`Language ${languageCode} is not supported. Using default: ${this.defaultLanguage}`);
      languageCode = this.defaultLanguage;
    }
    
    this.currentLanguage = languageCode;
    return this;
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode) {
    return languageCode in SUPPORTED_LANGUAGES && languageCode in this.translations;
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES[this.defaultLanguage];
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return Object.values(SUPPORTED_LANGUAGES).filter(lang => 
      this.isLanguageSupported(lang.code)
    );
  }

  /**
   * Translate a key with optional parameters
   */
  t(key, params = {}, namespace = TRANSLATION_NAMESPACES.COMMON) {
    try {
      // Try current language first
      let translation = this.getTranslationFromLanguage(this.currentLanguage, namespace, key);
      
      // Fallback to default language if not found
      if (!translation) {
        translation = this.getTranslationFromLanguage(this.defaultLanguage, namespace, key);
      }
      
      // Final fallback to key itself
      if (!translation) {
        console.warn(`Translation not found: ${namespace}.${key}`);
        return key;
      }

      // Replace parameters in translation
      return this.interpolateParams(translation, params);
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }

  /**
   * Get translation from specific language
   */
  getTranslationFromLanguage(languageCode, namespace, key) {
    const translations = this.translations[languageCode];
    if (!translations) return null;

    const namespaceTranslations = translations[namespace];
    if (!namespaceTranslations) return null;

    // Support nested keys like 'user.profile.name'
    const keys = key.split('.');
    let value = namespaceTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  /**
   * Replace parameters in translation string
   */
  interpolateParams(translation, params) {
    if (!params || Object.keys(params).length === 0) {
      return translation;
    }

    return translation.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Format date according to language locale
   */
  formatDate(date, languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    const config = this.getLanguageConfig(lang);
    
    try {
      return new Intl.DateTimeFormat(config.numberFormat).format(new Date(date));
    } catch (error) {
      console.error('Date formatting error:', error);
      return date.toString();
    }
  }

  /**
   * Format number according to language locale
   */
  formatNumber(number, languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    const config = this.getLanguageConfig(lang);
    
    try {
      return new Intl.NumberFormat(config.numberFormat).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString();
    }
  }

  /**
   * Format currency according to language locale
   */
  formatCurrency(amount, currency = null, languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    const config = this.getLanguageConfig(lang);
    const currencyCode = currency || config.currencySymbol;
    
    try {
      return new Intl.NumberFormat(config.numberFormat, {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting
      return `${config.currencySymbol}${this.formatNumber(amount, lang)}`;
    }
  }

  /**
   * Get text direction for language (LTR/RTL)
   */
  getTextDirection(languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    const config = this.getLanguageConfig(lang);
    return config.rtl ? 'rtl' : 'ltr';
  }

  /**
   * Add or update translations for a language
   */
  addTranslations(languageCode, namespace, translations) {
    if (!this.translations[languageCode]) {
      this.translations[languageCode] = {};
    }
    
    if (!this.translations[languageCode][namespace]) {
      this.translations[languageCode][namespace] = {};
    }
    
    this.translations[languageCode][namespace] = {
      ...this.translations[languageCode][namespace],
      ...translations
    };
  }

  /**
   * Get all translations for a language and namespace
   */
  getNamespaceTranslations(namespace, languageCode = null) {
    const lang = languageCode || this.currentLanguage;
    return this.translations[lang]?.[namespace] || {};
  }

  /**
   * Detect language from browser or user preference
   */
  detectLanguage(browserLanguage = null, userPreference = null) {
    // Priority: user preference > browser language > default
    if (userPreference && this.isLanguageSupported(userPreference)) {
      return userPreference;
    }
    
    if (browserLanguage) {
      // Extract language code from locale (e.g., 'en-US' -> 'en')
      const langCode = browserLanguage.split('-')[0];
      if (this.isLanguageSupported(langCode)) {
        return langCode;
      }
    }
    
    return this.defaultLanguage;
  }

  /**
   * Export translations for frontend use
   */
  exportTranslations(languageCode = null, namespaces = null) {
    const lang = languageCode || this.currentLanguage;
    const translations = this.translations[lang] || {};
    
    if (namespaces) {
      const filtered = {};
      namespaces.forEach(ns => {
        if (translations[ns]) {
          filtered[ns] = translations[ns];
        }
      });
      return filtered;
    }
    
    return translations;
  }

  /**
   * Generate language switcher data
   */
  getLanguageSwitcherData() {
    return this.getAvailableLanguages().map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag,
      active: lang.code === this.currentLanguage
    }));
  }
}

/**
 * Convenience functions for use in Remix routes
 */
export function createI18nManager(language = 'en') {
  return new I18nManager(language);
}

export function getI18nForRequest(request) {
  // Extract language from various sources
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang');
  const acceptLanguage = request.headers.get('accept-language');
  
  const i18n = new I18nManager();
  const detectedLang = i18n.detectLanguage(acceptLanguage, langParam);
  i18n.setLanguage(detectedLang);
  
  return i18n;
}
