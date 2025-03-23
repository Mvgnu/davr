/**
 * Color system constants for Aluminum Recycling Germany
 * This file centralizes color definitions for consistent usage across the application
 */

// Primary green color palette
export const GREEN_COLORS = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
};

// Secondary blue color palette
export const BLUE_COLORS = {
  50: '#F0F9FF',
  100: '#E0F2FE',
  200: '#BAE6FD',
  300: '#7DD3FC',
  400: '#38BDF8',
  500: '#0EA5E9',
  600: '#0284C7',
  700: '#0369A1',
  800: '#075985',
  900: '#0C4A6E',
};

// Status colors
export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    hover: 'hover:bg-green-200',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    hover: 'hover:bg-yellow-200',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    hover: 'hover:bg-red-200',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-200',
  },
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-200',
  },
};

// Button styles
export const BUTTON_STYLES = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  tertiary: 'bg-green-100 text-green-800 hover:bg-green-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'text-gray-700 hover:bg-gray-100',
  link: 'text-green-600 hover:text-green-700 underline',
};

// Text colors
export const TEXT_COLORS = {
  primary: 'text-gray-900',
  secondary: 'text-gray-700',
  tertiary: 'text-gray-500',
  disabled: 'text-gray-400',
  accent: 'text-green-600',
  white: 'text-white',
};

// Forms
export const FORM_STYLES = {
  input: {
    default: 'border border-gray-300 rounded-lg',
    focus: 'focus:ring-green-500 focus:border-green-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
  },
  checkbox: 'text-green-600 focus:ring-green-500 border-gray-300 rounded',
  radio: 'text-green-600 focus:ring-green-500 border-gray-300',
};

// Gradients
export const GRADIENTS = {
  greenPrimary: 'bg-gradient-to-br from-green-700 via-green-600 to-green-500',
  greenLight: 'bg-gradient-to-br from-green-500 to-green-400',
  greenDark: 'bg-gradient-to-br from-green-800 to-green-700',
  blueAccent: 'bg-gradient-to-br from-blue-600 to-blue-500',
};

// Links
export const LINK_STYLES = {
  primary: 'text-green-600 hover:text-green-700',
  secondary: 'text-gray-500 hover:text-green-600',
  nav: 'text-gray-700 hover:text-green-600',
  footer: 'text-gray-400 hover:text-white',
};

// Background colors
export const BACKGROUND_COLORS = {
  page: 'bg-gray-50',
  card: 'bg-white',
  subtle: 'bg-gray-100',
  accent: 'bg-green-50',
};

// Border colors
export const BORDER_COLORS = {
  light: 'border-gray-100',
  default: 'border-gray-200',
  medium: 'border-gray-300',
  accent: 'border-green-500',
};

// Helper function to get Tailwind classes based on status
export function getStatusClasses(status: keyof typeof STATUS_COLORS): string {
  return `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text}`;
} 