// src/theme/theme.ts

// Base palette
const palette = {
    // core neutrals
    white: '#FFFFFF',
    offWhite: '#FAFAFA',
    neutral50: '#F9FAFB',
    neutral100: '#F5F5F5',
    neutral200: '#E5E5E5',
    neutral300: '#D4D4D4',
    neutral400: '#9CA3AF',
    neutral500: '#6B7280',
    neutral600: '#4B5563',
    neutral800: '#1F2933',
    neutral900: '#111827',
    black: '#000000',

    // your palette
    palladian: '#EEE9DF',
    oatmeal: '#C9C1B1',
    blueFantastic: '#2C3B4D',
    burningFlame: '#FFB162',
    truffleTrouble: '#A35139',
    abyssalAnchorfishBlue: '#1B2632',

    // near-black shades
    trueBlack: '#000000',
    nearBlack: '#0A0A0A',
    darkGray: '#121212',
    darkGray2: '#1A1A1A',
    darkGray3: '#212121',

    // system feedback
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
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    base: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
};

// LIGHT THEME - Enhanced
export const lightTheme = {
    mode: 'light' as const,
    palette,
    colors: {
        // brand intent
        primary: palette.truffleTrouble,
        primaryLight: palette.burningFlame,
        primaryDark: palette.truffleTrouble,

        // accents
        secondary: palette.burningFlame,
        accent: palette.blueFantastic,

        // backgrounds - cleaner, brighter
        background: palette.white,
        backgroundSecondary: palette.neutral50,
        backgroundTertiary: palette.neutral100,

        // surfaces
        surface: palette.white,
        surfaceMuted: palette.neutral50,
        surfaceElevated: palette.white,

        // text
        text: palette.nearBlack,
        textSecondary: 'rgba(10, 10, 10, 0.65)',
        textTertiary: 'rgba(10, 10, 10, 0.45)',
        textInverse: palette.white,
        textOnPrimary: palette.white,

        // borders
        border: 'rgba(10, 10, 10, 0.10)',
        borderLight: 'rgba(10, 10, 10, 0.06)',
        borderDark: 'rgba(10, 10, 10, 0.20)',

        // feedback
        success: palette.green500,
        error: palette.red500,
        warning: palette.amber500,
        info: palette.blueFantastic,
        errorBackground: palette.red100,

        // states
        disabled: 'rgba(10, 10, 10, 0.06)',
        disabledText: 'rgba(10, 10, 10, 0.35)',
        pressed: 'rgba(10, 10, 10, 0.08)',
        overlay: 'rgba(0, 0, 0, 0.50)',

        // components
        inputBackground: palette.white,
        inputBorder: 'rgba(10, 10, 10, 0.12)',
        cardBackground: palette.white,
        tabBarBackground: palette.white,
        divider: 'rgba(10, 10, 10, 0.08)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borderRadius: baseRadius,
    shadows: baseShadows,
};

// DARK THEME - Near-Black Version
export const darkTheme = {
    mode: 'dark' as const,
    palette,
    colors: {
        // brand intent
        primary: palette.burningFlame,
        primaryLight: palette.burningFlame,
        primaryDark: palette.truffleTrouble,

        // accents
        secondary: palette.truffleTrouble,
        accent: palette.burningFlame,

        // backgrounds - much darker, near-black
        background: palette.nearBlack,
        backgroundSecondary: palette.darkGray,
        backgroundTertiary: palette.darkGray2,

        // surfaces - subtle elevation on dark
        surface: 'rgba(255, 255, 255, 0.04)',
        surfaceMuted: 'rgba(255, 255, 255, 0.02)',
        surfaceElevated: palette.darkGray3,

        // text
        text: palette.palladian,
        textSecondary: 'rgba(238, 233, 223, 0.75)',
        textTertiary: 'rgba(238, 233, 223, 0.50)',
        textInverse: palette.nearBlack,
        textOnPrimary: palette.nearBlack,

        // borders - subtle on dark
        border: 'rgba(255, 255, 255, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.04)',
        borderDark: 'rgba(255, 255, 255, 0.12)',

        // feedback
        success: palette.green500,
        error: '#EF5350',
        warning: palette.amber500,
        info: palette.burningFlame,
        errorBackground: 'rgba(239, 83, 80, 0.15)',

        // states
        disabled: 'rgba(255, 255, 255, 0.06)',
        disabledText: 'rgba(238, 233, 223, 0.35)',
        pressed: 'rgba(255, 255, 255, 0.08)',
        overlay: 'rgba(0, 0, 0, 0.85)',

        // components
        inputBackground: 'rgba(255, 255, 255, 0.04)',
        inputBorder: 'rgba(255, 255, 255, 0.08)',
        cardBackground: 'rgba(255, 255, 255, 0.03)',
        tabBarBackground: palette.trueBlack,
        divider: 'rgba(255, 255, 255, 0.06)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borderRadius: baseRadius,
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.5,
            shadowRadius: 2,
            elevation: 1,
        },
        base: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 3,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.7,
            shadowRadius: 10,
            elevation: 5,
        },
    },
};

export type Theme = typeof lightTheme | typeof darkTheme;
export type ThemeMode = 'light' | 'dark';