// src/theme/theme.ts

// Base palette
const palette = {
    // neutrals light
    white: '#FFFFFF',
    neutral50: '#F9FAFB',
    neutral100: '#F5F5F5',
    neutral200: '#E5E5E5',
    neutral300: '#D4D4D4',
    neutral400: '#9CA3AF',
    neutral500: '#6B7280',
    neutral600: '#4B5563',
    neutral800: '#1F2933',
    neutral900: '#111827',

    // neutrals dark
    dark900: '#050509',
    dark800: '#0B0F16',
    dark700: '#111827',
    dark600: '#1F2933',
    darkSurface: '#16181D',
    darkSurfaceAlt: '#1E2027',

    // brand
    blue200: '#00D9FF',
    blue300: '#00BFFF',
    blue400: '#0099FF',
    blue500: '#007AFF',
    blue600: '#005FCC',
    blue700: '#004499',
    blue800: '#00337A',
    blue900: '#002255',
    red500: '#C62828',
    red100: '#FFEBEE',
    green500: '#4CAF50',
    amber500: '#FF9800',
    sky500: '#2196F3',
};

const baseTypography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },

    fontSize: {
        xs: 12,
        sm: 13,
        base: 15,
        md: 16,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
        '4xl': 36,
    },

    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    lineHeight: {
        tight: 20,
        normal: 24,
        relaxed: 28,
        loose: 44,
    },

    letterSpacing: {
        tight: -0.8,
        normal: -0.2,
        wide: -0.1,
    },

    heading1: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '600' as const,
    },
    heading2: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as const,
    },
};

const baseSpacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    screenPaddingHorizontal: 20,
    screenPaddingVertical: 20,
    sectionGap: 16,
};

const baseRadius = {
    sm: 6,
    base: 8,
    md: 12,
    lg: 14,
    xl: 16,
    '2xl': 20,
    full: 9999,
    card: 20,
    button: 16,
    input: 12,
    pill: 9999,
};

const baseShadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    base: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
};

// LIGHT THEME
export const lightTheme = {
    mode: 'light' as const,
    palette,
    colors: {
        primary: palette.blue600,
        primaryLight: palette.blue700,
        primaryDark: palette.blue800,

        background: palette.neutral50,
        backgroundSecondary: palette.white,
        backgroundTertiary: palette.neutral100,

        surface: palette.white,
        surfaceMuted: palette.neutral100,
        surfaceElevated: palette.white,

        text: palette.neutral900,
        textSecondary: palette.neutral600,
        textTertiary: palette.neutral400,
        textInverse: palette.white,
        textOnPrimary: palette.white,

        border: palette.neutral200,
        borderLight: palette.neutral100,
        borderDark: palette.neutral900,

        success: palette.green500,
        error: palette.red500,
        warning: palette.amber500,
        info: palette.sky500,

        errorBackground: palette.red100,

        disabled: palette.neutral200,
        disabledText: palette.neutral400,
        pressed: 'rgba(0, 0, 0, 0.06)',
        overlay: 'rgba(0, 0, 0, 0.5)',

        inputBackground: palette.neutral100,
        inputBorder: palette.neutral200,
        cardBackground: palette.white,
        tabBarBackground: palette.white,
        divider: palette.neutral200,
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borderRadius: baseRadius,
    shadows: baseShadows,
};

// DARK THEME
export const darkTheme = {
    mode: 'dark' as const,
    palette,
    colors: {
        primary: palette.blue500,
        primaryLight: palette.blue500,
        primaryDark: palette.blue600,

        background: palette.dark900,
        backgroundSecondary: palette.dark800,
        backgroundTertiary: palette.dark700,

        surface: palette.darkSurface,
        surfaceMuted: palette.darkSurfaceAlt,
        surfaceElevated: palette.darkSurfaceAlt,

        text: palette.white,
        textSecondary: palette.neutral300,
        textTertiary: palette.neutral500,
        textInverse: palette.dark900,
        textOnPrimary: palette.white,

        border: 'rgba(255,255,255,0.08)',
        borderLight: 'rgba(255,255,255,0.04)',
        borderDark: 'rgba(0,0,0,0.6)',

        success: palette.green500,
        error: palette.red500,
        warning: palette.amber500,
        info: palette.sky500,

        errorBackground: 'rgba(198,40,40,0.16)',

        disabled: 'rgba(255,255,255,0.12)',
        disabledText: 'rgba(255,255,255,0.4)',
        pressed: 'rgba(255,255,255,0.08)',
        overlay: 'rgba(0, 0, 0, 0.7)',

        inputBackground: palette.darkSurfaceAlt,
        inputBorder: 'rgba(255,255,255,0.12)',
        cardBackground: palette.darkSurface,
        tabBarBackground: palette.dark800,
        divider: 'rgba(255,255,255,0.08)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borderRadius: baseRadius,
    shadows: baseShadows, // you can tone these down later for dark
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark';
