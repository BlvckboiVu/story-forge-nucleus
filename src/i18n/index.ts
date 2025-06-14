
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  // Toolbar
  save: 'Save',
  exitFocusMode: 'Exit Focus Mode',
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
  moreOptions: 'More Options',
  focusMode: 'Focus Mode',
  font: 'Font',
  theme: 'Theme',
  undo: 'Undo',
  redo: 'Redo',
  more: 'More',
  focus: 'Focus',
  
  // Save states
  saved: 'Saved',
  autoSaved: 'Auto-saved',
  draftSavedSuccessfully: 'Your draft has been saved successfully',
  draftAutoSavedSuccessfully: 'Your draft has been auto-saved',
  saveFailedTitle: 'Save Failed',
  autoSaveFailedTitle: 'Auto-save Failed',
  saveFailedDescription: 'Failed to save your document',
  unknownError: 'Unknown error occurred',
  
  // Word count
  approachingWordLimit: 'Approaching Word Limit',
  approachingWordLimitDescription: 'You have {{count}} words. Limit is {{limit}} words.',
  wordLimitExceeded: 'Word Limit Exceeded',
  wordLimitExceededDescription: 'You have {{count}} words, exceeding the {{limit}} word limit.',
  oneMinute: '1 minute read',
  minutesRead: '{{count}} minutes read',
  
  // Version history
  versionNotFound: 'Version Not Found',
  versionNotFoundDescription: 'The requested version could not be found',
  versionRestored: 'Version Restored',
  versionRestoredDescription: 'Restored version from {{time}}',
  restoreFailedTitle: 'Restore Failed',
  restoreFailedDescription: 'Failed to restore the selected version',
  versionDeleted: 'Version Deleted',
  versionDeletedDescription: 'The selected version has been deleted',
  historyCleared: 'History Cleared',
  historyClearedDescription: 'All version history has been cleared',
  initialVersion: 'Initial Version',
  autoSavedVersion: 'Auto-saved Version',
  
  // Status
  words: 'words',
  characters: 'characters',
  pages: 'pages',
  unsavedChanges: 'Unsaved changes',
  saving: 'Saving...',
  lastSaved: 'Last saved',
  
  // General
  loading: 'Loading...',
  error: 'Error',
  retry: 'Retry',
  cancel: 'Cancel',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  close: 'Close',
};

// Spanish translations
const esTranslations = {
  // Toolbar
  save: 'Guardar',
  exitFocusMode: 'Salir del Modo Enfoque',
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
  moreOptions: 'Más Opciones',
  focusMode: 'Modo Enfoque',
  font: 'Fuente',
  theme: 'Tema',
  undo: 'Deshacer',
  redo: 'Rehacer',
  more: 'Más',
  focus: 'Enfoque',
  
  // Save states
  saved: 'Guardado',
  autoSaved: 'Auto-guardado',
  draftSavedSuccessfully: 'Su borrador se ha guardado exitosamente',
  draftAutoSavedSuccessfully: 'Su borrador se ha auto-guardado',
  saveFailedTitle: 'Error al Guardar',
  autoSaveFailedTitle: 'Error en Auto-guardado',
  saveFailedDescription: 'Error al guardar su documento',
  unknownError: 'Error desconocido',
  
  // Word count
  approachingWordLimit: 'Aproximándose al Límite de Palabras',
  approachingWordLimitDescription: 'Tiene {{count}} palabras. El límite es {{limit}} palabras.',
  wordLimitExceeded: 'Límite de Palabras Excedido',
  wordLimitExceededDescription: 'Tiene {{count}} palabras, excediendo el límite de {{limit}} palabras.',
  oneMinute: '1 minuto de lectura',
  minutesRead: '{{count}} minutos de lectura',
  
  // Version history
  versionNotFound: 'Versión No Encontrada',
  versionNotFoundDescription: 'No se pudo encontrar la versión solicitada',
  versionRestored: 'Versión Restaurada',
  versionRestoredDescription: 'Versión restaurada desde {{time}}',
  restoreFailedTitle: 'Error al Restaurar',
  restoreFailedDescription: 'Error al restaurar la versión seleccionada',
  versionDeleted: 'Versión Eliminada',
  versionDeletedDescription: 'La versión seleccionada ha sido eliminada',
  historyCleared: 'Historial Limpiado',
  historyClearedDescription: 'Todo el historial de versiones ha sido limpiado',
  initialVersion: 'Versión Inicial',
  autoSavedVersion: 'Versión Auto-guardada',
  
  // Status
  words: 'palabras',
  characters: 'caracteres',
  pages: 'páginas',
  unsavedChanges: 'Cambios sin guardar',
  saving: 'Guardando...',
  lastSaved: 'Último guardado',
  
  // General
  loading: 'Cargando...',
  error: 'Error',
  retry: 'Reintentar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  delete: 'Eliminar',
  edit: 'Editar',
  close: 'Cerrar',
};

// French translations
const frTranslations = {
  // Toolbar
  save: 'Enregistrer',
  exitFocusMode: 'Quitter le Mode Focus',
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
  moreOptions: 'Plus d\'Options',
  focusMode: 'Mode Focus',
  font: 'Police',
  theme: 'Thème',
  undo: 'Annuler',
  redo: 'Refaire',
  more: 'Plus',
  focus: 'Focus',
  
  // Save states
  saved: 'Enregistré',
  autoSaved: 'Auto-enregistré',
  draftSavedSuccessfully: 'Votre brouillon a été enregistré avec succès',
  draftAutoSavedSuccessfully: 'Votre brouillon a été auto-enregistré',
  saveFailedTitle: 'Échec de l\'Enregistrement',
  autoSaveFailedTitle: 'Échec de l\'Auto-enregistrement',
  saveFailedDescription: 'Échec de l\'enregistrement de votre document',
  unknownError: 'Erreur inconnue',
  
  // Word count
  approachingWordLimit: 'Approche de la Limite de Mots',
  approachingWordLimitDescription: 'Vous avez {{count}} mots. La limite est {{limit}} mots.',
  wordLimitExceeded: 'Limite de Mots Dépassée',
  wordLimitExceededDescription: 'Vous avez {{count}} mots, dépassant la limite de {{limit}} mots.',
  oneMinute: '1 minute de lecture',
  minutesRead: '{{count}} minutes de lecture',
  
  // Version history
  versionNotFound: 'Version Non Trouvée',
  versionNotFoundDescription: 'La version demandée n\'a pas pu être trouvée',
  versionRestored: 'Version Restaurée',
  versionRestoredDescription: 'Version restaurée depuis {{time}}',
  restoreFailedTitle: 'Échec de la Restauration',
  restoreFailedDescription: 'Échec de la restauration de la version sélectionnée',
  versionDeleted: 'Version Supprimée',
  versionDeletedDescription: 'La version sélectionnée a été supprimée',
  historyCleared: 'Historique Effacé',
  historyClearedDescription: 'Tout l\'historique des versions a été effacé',
  initialVersion: 'Version Initiale',
  autoSavedVersion: 'Version Auto-enregistrée',
  
  // Status
  words: 'mots',
  characters: 'caractères',
  pages: 'pages',
  unsavedChanges: 'Modifications non enregistrées',
  saving: 'Enregistrement...',
  lastSaved: 'Dernière sauvegarde',
  
  // General
  loading: 'Chargement...',
  error: 'Erreur',
  retry: 'Réessayer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  delete: 'Supprimer',
  edit: 'Modifier',
  close: 'Fermer',
};

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
