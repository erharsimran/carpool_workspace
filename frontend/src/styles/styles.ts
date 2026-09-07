// src/styles/styles.ts
import { StyleSheet, Platform } from 'react-native';

// --- DESIGN TOKENS ---
export const colors = {
    primary: '#E05A47',
    primaryDark: '#C94A38',
    primaryLight: '#FDF0EB',
    buttonDark: '#1E2C48',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    inputBg: '#F8FAFC',
    border: '#E2E8F0',

    text: {
        primary: '#111827',
        secondary: '#4B5563',
        muted: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    status: {
        success: '#10B981',
        successBg: '#ECFDF5',
        warning: '#F59E0B',
        warningBg: '#FFFBEB',
        danger: '#EF4444',
        dangerBg: '#FEF2F2',
        info: '#3B82F6',
        infoBg: '#EFF6FF',
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const radius = {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
};

// --- SHARED / GLOBAL STYLES ---
export const globalStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenContainer: {
        flex: 1,
        padding: spacing.md,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
            : {
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            }),
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 14,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: colors.text.inverse,
        fontSize: 15,
        fontWeight: '700',
    },
    outlineBtn: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineBtnText: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});

// --- TOP APP HEADER STYLES ---
export const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'android' ? 12 : 6,
        paddingBottom: 10,
        backgroundColor: colors.surface,
    },
    leftSpacer: {
        width: 38,
    },
    logoText: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.primary,
        letterSpacing: -0.5,
    },
    profileAvatarBtn: {
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.buttonDark,
    },
    verifiedBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#38BDF8',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    verifiedBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
});

// --- HERO / BANNER STYLES ---
export const heroStyles = StyleSheet.create({
    bannerCard: {
        backgroundColor: '#FDF1EC',
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.buttonDark,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 6,
    },
    linkText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#F3D5C8',
    },
    iconEmoji: {
        fontSize: 26,
    },
});

// --- FORM SEARCH & SWAP STYLES ---
export const searchFormStyles = StyleSheet.create({
    inputContainer: {
        position: 'relative',
        marginBottom: spacing.sm,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 48,
        marginBottom: 8,
    },
    fieldIcon: {
        marginRight: spacing.sm,
        fontSize: 14,
        color: colors.text.secondary,
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: colors.text.primary,
        paddingVertical: 0,
    },
    clearBtn: {
        padding: 4,
    },
    clearText: {
        fontSize: 14,
        color: colors.text.muted,
    },
    swapBtn: {
        position: 'absolute',
        right: 14,
        top: 36,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    swapText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.buttonDark,
    },
    darkSearchBtn: {
        backgroundColor: colors.buttonDark,
        borderRadius: radius.md,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    darkSearchBtnText: {
        color: colors.text.inverse,
        fontSize: 15,
        fontWeight: '700',
    },
});

// --- POPULAR ROUTES LIST STYLES ---
export const routeListStyles = StyleSheet.create({
    itemRow: {
        paddingVertical: 14,
        paddingHorizontal: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.buttonDark,
    },
});

// --- AUTH / LOGIN STYLES ---
export const authStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },
    brandHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    formHeading: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    toggleText: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    toggleLink: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
});

// --- SEARCH & RIDES LIST STYLES ---
export const searchStyles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    suggestionBox: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    suggestionItem: {
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    suggestionText: {
        fontSize: 13,
        color: colors.text.primary,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    routeBox: {
        flex: 1,
        marginRight: spacing.sm,
    },
    originText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
    },
    routeArrow: {
        fontSize: 13,
        color: colors.text.muted,
        marginVertical: 2,
    },
    destinationText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
    },
    priceAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
        textAlign: 'right',
    },
    priceUnit: {
        fontSize: 11,
        color: colors.text.muted,
        textAlign: 'right',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: spacing.xs,
    },
    metaText: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    driverInfo: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    notes: {
        fontSize: 12,
        color: colors.text.muted,
        fontStyle: 'italic',
        marginTop: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});

// --- BOOKING MODAL STYLES ---
export const bookingModalStyles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        zIndex: 100,
    },
    modalCard: {
        maxWidth: 440,
        width: '100%',
        alignSelf: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    modalRoute: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    modalMeta: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    counterBtnText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text.primary,
    },
    counterValue: {
        fontSize: 16,
        fontWeight: '700',
        marginHorizontal: spacing.lg,
        color: colors.text.primary,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    fareLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    fareAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
    },
    cancellationNotice: {
        backgroundColor: colors.status.warningBg,
        borderColor: colors.status.warning,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    cancellationNoticeText: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 15,
    },
    buttonRow: {
        flexDirection: 'row',
    },
});

// --- TRIP FORM & MANAGEMENT STYLES ---
export const tripStyles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: -4,
    },
    col: {
        flex: 1,
        paddingHorizontal: 4,
    },
});

// --- BOOKING SCREEN STYLES ---
export const bookingStyles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.full,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    badgeConfirmed: {
        backgroundColor: colors.status.successBg,
        borderColor: colors.status.success,
    },
    badgeCancelled: {
        backgroundColor: colors.status.dangerBg,
        borderColor: colors.status.danger,
    },
    badgeCompleted: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
    },
    lockNotice: {
        backgroundColor: colors.status.warningBg,
        borderColor: colors.status.warning,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginTop: spacing.sm,
    },
    lockNoticeText: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 15,
    },
    cancelBtn: {
        backgroundColor: colors.status.dangerBg,
        borderWidth: 1,
        borderColor: colors.status.danger,
        borderRadius: radius.md,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    cancelBtnText: {
        color: colors.status.danger,
        fontSize: 14,
        fontWeight: '700',
    },
});

// --- PROFILE & VEHICLE STYLES ---
export const profileStyles = StyleSheet.create({
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
        alignSelf: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text.primary,
        textAlign: 'center',
    },
    userEmail: {
        fontSize: 13,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    tabRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: {
        borderBottomColor: colors.primary,
    },
    tabBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    tabBtnTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    logoutBtn: {
        borderWidth: 1,
        borderColor: colors.status.danger,
        backgroundColor: colors.status.dangerBg,
        borderRadius: radius.md,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
    },
    logoutBtnText: {
        color: colors.status.danger,
        fontSize: 14,
        fontWeight: '700',
    },
    dangerOutlineBtn: {
        borderWidth: 1,
        borderColor: colors.status.danger,
        borderRadius: radius.md,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    dangerOutlineBtnText: {
        color: colors.status.danger,
        fontSize: 13,
        fontWeight: '700',
    },
});