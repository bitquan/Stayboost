// Popup Templates Library for StayBoost
// Priority #17 - Pre-designed popup templates for merchants

/**
 * Template Categories
 */
export const TEMPLATE_CATEGORIES = {
  SEASONAL: 'seasonal',
  DISCOUNT: 'discount',
  EMAIL_CAPTURE: 'email_capture',
  URGENCY: 'urgency',
  SOCIAL_PROOF: 'social_proof',
  ANNOUNCEMENT: 'announcement',
  CART_ABANDONMENT: 'cart_abandonment',
  WELCOME: 'welcome'
};

/**
 * Template Styles
 */
export const TEMPLATE_STYLES = {
  MINIMAL: 'minimal',
  BOLD: 'bold',
  ELEGANT: 'elegant',
  PLAYFUL: 'playful',
  PROFESSIONAL: 'professional',
  MODERN: 'modern'
};

/**
 * Predefined popup templates
 */
export const POPUP_TEMPLATES = [
  {
    id: 'holiday-discount-bold',
    name: 'Holiday Discount - Bold',
    category: TEMPLATE_CATEGORIES.SEASONAL,
    style: TEMPLATE_STYLES.BOLD,
    description: 'Eye-catching holiday-themed discount popup with festive colors',
    thumbnail: '/images/templates/holiday-discount-bold.png',
    config: {
      title: '🎄 Holiday Special! 🎄',
      message: 'Get 25% off your entire order today only!',
      discountCode: 'HOLIDAY25',
      discountPercentage: 25,
      backgroundColor: '#c41e3a',
      textColor: '#ffffff',
      buttonColor: '#228b22',
      buttonTextColor: '#ffffff',
      borderRadius: '8px',
      fontSize: {
        title: '24px',
        message: '18px',
        button: '16px'
      },
      animation: 'slideInDown',
      showTimer: true,
      timerDuration: 3600, // 1 hour
      customCSS: `
        .holiday-popup {
          background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);
          box-shadow: 0 10px 30px rgba(196, 30, 58, 0.3);
          border: 2px solid #ffd700;
        }
        .holiday-popup::before {
          content: '❄️';
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 20px;
        }
      `
    },
    tags: ['holiday', 'christmas', 'discount', 'festive']
  },
  
  {
    id: 'email-capture-minimal',
    name: 'Email Capture - Minimal',
    category: TEMPLATE_CATEGORIES.EMAIL_CAPTURE,
    style: TEMPLATE_STYLES.MINIMAL,
    description: 'Clean and simple email capture with subtle design',
    thumbnail: '/images/templates/email-capture-minimal.png',
    config: {
      title: 'Stay in the loop',
      message: 'Get exclusive offers and updates delivered to your inbox',
      discountCode: 'WELCOME10',
      discountPercentage: 10,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      buttonColor: '#000000',
      buttonTextColor: '#ffffff',
      borderRadius: '4px',
      fontSize: {
        title: '20px',
        message: '14px',
        button: '14px'
      },
      animation: 'fadeIn',
      showEmailField: true,
      emailPlaceholder: 'Enter your email address',
      customCSS: `
        .minimal-popup {
          border: 1px solid #e1e1e1;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .minimal-popup input {
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 4px;
          width: 100%;
          margin: 10px 0;
        }
      `
    },
    tags: ['email', 'minimal', 'newsletter', 'clean']
  },

  {
    id: 'urgency-countdown-bold',
    name: 'Urgency Countdown - Bold',
    category: TEMPLATE_CATEGORIES.URGENCY,
    style: TEMPLATE_STYLES.BOLD,
    description: 'High-impact urgency popup with countdown timer',
    thumbnail: '/images/templates/urgency-countdown-bold.png',
    config: {
      title: '⏰ FLASH SALE ENDING SOON!',
      message: 'Limited time offer - Don\'t miss out on 30% off!',
      discountCode: 'FLASH30',
      discountPercentage: 30,
      backgroundColor: '#ff4444',
      textColor: '#ffffff',
      buttonColor: '#ffffff',
      buttonTextColor: '#ff4444',
      borderRadius: '12px',
      fontSize: {
        title: '22px',
        message: '16px',
        button: '16px'
      },
      animation: 'pulse',
      showTimer: true,
      timerDuration: 1800, // 30 minutes
      pulseButton: true,
      customCSS: `
        .urgency-popup {
          background: linear-gradient(45deg, #ff4444, #cc0000);
          animation: urgencyShake 0.5s ease-in-out infinite alternate;
        }
        @keyframes urgencyShake {
          0% { transform: translateX(0px); }
          100% { transform: translateX(2px); }
        }
        .timer {
          font-size: 24px;
          font-weight: bold;
          color: #ffff00;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
      `
    },
    tags: ['urgency', 'countdown', 'flash-sale', 'bold']
  },

  {
    id: 'welcome-elegant',
    name: 'Welcome - Elegant',
    category: TEMPLATE_CATEGORIES.WELCOME,
    style: TEMPLATE_STYLES.ELEGANT,
    description: 'Sophisticated welcome popup with elegant typography',
    thumbnail: '/images/templates/welcome-elegant.png',
    config: {
      title: 'Welcome to Our Store',
      message: 'Discover premium quality products crafted with care. Enjoy 15% off your first purchase.',
      discountCode: 'WELCOME15',
      discountPercentage: 15,
      backgroundColor: '#f8f8f8',
      textColor: '#2c2c2c',
      buttonColor: '#8b4513',
      buttonTextColor: '#ffffff',
      borderRadius: '0px',
      fontSize: {
        title: '28px',
        message: '16px',
        button: '14px'
      },
      animation: 'slideInUp',
      fontFamily: 'Georgia, serif',
      customCSS: `
        .elegant-popup {
          border: 3px solid #8b4513;
          font-family: Georgia, serif;
          padding: 40px;
        }
        .elegant-popup h2 {
          border-bottom: 2px solid #8b4513;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .elegant-popup .message {
          line-height: 1.6;
          font-style: italic;
        }
      `
    },
    tags: ['welcome', 'elegant', 'premium', 'sophisticated']
  },

  {
    id: 'social-proof-modern',
    name: 'Social Proof - Modern',
    category: TEMPLATE_CATEGORIES.SOCIAL_PROOF,
    style: TEMPLATE_STYLES.MODERN,
    description: 'Modern popup showcasing customer testimonials and reviews',
    thumbnail: '/images/templates/social-proof-modern.png',
    config: {
      title: '10,000+ Happy Customers',
      message: 'Join thousands of satisfied customers. See what they\'re saying about us!',
      discountCode: 'SOCIAL20',
      discountPercentage: 20,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      buttonColor: '#4285f4',
      buttonTextColor: '#ffffff',
      borderRadius: '16px',
      fontSize: {
        title: '20px',
        message: '14px',
        button: '16px'
      },
      animation: 'bounceIn',
      showStars: true,
      starRating: 4.8,
      reviewCount: 10243,
      customCSS: `
        .social-proof-popup {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #e0e0e0;
        }
        .stars {
          color: #ffd700;
          font-size: 18px;
          margin: 10px 0;
        }
        .review-count {
          color: #666;
          font-size: 12px;
        }
        .testimonial {
          font-style: italic;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
      `
    },
    tags: ['social-proof', 'reviews', 'testimonials', 'modern']
  },

  {
    id: 'cart-abandonment-playful',
    name: 'Cart Abandonment - Playful',
    category: TEMPLATE_CATEGORIES.CART_ABANDONMENT,
    style: TEMPLATE_STYLES.PLAYFUL,
    description: 'Fun and engaging cart abandonment popup with playful elements',
    thumbnail: '/images/templates/cart-abandonment-playful.png',
    config: {
      title: '🛒 Forgot something?',
      message: 'Your items are waiting! Complete your purchase and save 10% with free shipping.',
      discountCode: 'COMEBACK10',
      discountPercentage: 10,
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff',
      buttonColor: '#4ecdc4',
      buttonTextColor: '#ffffff',
      borderRadius: '20px',
      fontSize: {
        title: '22px',
        message: '16px',
        button: '16px'
      },
      animation: 'wobble',
      showCartItems: true,
      customCSS: `
        .playful-popup {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
          position: relative;
          overflow: hidden;
        }
        .playful-popup::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
          animation: float 20s infinite linear;
        }
        @keyframes float {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `
    },
    tags: ['cart-abandonment', 'playful', 'recovery', 'fun']
  },

  {
    id: 'announcement-professional',
    name: 'Announcement - Professional',
    category: TEMPLATE_CATEGORIES.ANNOUNCEMENT,
    style: TEMPLATE_STYLES.PROFESSIONAL,
    description: 'Professional announcement popup for important updates',
    thumbnail: '/images/templates/announcement-professional.png',
    config: {
      title: 'Important Update',
      message: 'We\'re upgrading our service to serve you better. New features launching soon!',
      discountCode: '',
      discountPercentage: 0,
      backgroundColor: '#2c3e50',
      textColor: '#ffffff',
      buttonColor: '#3498db',
      buttonTextColor: '#ffffff',
      borderRadius: '0px',
      fontSize: {
        title: '24px',
        message: '16px',
        button: '14px'
      },
      animation: 'slideInDown',
      showIcon: true,
      iconType: 'announcement',
      customCSS: `
        .professional-popup {
          border-left: 5px solid #3498db;
          font-family: 'Arial', sans-serif;
        }
        .announcement-icon {
          font-size: 32px;
          color: #3498db;
          margin-bottom: 15px;
        }
        .professional-popup .button {
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
      `
    },
    tags: ['announcement', 'professional', 'update', 'corporate']
  },

  {
    id: 'black-friday-modern',
    name: 'Black Friday - Modern',
    category: TEMPLATE_CATEGORIES.SEASONAL,
    style: TEMPLATE_STYLES.MODERN,
    description: 'Sleek Black Friday popup with modern gradients',
    thumbnail: '/images/templates/black-friday-modern.png',
    config: {
      title: 'BLACK FRIDAY',
      message: 'Biggest sale of the year! Up to 70% off everything.',
      discountCode: 'BLACKFRIDAY70',
      discountPercentage: 70,
      backgroundColor: '#000000',
      textColor: '#ffffff',
      buttonColor: '#ff0066',
      buttonTextColor: '#ffffff',
      borderRadius: '12px',
      fontSize: {
        title: '32px',
        message: '18px',
        button: '18px'
      },
      animation: 'zoomIn',
      showSavingsBadge: true,
      customCSS: `
        .black-friday-popup {
          background: linear-gradient(135deg, #000000, #1a1a1a, #000000);
          border: 2px solid #ff0066;
          position: relative;
        }
        .savings-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff0066;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .black-friday-popup h2 {
          background: linear-gradient(45deg, #ff0066, #ff6600);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: none;
        }
      `
    },
    tags: ['black-friday', 'sale', 'modern', 'gradient']
  }
];

