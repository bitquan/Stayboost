// StayBoost Template Localization API
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Supported languages with metadata
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', direction: 'ltr', region: 'Global' },
  es: { name: 'Español', direction: 'ltr', region: 'Spain & Latin America' },
  fr: { name: 'Français', direction: 'ltr', region: 'France & Canada' },
  de: { name: 'Deutsch', direction: 'ltr', region: 'Germany & Austria' },
  it: { name: 'Italiano', direction: 'ltr', region: 'Italy' },
  pt: { name: 'Português', direction: 'ltr', region: 'Portugal & Brazil' },
  ja: { name: '日本語', direction: 'ltr', region: 'Japan' },
  ko: { name: '한국어', direction: 'ltr', region: 'South Korea' },
  zh: { name: '中文', direction: 'ltr', region: 'China' },
  ar: { name: 'العربية', direction: 'rtl', region: 'Middle East' },
  he: { name: 'עברית', direction: 'rtl', region: 'Israel' },
  ru: { name: 'Русский', direction: 'ltr', region: 'Russia' },
  hi: { name: 'हिन्दी', direction: 'ltr', region: 'India' },
  th: { name: 'ไทย', direction: 'ltr', region: 'Thailand' },
  tr: { name: 'Türkçe', direction: 'ltr', region: 'Turkey' },
  nl: { name: 'Nederlands', direction: 'ltr', region: 'Netherlands' },
  sv: { name: 'Svenska', direction: 'ltr', region: 'Sweden' },
  da: { name: 'Dansk', direction: 'ltr', region: 'Denmark' },
  no: { name: 'Norsk', direction: 'ltr', region: 'Norway' },
  fi: { name: 'Suomi', direction: 'ltr', region: 'Finland' }
};

