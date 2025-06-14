
import { EditorTheme } from '@/types/theme';

export const defaultThemes: EditorTheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      background: '#ffffff',
      text: '#1f2937',
      accent: '#3b82f6',
      border: '#e5e7eb',
      selection: '#dbeafe',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      background: '#1a1a1a',
      text: '#f9fafb',
      accent: '#60a5fa',
      border: '#374151',
      selection: '#1e3a8a',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: {
      background: '#f4f3e8',
      text: '#5c4b37',
      accent: '#92400e',
      border: '#d6d3d1',
      selection: '#fef3c7',
    },
    font: {
      family: 'Georgia, serif',
      size: '16px',
      lineHeight: '1.7',
    },
  },
  {
    id: 'focus',
    name: 'Focus Blue',
    colors: {
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#0ea5e9',
      border: '#cbd5e1',
      selection: '#e0f2fe',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: {
      background: '#fef7ed',
      text: '#9a3412',
      accent: '#ea580c',
      border: '#fed7aa',
      selection: '#ffedd5',
    },
    font: {
      family: 'Georgia, serif',
      size: '16px',
      lineHeight: '1.7',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#f0fdf4',
      text: '#14532d',
      accent: '#16a34a',
      border: '#bbf7d0',
      selection: '#dcfce7',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
];
