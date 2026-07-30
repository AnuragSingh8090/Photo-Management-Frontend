// Theme utility - provides CSS variable-based classes

export const getThemeClasses = () => ({
  // Backgrounds
  bgPrimary: 'bg-[var(--bg-primary)]',
  bgSecondary: 'bg-[var(--bg-secondary)]',
  bgTertiary: 'bg-[var(--bg-tertiary)]',
  bgHover: 'hover:bg-[var(--bg-hover)]',
  
  // Text
  textPrimary: 'text-[var(--text-primary)]',
  textSecondary: 'text-[var(--text-secondary)]',
  textTertiary: 'text-[var(--text-tertiary)]',
  
  // Borders
  borderPrimary: 'border-[var(--border-primary)]',
  borderSecondary: 'border-[var(--border-secondary)]',
  borderHover: 'hover:border-[var(--border-hover)]',
  
  // Buttons
  btnBlue: 'bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white',
  btnBlueLight: 'bg-[var(--accent-blue-light)]',
})

// Inline styles for complex styling
export const themeStyles = {
  bgPrimary: { background: 'var(--bg-primary)' },
  bgSecondary: { background: 'var(--bg-secondary)' },
  bgTertiary: { background: 'var(--bg-tertiary)' },
  bgHover: { background: 'var(--bg-hover)' },
  
  textPrimary: { color: 'var(--text-primary)' },
  textSecondary: { color: 'var(--text-secondary)' },
  textTertiary: { color: 'var(--text-tertiary)' },
  
  borderPrimary: { borderColor: 'var(--border-primary)' },
  borderSecondary: { borderColor: 'var(--border-secondary)' },
  
  btnBlue: { 
    background: 'var(--accent-blue)',
    color: 'white'
  },
  btnBlueHover: { 
    background: 'var(--accent-blue-hover)',
    color: 'white'
  },
  
  shadow: { boxShadow: 'var(--shadow-sm)' },
}