// Auto-translation templates for common e-commerce terms
const AUTO_TRANSLATIONS = {
  // Common popup elements
  title: {
    en: "Don't leave yet!",
    es: "¡No te vayas aún!",
    fr: "Ne partez pas encore!",
    de: "Gehen Sie noch nicht!",
    it: "Non andartene ancora!",
    pt: "Não vá embora ainda!",
    ja: "まだ行かないで！",
    ko: "아직 가지 마세요!",
    zh: "别走！",
    ar: "لا تغادر بعد!",
    he: "אל תעזוב עדיין!",
    ru: "Не уходите пока!",
    hi: "अभी मत जाइए!",
    th: "อย่าไปก่อน!",
    tr: "Henüz gitme!",
    nl: "Ga nog niet weg!",
    sv: "Gå inte än!",
    da: "Gå ikke endnu!",
    no: "Ikke gå ennå!",
    fi: "Älä lähde vielä!"
  },
  message: {
    en: "Get 10% off your first order",
    es: "Obtén 10% de descuento en tu primer pedido",
    fr: "Obtenez 10% de réduction sur votre première commande",
    de: "10% Rabatt auf Ihre erste Bestellung",
    it: "Ottieni il 10% di sconto sul tuo primo ordine",
    pt: "Ganhe 10% de desconto na sua primeira compra",
    ja: "初回注文で10％割引",
    ko: "첫 주문 10% 할인",
    zh: "首次订单享10%折扣",
    ar: "احصل على خصم 10% على طلبك الأول",
    he: "קבל 10% הנחה על ההזמנה הראשונה",
    ru: "Скидка 10% на первый заказ",
    hi: "अपने पहले ऑर्डर पर 10% छूट पाएं",
    th: "รับส่วนลด 10% สำหรับคำสั่งซื้อแรก",
    tr: "İlk siparişinizde %10 indirim",
    nl: "10% korting op je eerste bestelling",
    sv: "10% rabatt på din första beställning",
    da: "10% rabat på din første ordre",
    no: "10% rabatt på din første bestilling",
    fi: "10% alennus ensimmäisestä tilauksesta"
  },
  buttonText: {
    en: "Get My Discount",
    es: "Obtener Mi Descuento",
    fr: "Obtenir Ma Réduction",
    de: "Meinen Rabatt Holen",
    it: "Ottieni Il Mio Sconto",
    pt: "Obter Meu Desconto",
    ja: "割引を取得",
    ko: "할인 받기",
    zh: "获取折扣",
    ar: "احصل على خصمي",
    he: "קבל את ההנחה שלי",
    ru: "Получить Скидку",
    hi: "मेरी छूट पाएं",
    th: "รับส่วนลดของฉัน",
    tr: "İndirimi Al",
    nl: "Krijg Mijn Korting",
    sv: "Få Min Rabatt",
    da: "Få Min Rabat",
    no: "Få Min Rabatt",
    fi: "Hanki Alennukseni"
  },
  closeText: {
    en: "No Thanks",
    es: "No Gracias",
    fr: "Non Merci",
    de: "Nein Danke",
    it: "No Grazie",
    pt: "Não Obrigado",
    ja: "いいえ、結構です",
    ko: "괜찮습니다",
    zh: "不，谢谢",
    ar: "لا شكراً",
    he: "לא תודה",
    ru: "Нет Спасибо",
    hi: "नहीं धन्यवाद",
    th: "ไม่ขอบคุณ",
    tr: "Hayır Teşekkürler",
    nl: "Nee Bedankt",
    sv: "Nej Tack",
    da: "Nej Tak",
    no: "Nei Takk",
    fi: "Ei Kiitos"
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const method = request.method;
  const url = new URL(request.url);
  
  try {
    if (method === 'GET') {
      // Get supported languages
      if (url.searchParams.get('action') === 'languages') {
        return json({ languages: SUPPORTED_LANGUAGES });
      }
      
      // Get translations for a template
      const templateId = url.searchParams.get('templateId');
      const language = url.searchParams.get('language');
      
      if (!templateId) {
        return json({ error: 'Template ID is required' }, { status: 400 });
      }
      
      const whereClause = {
        templateId: parseInt(templateId),
        shop: session.shop
      };
      
      if (language) {
        whereClause.language = language;
      }
      
      const translations = await prisma.templateTranslation.findMany({
        where: whereClause,
        orderBy: [
          { language: 'asc' },
          { key: 'asc' }
        ]
      });
      
      // Get template to extract original keys
      const template = await prisma.popupTemplate.findFirst({
        where: {
          id: parseInt(templateId),
          OR: [
            { shop: session.shop },
            { shop: null } // Built-in templates
          ]
        }
      });
      
      if (!template) {
        return json({ error: 'Template not found' }, { status: 404 });
      }
      
      let originalKeys = [];
      try {
        const config = JSON.parse(template.config);
        originalKeys = Object.keys(config).filter(key => 
          typeof config[key] === 'string' && 
          ['title', 'message', 'buttonText', 'closeText', 'subtitle', 'offerText'].includes(key)
        );
      } catch (e) {
        originalKeys = ['title', 'message', 'buttonText', 'closeText'];
      }
      
      return json({ 
        translations, 
        originalKeys,
        template: {
          id: template.id,
          name: template.name,
          config: template.config
        }
      });
    }
    
    if (method === 'POST') {
      const body = await request.json();
      const { action, templateId, language, translations: newTranslations } = body;
      
      if (action === 'auto-translate') {
        const { key, targetLanguages } = body;
        
        if (!key || !targetLanguages || !Array.isArray(targetLanguages)) {
          return json({ error: 'Key and target languages are required for auto-translation' }, { status: 400 });
        }
        
        const autoTranslations = {};
        for (const lang of targetLanguages) {
          if (AUTO_TRANSLATIONS[key] && AUTO_TRANSLATIONS[key][lang]) {
            autoTranslations[lang] = AUTO_TRANSLATIONS[key][lang];
          }
        }
        
        return json({ translations: autoTranslations });
      }
      
      if (action === 'bulk-translate') {
        const { targetLanguage, keys } = body;
        
        if (!targetLanguage || !keys || !Array.isArray(keys)) {
          return json({ error: 'Target language and keys are required for bulk translation' }, { status: 400 });
        }
        
        const bulkTranslations = {};
        for (const key of keys) {
          if (AUTO_TRANSLATIONS[key] && AUTO_TRANSLATIONS[key][targetLanguage]) {
            bulkTranslations[key] = AUTO_TRANSLATIONS[key][targetLanguage];
          }
        }
        
        return json({ translations: bulkTranslations });
      }
      
      if (!templateId || !language || !newTranslations) {
        return json({ error: 'Template ID, language, and translations are required' }, { status: 400 });
      }
      
      // Verify template belongs to shop or is built-in
      const template = await prisma.popupTemplate.findFirst({
        where: {
          id: parseInt(templateId),
          OR: [
            { shop: session.shop },
            { shop: null }
          ]
        }
      });
      
      if (!template) {
        return json({ error: 'Template not found' }, { status: 404 });
      }
      
      // Create or update translations
      const results = [];
      for (const [key, value] of Object.entries(newTranslations)) {
        if (!value.trim()) continue; // Skip empty translations
        
        const translation = await prisma.templateTranslation.upsert({
          where: {
            templateId_language_key: {
              templateId: parseInt(templateId),
              language,
              key
            }
          },
          create: {
            templateId: parseInt(templateId),
            language,
            key,
            value: value.trim(),
            shop: session.shop
          },
          update: {
            value: value.trim()
          }
        });
        
        results.push(translation);
      }
      
      return json({ 
        success: true, 
        translations: results,
        message: `${results.length} translations saved for ${SUPPORTED_LANGUAGES[language]?.name || language}`
      });
    }
    
    if (method === 'PUT') {
      const body = await request.json();
      const { translationId, value } = body;
      
      if (!translationId || !value) {
        return json({ error: 'Translation ID and value are required' }, { status: 400 });
      }
      
      // Verify translation belongs to shop
      const existingTranslation = await prisma.templateTranslation.findFirst({
        where: {
          id: parseInt(translationId),
          shop: session.shop
        }
      });
      
      if (!existingTranslation) {
        return json({ error: 'Translation not found' }, { status: 404 });
      }
      
      const updatedTranslation = await prisma.templateTranslation.update({
        where: { id: parseInt(translationId) },
        data: { value: value.trim() }
      });
      
      return json({ success: true, translation: updatedTranslation });
    }
    
    if (method === 'DELETE') {
      const body = await request.json();
      const { translationId, templateId, language, key } = body;
      
      if (translationId) {
        // Delete specific translation by ID
        const existingTranslation = await prisma.templateTranslation.findFirst({
          where: {
            id: parseInt(translationId),
            shop: session.shop
          }
        });
        
        if (!existingTranslation) {
          return json({ error: 'Translation not found' }, { status: 404 });
        }
        
        await prisma.templateTranslation.delete({
          where: { id: parseInt(translationId) }
        });
        
        return json({ success: true, message: 'Translation deleted' });
      }
      
      if (templateId && language) {
        // Delete all translations for a language
        const deleteCount = await prisma.templateTranslation.deleteMany({
          where: {
            templateId: parseInt(templateId),
            language,
            shop: session.shop
          }
        });
        
        return json({ 
          success: true, 
          message: `${deleteCount.count} translations deleted for ${SUPPORTED_LANGUAGES[language]?.name || language}`
        });
      }
      
      if (templateId && language && key) {
        // Delete specific key translation
        const deleteCount = await prisma.templateTranslation.deleteMany({
          where: {
            templateId: parseInt(templateId),
            language,
            key,
            shop: session.shop
          }
        });
        
        return json({ 
          success: true, 
          message: deleteCount.count > 0 ? 'Translation deleted' : 'Translation not found'
        });
      }
      
      return json({ error: 'Invalid delete parameters' }, { status: 400 });
    }
    
    return json({ error: 'Method not allowed' }, { status: 405 });
    
  } catch (error) {
    console.error('Template localization API error:', error);
    return json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  return action({ request });
};

// Helper function to get translation completion rate
export async function getTranslationCompletionRate(templateId, language, shop) {
  try {
    // Get template to extract original keys
    const template = await prisma.popupTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { shop },
          { shop: null }
        ]
      }
    });
    
    if (!template) return 0;
    
    let originalKeys = [];
    try {
      const config = JSON.parse(template.config);
      originalKeys = Object.keys(config).filter(key => 
        typeof config[key] === 'string' && 
        ['title', 'message', 'buttonText', 'closeText', 'subtitle', 'offerText'].includes(key)
      );
    } catch (e) {
      originalKeys = ['title', 'message', 'buttonText', 'closeText'];
    }
    
    const translatedCount = await prisma.templateTranslation.count({
      where: {
        templateId,
        language,
        shop,
        key: { in: originalKeys }
      }
    });
    
    return Math.round((translatedCount / originalKeys.length) * 100);
  } catch (error) {
    console.error('Error calculating completion rate:', error);
    return 0;
  }
}

// Helper function to get missing translation keys
export async function getMissingTranslationKeys(templateId, language, shop) {
  try {
    const template = await prisma.popupTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { shop },
          { shop: null }
        ]
      }
    });
    
    if (!template) return [];
    
    let originalKeys = [];
    try {
      const config = JSON.parse(template.config);
      originalKeys = Object.keys(config).filter(key => 
        typeof config[key] === 'string' && 
        ['title', 'message', 'buttonText', 'closeText', 'subtitle', 'offerText'].includes(key)
      );
    } catch (e) {
      originalKeys = ['title', 'message', 'buttonText', 'closeText'];
    }
    
    const existingTranslations = await prisma.templateTranslation.findMany({
      where: {
        templateId,
        language,
        shop
      },
      select: { key: true }
    });
    
    const translatedKeys = existingTranslations.map(t => t.key);
    return originalKeys.filter(key => !translatedKeys.includes(key));
  } catch (error) {
    console.error('Error getting missing keys:', error);
    return [];
  }
}