/**
 * Template Manager Class
 */
export class TemplateManager {
  constructor() {
    this.templates = POPUP_TEMPLATES;
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    return this.templates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get templates by style
   */
  getTemplatesByStyle(style) {
    return this.templates.filter(template => template.style === style);
  }

  /**
   * Search templates
   */
  searchTemplates(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates.find(template => template.id === templateId);
  }

  /**
   * Apply template to popup settings
   */
  applyTemplate(templateId, existingSettings = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Merge template config with existing settings
    return {
      ...existingSettings,
      ...template.config,
      templateId: template.id,
      templateName: template.name,
      appliedAt: new Date().toISOString()
    };
  }

  /**
   * Get template categories with counts
   */
  getCategoriesWithCounts() {
    const categoryCounts = {};
    
    Object.values(TEMPLATE_CATEGORIES).forEach(category => {
      categoryCounts[category] = this.getTemplatesByCategory(category).length;
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      count
    }));
  }

  /**
   * Get style categories with counts
   */
  getStylesWithCounts() {
    const styleCounts = {};
    
    Object.values(TEMPLATE_STYLES).forEach(style => {
      styleCounts[style] = this.getTemplatesByStyle(style).length;
    });

    return Object.entries(styleCounts).map(([style, count]) => ({
      value: style,
      label: style.charAt(0).toUpperCase() + style.slice(1),
      count
    }));
  }

