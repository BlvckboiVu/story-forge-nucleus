
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Editor UI
      save: 'Save',
      saved: 'Saved',
      saving: 'Saving...',
      error: 'Error',
      unsavedChanges: 'Unsaved changes',
      lastSaved: 'Last saved',
      autoSaved: 'Auto-saved',
      
      // Formatting
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      strikethrough: 'Strikethrough',
      code: 'Code',
      alignLeft: 'Align Left',
      alignCenter: 'Align Center',
      alignRight: 'Align Right',
      alignJustify: 'Justify',
      bulletList: 'Bullet List',
      numberedList: 'Numbered List',
      quote: 'Quote',
      divider: 'Divider',
      insertLink: 'Insert Link',
      insertImage: 'Insert Image',
      insertTable: 'Insert Table',
      
      // Focus mode
      focusMode: 'Focus Mode',
      exitFocusMode: 'Exit Focus Mode',
      focus: 'Focus',
      
      // More options
      more: 'More',
      moreOptions: 'More Options',
      
      // Undo/Redo
      undo: 'Undo',
      redo: 'Redo',
      
      // Font and theme
      font: 'Font',
      theme: 'Theme',
      
      // Word count and statistics
      words: 'words',
      characters: 'characters',
      pages: 'pages',
      oneMinute: '1 minute read',
      minutesRead: '{{count}} minutes read',
      approachingWordLimit: 'Approaching Word Limit',
      approachingWordLimitDescription: 'You have {{count}} words. Consider reviewing as you approach the {{limit}} word limit.',
      wordLimitExceeded: 'Word Limit Exceeded',
      wordLimitExceededDescription: 'You have {{count}} words, which exceeds the {{limit}} word limit.',
      
      // Save messages
      draftSavedSuccessfully: 'Draft saved successfully',
      draftAutoSavedSuccessfully: 'Draft auto-saved successfully',
      saveFailedTitle: 'Save Failed',
      autoSaveFailedTitle: 'Auto-save Failed',
      saveFailedDescription: 'Failed to save draft',
      unknownError: 'Unknown error occurred',
    }
  },
  es: {
    translation: {
      // Editor UI
      save: 'Guardar',
      saved: 'Guardado',
      saving: 'Guardando...',
      error: 'Error',
      unsavedChanges: 'Cambios sin guardar',
      lastSaved: 'Último guardado',
      autoSaved: 'Guardado automático',
      
      // Formatting
      bold: 'Negrita',
      italic: 'Cursiva',
      underline: 'Subrayado',
      strikethrough: 'Tachado',
      code: 'Código',
      alignLeft: 'Alinear Izquierda',
      alignCenter: 'Centrar',
      alignRight: 'Alinear Derecha',
      alignJustify: 'Justificar',
      bulletList: 'Lista con Viñetas',
      numberedList: 'Lista Numerada',
      quote: 'Cita',
      divider: 'Divisor',
      insertLink: 'Insertar Enlace',
      insertImage: 'Insertar Imagen',
      insertTable: 'Insertar Tabla',
      
      // Focus mode
      focusMode: 'Modo Enfoque',
      exitFocusMode: 'Salir del Modo Enfoque',
      focus: 'Enfoque',
      
      // More options
      more: 'Más',
      moreOptions: 'Más Opciones',
      
      // Undo/Redo
      undo: 'Deshacer',
      redo: 'Rehacer',
      
      // Font and theme
      font: 'Fuente',
      theme: 'Tema',
      
      // Word count and statistics
      words: 'palabras',
      characters: 'caracteres',
      pages: 'páginas',
      oneMinute: '1 minuto de lectura',
      minutesRead: '{{count}} minutos de lectura',
      approachingWordLimit: 'Aproximándose al Límite de Palabras',
      approachingWordLimitDescription: 'Tienes {{count}} palabras. Considera revisar ya que te acercas al límite de {{limit}} palabras.',
      wordLimitExceeded: 'Límite de Palabras Excedido',
      wordLimitExceededDescription: 'Tienes {{count}} palabras, lo que excede el límite de {{limit}} palabras.',
      
      // Save messages
      draftSavedSuccessfully: 'Borrador guardado exitosamente',
      draftAutoSavedSuccessfully: 'Borrador guardado automáticamente',
      saveFailedTitle: 'Error al Guardar',
      autoSaveFailedTitle: 'Error en Guardado Automático',
      saveFailedDescription: 'Error al guardar borrador',
      unknownError: 'Error desconocido',
    }
  },
  fr: {
    translation: {
      // Editor UI
      save: 'Enregistrer',
      saved: 'Enregistré',
      saving: 'Enregistrement...',
      error: 'Erreur',
      unsavedChanges: 'Modifications non enregistrées',
      lastSaved: 'Dernier enregistrement',
      autoSaved: 'Sauvegarde automatique',
      
      // Formatting
      bold: 'Gras',
      italic: 'Italique',
      underline: 'Souligné',
      strikethrough: 'Barré',
      code: 'Code',
      alignLeft: 'Aligner à Gauche',
      alignCenter: 'Centrer',
      alignRight: 'Aligner à Droite',
      alignJustify: 'Justifier',
      bulletList: 'Liste à Puces',
      numberedList: 'Liste Numérotée',
      quote: 'Citation',
      divider: 'Séparateur',
      insertLink: 'Insérer un Lien',
      insertImage: 'Insérer une Image',
      insertTable: 'Insérer un Tableau',
      
      // Focus mode
      focusMode: 'Mode Focus',
      exitFocusMode: 'Quitter le Mode Focus',
      focus: 'Focus',
      
      // More options
      more: 'Plus',
      moreOptions: 'Plus d\'Options',
      
      // Undo/Redo
      undo: 'Annuler',
      redo: 'Refaire',
      
      // Font and theme
      font: 'Police',
      theme: 'Thème',
      
      // Word count and statistics
      words: 'mots',
      characters: 'caractères',
      pages: 'pages',
      oneMinute: '1 minute de lecture',
      minutesRead: '{{count}} minutes de lecture',
      approachingWordLimit: 'Approche de la Limite de Mots',
      approachingWordLimitDescription: 'Vous avez {{count}} mots. Considérez réviser car vous approchez la limite de {{limit}} mots.',
      wordLimitExceeded: 'Limite de Mots Dépassée',
      wordLimitExceededDescription: 'Vous avez {{count}} mots, ce qui dépasse la limite de {{limit}} mots.',
      
      // Save messages
      draftSavedSuccessfully: 'Brouillon enregistré avec succès',
      draftAutoSavedSuccessfully: 'Brouillon sauvegardé automatiquement',
      saveFailedTitle: 'Échec de l\'Enregistrement',
      autoSaveFailedTitle: 'Échec de la Sauvegarde Automatique',
      saveFailedDescription: 'Échec de l\'enregistrement du brouillon',
      unknownError: 'Erreur inconnue',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
