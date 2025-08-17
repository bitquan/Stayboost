// StayBoost Template Localization Tests
import assert from 'node:assert';
import { after, before, describe, test } from 'node:test';
import prisma from '../app/db.server.js';

describe('🌍 StayBoost Template Localization', () => {
  
  before(async () => {
    // Clean up any existing test data
    await prisma.templateTranslation.deleteMany({
      where: { shop: { contains: 'localization-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'localization-test' } }
    });
  });

  after(async () => {
    // Clean up test data
    await prisma.templateTranslation.deleteMany({
      where: { shop: { contains: 'localization-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'localization-test' } }
    });
  });

  describe('🏗️ Localization Infrastructure', () => {
    test('should have localization frontend route', async () => {
      const fs = await import('fs');
      const frontendFile = '/Users/incognitolab/My project/Stayboost/app/routes/app.localization.jsx';
      assert.ok(fs.existsSync(frontendFile), 'Localization frontend route should exist');
    });

    test('should have localization API route', async () => {
      const fs = await import('fs');
      const apiFile = '/Users/incognitolab/My project/Stayboost/app/routes/api.template-localization.jsx';
      assert.ok(fs.existsSync(apiFile), 'Localization API route should exist');
    });

    test('should support template translations in database', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test.myshopify.com',
          name: 'Test Template for Translation',
          description: 'Template to test localization',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome!',
            message: 'Get great deals',
            buttonText: 'Shop Now',
            closeText: 'No Thanks'
          })
        }
      });

      const translation = await prisma.templateTranslation.create({
        data: {
          templateId: template.id,
          language: 'es',
          key: 'title',
          value: '¡Bienvenido!',
          shop: 'localization-test.myshopify.com'
        }
      });

      assert.ok(translation.id, 'Should create template translation');
      assert.strictEqual(translation.language, 'es', 'Translation language should be Spanish');
      assert.strictEqual(translation.key, 'title', 'Translation key should be title');
      assert.strictEqual(translation.value, '¡Bienvenido!', 'Translation value should be in Spanish');
    });
  });

  describe('🌐 Multi-Language Support', () => {
    test('should support major world languages', async () => {
      const languages = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru'];
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-multilang.myshopify.com',
          name: 'Multi-Language Template',
          description: 'Template for testing multiple languages',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great deals await'
          })
        }
      });

      const translations = [];
      for (const lang of languages) {
        const translation = await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: lang,
            key: 'title',
            value: `Welcome in ${lang}`,
            shop: 'localization-test-multilang.myshopify.com'
          }
        });
        translations.push(translation);
      }

      assert.strictEqual(translations.length, languages.length, 'Should create translations for all languages');
      
      const distinctLanguages = [...new Set(translations.map(t => t.language))];
      assert.strictEqual(distinctLanguages.length, languages.length, 'Should have unique translations per language');
    });

    test('should support RTL languages', async () => {
      const rtlLanguages = ['ar', 'he'];
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-rtl.myshopify.com',
          name: 'RTL Template',
          description: 'Template for RTL languages',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Special offer'
          })
        }
      });

      for (const lang of rtlLanguages) {
        const translation = await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: lang,
            key: 'title',
            value: lang === 'ar' ? 'مرحباً' : 'שלום',
            shop: 'localization-test-rtl.myshopify.com'
          }
        });

        assert.ok(translation.id, `Should create ${lang} translation`);
      }

      const rtlTranslations = await prisma.templateTranslation.findMany({
        where: {
          templateId: template.id,
          language: { in: rtlLanguages }
        }
      });

      assert.strictEqual(rtlTranslations.length, 2, 'Should have RTL translations');
    });

    test('should handle translation key-value pairs', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-keys.myshopify.com',
          name: 'Key-Value Template',
          description: 'Template for testing translation keys',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great deals',
            buttonText: 'Shop Now',
            closeText: 'No Thanks'
          })
        }
      });

      const translationKeys = [
        { key: 'title', value: 'Bienvenido' },
        { key: 'message', value: 'Grandes ofertas' },
        { key: 'buttonText', value: 'Comprar Ahora' },
        { key: 'closeText', value: 'No Gracias' }
      ];

      const translations = [];
      for (const { key, value } of translationKeys) {
        const translation = await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: 'es',
            key,
            value,
            shop: 'localization-test-keys.myshopify.com'
          }
        });
        translations.push(translation);
      }

      assert.strictEqual(translations.length, 4, 'Should create all translation key-value pairs');
      
      const titleTranslation = translations.find(t => t.key === 'title');
      assert.strictEqual(titleTranslation.value, 'Bienvenido', 'Should have correct title translation');
      
      const buttonTranslation = translations.find(t => t.key === 'buttonText');
      assert.strictEqual(buttonTranslation.value, 'Comprar Ahora', 'Should have correct button translation');
    });
  });

  describe('🔄 Translation Management', () => {
    test('should update existing translations', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-update.myshopify.com',
          name: 'Update Template',
          description: 'Template for testing updates',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Special offer'
          })
        }
      });

      // Create initial translation
      const initialTranslation = await prisma.templateTranslation.create({
        data: {
          templateId: template.id,
          language: 'fr',
          key: 'title',
          value: 'Bienvenue',
          shop: 'localization-test-update.myshopify.com'
        }
      });

      // Update translation using upsert
      const updatedTranslation = await prisma.templateTranslation.upsert({
        where: {
          templateId_language_key: {
            templateId: template.id,
            language: 'fr',
            key: 'title'
          }
        },
        create: {
          templateId: template.id,
          language: 'fr',
          key: 'title',
          value: 'Bienvenue à tous',
          shop: 'localization-test-update.myshopify.com'
        },
        update: {
          value: 'Bienvenue à tous'
        }
      });

      assert.strictEqual(updatedTranslation.id, initialTranslation.id, 'Should update same record');
      assert.strictEqual(updatedTranslation.value, 'Bienvenue à tous', 'Should have updated value');
    });

    test('should delete translations', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-delete.myshopify.com',
          name: 'Delete Template',
          description: 'Template for testing deletion',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome'
          })
        }
      });

      // Create translation
      const translation = await prisma.templateTranslation.create({
        data: {
          templateId: template.id,
          language: 'de',
          key: 'title',
          value: 'Willkommen',
          shop: 'localization-test-delete.myshopify.com'
        }
      });

      // Delete translation
      await prisma.templateTranslation.deleteMany({
        where: {
          templateId: template.id,
          language: 'de',
          key: 'title',
          shop: 'localization-test-delete.myshopify.com'
        }
      });

      // Verify deletion
      const deletedTranslation = await prisma.templateTranslation.findUnique({
        where: { id: translation.id }
      });

      assert.strictEqual(deletedTranslation, null, 'Translation should be deleted');
    });

    test('should support bulk translation operations', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-bulk.myshopify.com',
          name: 'Bulk Template',
          description: 'Template for testing bulk operations',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great deals',
            buttonText: 'Shop Now'
          })
        }
      });

      const bulkTranslations = [
        { key: 'title', value: 'Benvenuto' },
        { key: 'message', value: 'Grandi offerte' },
        { key: 'buttonText', value: 'Acquista Ora' }
      ];

      const translations = [];
      for (const { key, value } of bulkTranslations) {
        const translation = await prisma.templateTranslation.upsert({
          where: {
            templateId_language_key: {
              templateId: template.id,
              language: 'it',
              key
            }
          },
          create: {
            templateId: template.id,
            language: 'it',
            key,
            value,
            shop: 'localization-test-bulk.myshopify.com'
          },
          update: {
            value
          }
        });
        translations.push(translation);
      }

      assert.strictEqual(translations.length, 3, 'Should create bulk translations');
      
      const italianTranslations = await prisma.templateTranslation.findMany({
        where: {
          templateId: template.id,
          language: 'it'
        }
      });

      assert.strictEqual(italianTranslations.length, 3, 'Should have all Italian translations');
    });
  });

  describe('🎯 Template Integration', () => {
    test('should link translations to templates', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-integration.myshopify.com',
          name: 'Integration Template',
          description: 'Template for testing integration',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Special offer'
          })
        }
      });

      // Create translations for multiple languages
      const languages = ['es', 'fr', 'de'];
      for (const lang of languages) {
        await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: lang,
            key: 'title',
            value: `Welcome in ${lang}`,
            shop: 'localization-test-integration.myshopify.com'
          }
        });
      }

      // Fetch template with translations
      const templateWithTranslations = await prisma.popupTemplate.findUnique({
        where: { id: template.id },
        include: {
          translations: true
        }
      });

      assert.ok(templateWithTranslations, 'Should fetch template');
      assert.strictEqual(templateWithTranslations.translations.length, 3, 'Should have 3 translations');
      
      const languageSet = new Set(templateWithTranslations.translations.map(t => t.language));
      assert.strictEqual(languageSet.size, 3, 'Should have unique languages');
    });

    test('should support different template types', async () => {
      const templateTypes = ['custom', 'built_in', 'community', 'ai_generated'];
      
      for (const templateType of templateTypes) {
        const template = await prisma.popupTemplate.create({
          data: {
            shop: `localization-test-${templateType}.myshopify.com`,
            name: `${templateType} Template`,
            description: `Template of type ${templateType}`,
            category: 'sales',
            templateType,
            config: JSON.stringify({
              title: 'Welcome',
              message: 'Great offer'
            })
          }
        });

        const translation = await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: 'es',
            key: 'title',
            value: 'Bienvenido',
            shop: `localization-test-${templateType}.myshopify.com`
          }
        });

        assert.ok(translation.id, `Should create translation for ${templateType} template`);
      }
    });

    test('should handle cascade deletion', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-cascade.myshopify.com',
          name: 'Cascade Template',
          description: 'Template for testing cascade deletion',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome'
          })
        }
      });

      // Create translation
      const translation = await prisma.templateTranslation.create({
        data: {
          templateId: template.id,
          language: 'pt',
          key: 'title',
          value: 'Bem-vindo',
          shop: 'localization-test-cascade.myshopify.com'
        }
      });

      // Delete template (should cascade to translations)
      await prisma.popupTemplate.delete({
        where: { id: template.id }
      });

      // Check that translation was also deleted
      const orphanedTranslation = await prisma.templateTranslation.findUnique({
        where: { id: translation.id }
      });

      assert.strictEqual(orphanedTranslation, null, 'Translation should be cascade deleted');
    });
  });

  describe('🔍 Translation Queries', () => {
    test('should filter translations by language', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-filter.myshopify.com',
          name: 'Filter Template',
          description: 'Template for testing filtering',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great offer'
          })
        }
      });

      // Create translations in multiple languages
      const languages = ['en', 'es', 'fr', 'de', 'ja'];
      for (const lang of languages) {
        await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: lang,
            key: 'title',
            value: `Welcome in ${lang}`,
            shop: 'localization-test-filter.myshopify.com'
          }
        });
      }

      // Filter by specific language
      const spanishTranslations = await prisma.templateTranslation.findMany({
        where: {
          templateId: template.id,
          language: 'es'
        }
      });

      assert.strictEqual(spanishTranslations.length, 1, 'Should find exactly one Spanish translation');
      assert.strictEqual(spanishTranslations[0].language, 'es', 'Should be Spanish translation');
    });

    test('should find translations by shop', async () => {
      const shops = ['localization-shop1.myshopify.com', 'localization-shop2.myshopify.com'];
      
      for (const shop of shops) {
        const template = await prisma.popupTemplate.create({
          data: {
            shop,
            name: `Template for ${shop}`,
            description: 'Shop-specific template',
            category: 'sales',
            templateType: 'custom',
            config: JSON.stringify({
              title: 'Welcome'
            })
          }
        });

        await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            language: 'es',
            key: 'title',
            value: 'Bienvenido',
            shop
          }
        });
      }

      // Find translations for specific shop
      const shop1Translations = await prisma.templateTranslation.findMany({
        where: {
          shop: 'localization-shop1.myshopify.com'
        }
      });

      assert.strictEqual(shop1Translations.length, 1, 'Should find one translation for shop1');
      assert.strictEqual(shop1Translations[0].shop, 'localization-shop1.myshopify.com', 'Should belong to correct shop');
    });

    test('should support complex translation queries', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-complex.myshopify.com',
          name: 'Complex Query Template',
          description: 'Template for complex queries',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great offer',
            buttonText: 'Shop Now'
          })
        }
      });

      // Create multiple translations
      const translationData = [
        { language: 'es', key: 'title', value: 'Bienvenido' },
        { language: 'es', key: 'message', value: 'Gran oferta' },
        { language: 'fr', key: 'title', value: 'Bienvenue' },
        { language: 'fr', key: 'buttonText', value: 'Acheter' }
      ];

      for (const data of translationData) {
        await prisma.templateTranslation.create({
          data: {
            templateId: template.id,
            ...data,
            shop: 'localization-test-complex.myshopify.com'
          }
        });
      }

      // Complex query: Spanish translations only
      const spanishTitleAndMessage = await prisma.templateTranslation.findMany({
        where: {
          templateId: template.id,
          language: 'es',
          key: { in: ['title', 'message'] }
        }
      });

      assert.strictEqual(spanishTitleAndMessage.length, 2, 'Should find Spanish title and message');
      
      const keys = spanishTitleAndMessage.map(t => t.key).sort();
      assert.deepStrictEqual(keys, ['message', 'title'], 'Should have title and message keys');
    });
  });

  describe('📊 Translation Analytics', () => {
    test('should track translation completion rates', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-analytics.myshopify.com',
          name: 'Analytics Template',
          description: 'Template for analytics testing',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great offer',
            buttonText: 'Shop Now',
            closeText: 'No Thanks'
          })
        }
      });

      const totalKeys = 4; // title, message, buttonText, closeText
      
      // Partially translate to Spanish (2 out of 4 keys)
      await prisma.templateTranslation.createMany({
        data: [
          {
            templateId: template.id,
            language: 'es',
            key: 'title',
            value: 'Bienvenido',
            shop: 'localization-test-analytics.myshopify.com'
          },
          {
            templateId: template.id,
            language: 'es',
            key: 'message',
            value: 'Gran oferta',
            shop: 'localization-test-analytics.myshopify.com'
          }
        ]
      });

      // Fully translate to French (4 out of 4 keys)
      await prisma.templateTranslation.createMany({
        data: [
          {
            templateId: template.id,
            language: 'fr',
            key: 'title',
            value: 'Bienvenue',
            shop: 'localization-test-analytics.myshopify.com'
          },
          {
            templateId: template.id,
            language: 'fr',
            key: 'message',
            value: 'Grande offre',
            shop: 'localization-test-analytics.myshopify.com'
          },
          {
            templateId: template.id,
            language: 'fr',
            key: 'buttonText',
            value: 'Acheter',
            shop: 'localization-test-analytics.myshopify.com'
          },
          {
            templateId: template.id,
            language: 'fr',
            key: 'closeText',
            value: 'Non merci',
            shop: 'localization-test-analytics.myshopify.com'
          }
        ]
      });

      // Calculate completion rates
      const spanishTranslations = await prisma.templateTranslation.count({
        where: {
          templateId: template.id,
          language: 'es'
        }
      });

      const frenchTranslations = await prisma.templateTranslation.count({
        where: {
          templateId: template.id,
          language: 'fr'
        }
      });

      const spanishCompletionRate = (spanishTranslations / totalKeys) * 100;
      const frenchCompletionRate = (frenchTranslations / totalKeys) * 100;

      assert.strictEqual(spanishCompletionRate, 50, 'Spanish should be 50% complete');
      assert.strictEqual(frenchCompletionRate, 100, 'French should be 100% complete');
    });

    test('should identify missing translations', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'localization-test-missing.myshopify.com',
          name: 'Missing Translations Template',
          description: 'Template for testing missing translations',
          category: 'sales',
          templateType: 'custom',
          config: JSON.stringify({
            title: 'Welcome',
            message: 'Great offer',
            buttonText: 'Shop Now'
          })
        }
      });

      // Only translate title and message, leave buttonText missing
      await prisma.templateTranslation.createMany({
        data: [
          {
            templateId: template.id,
            language: 'de',
            key: 'title',
            value: 'Willkommen',
            shop: 'localization-test-missing.myshopify.com'
          },
          {
            templateId: template.id,
            language: 'de',
            key: 'message',
            value: 'Tolles Angebot',
            shop: 'localization-test-missing.myshopify.com'
          }
        ]
      });

      const expectedKeys = ['title', 'message', 'buttonText'];
      const translatedKeys = await prisma.templateTranslation.findMany({
        where: {
          templateId: template.id,
          language: 'de'
        },
        select: {
          key: true
        }
      });

      const translatedKeyNames = translatedKeys.map(t => t.key);
      const missingKeys = expectedKeys.filter(key => !translatedKeyNames.includes(key));

      assert.deepStrictEqual(missingKeys, ['buttonText'], 'Should identify missing buttonText translation');
    });
  });
});

// Helper function to calculate translation completion rate
function calculateCompletionRate(translations, totalKeys) {
  const translatedKeys = new Set(translations.map(t => t.key));
  return Math.round((translatedKeys.size / totalKeys) * 100);
}

// Helper function to get supported languages list
function getSupportedLanguages() {
  return [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 
    'ar', 'he', 'ru', 'hi', 'th', 'tr', 'nl', 'sv', 'da', 'no', 'fi'
  ];
}