  /**
   * Generate CSS for template
   */
  generateTemplateCSS(template) {
    const config = template.config;
    
    let css = `
      .stayboost-popup.template-${template.id} {
        background-color: ${config.backgroundColor};
        color: ${config.textColor};
        border-radius: ${config.borderRadius};
        font-family: ${config.fontFamily || 'Arial, sans-serif'};
      }
      
      .stayboost-popup.template-${template.id} .popup-title {
        font-size: ${config.fontSize.title};
        color: ${config.textColor};
      }
      
      .stayboost-popup.template-${template.id} .popup-message {
        font-size: ${config.fontSize.message};
        color: ${config.textColor};
      }
      
      .stayboost-popup.template-${template.id} .popup-button {
        background-color: ${config.buttonColor};
        color: ${config.buttonTextColor};
        font-size: ${config.fontSize.button};
        border-radius: ${config.borderRadius};
      }
    `;

    if (config.customCSS) {
      css += '\n' + config.customCSS;
    }

    return css;
  }

  /**
   * Validate template configuration
   */
  validateTemplate(template) {
    const errors = [];

    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.category) errors.push('Template category is required');
    if (!template.config) errors.push('Template configuration is required');

    if (template.config) {
      if (!template.config.title) errors.push('Template title is required');
      if (!template.config.message) errors.push('Template message is required');
      if (!template.config.backgroundColor) errors.push('Background color is required');
      if (!template.config.textColor) errors.push('Text color is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Convenience functions
 */
export function getTemplateManager() {
  return new TemplateManager();
}

export function getPopupTemplates(filters = {}) {
  const manager = new TemplateManager();
  
  if (filters.category) {
    return manager.getTemplatesByCategory(filters.category);
  }
  
  if (filters.style) {
    return manager.getTemplatesByStyle(filters.style);
  }
  
  if (filters.search) {
    return manager.searchTemplates(filters.search);
  }
  
  return manager.getAllTemplates();
}

export { TEMPLATE_CATEGORIES, TEMPLATE_STYLES };
