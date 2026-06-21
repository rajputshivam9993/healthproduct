import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { radius, spacing, type Palette } from '../theme';
import { usePalette, useThemedStyles } from '../theme/theme-context';

export type AppModalType = 'success' | 'error' | 'warning' | 'info';

export interface AppModalButton {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
}

export interface AppModalOptions {
  type?: AppModalType;
  title: string;
  message?: string;
  buttons?: AppModalButton[];
  /** Tap-outside / back-button dismiss. Default true. */
  dismissable?: boolean;
}

interface AppModalProps extends AppModalOptions {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Reusable themed dialog that pops in from the centre (scale + fade). Drop it in
 * any project: render <AppModal .../> directly, or use the AppModalProvider +
 * useAppModal() hook for one-line imperative alerts (see below).
 */
export function AppModal({
  visible,
  type = 'info',
  title,
  message,
  buttons,
  dismissable = true,
  onDismiss,
}: AppModalProps) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const [mounted, setMounted] = useState(visible);

  // Backdrop fades; the card springs up from 0.85 scale for a "pop".
  const backdrop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdrop.setValue(0);
      scale.setValue(0.85);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      // Animate out, then unmount.
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 160, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const palette: Record<AppModalType, { color: string; Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }> }> = {
    success: { color: c.success, Icon: CheckCircle2 },
    error: { color: c.danger, Icon: XCircle },
    warning: { color: '#F59E0B', Icon: AlertTriangle },
    info: { color: c.primary, Icon: Info },
  };
  const { color, Icon } = palette[type];
  const btns = buttons && buttons.length > 0 ? buttons : [{ label: 'OK', variant: 'primary' as const }];

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onRequestClose={() => dismissable && onDismiss()}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismissable && onDismiss()} />

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale }] }]}>
          <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
            <Icon color={color} size={30} strokeWidth={2.2} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.btnRow, btns.length === 1 && styles.btnRowSingle]}>
            {btns.map((b, i) => {
              const isPrimary = (b.variant ?? 'primary') === 'primary';
              const isDanger = b.variant === 'danger';
              const solid = isPrimary || isDanger;
              const bg = isDanger ? c.danger : isPrimary ? color : 'transparent';
              return (
                <ModalButton
                  key={`${b.label}-${i}`}
                  label={b.label}
                  solid={solid}
                  bg={bg}
                  onPress={b.onPress}
                />
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** A single dialog button with a press-scale bounce. */
function ModalButton({ label, solid, bg, onPress }: { label: string; solid: boolean; bg: string; onPress?: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const press = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={styles.btnFlex}
      onPress={onPress}
      onPressIn={() => Animated.spring(press, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[
          styles.btn,
          solid ? { backgroundColor: bg } : styles.btnGhost,
          { transform: [{ scale: press }] },
        ]}
      >
        <Text style={[styles.btnText, solid ? styles.btnTextSolid : styles.btnTextGhost]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/* ===========================================================================
   Imperative API — wrap the app in <AppModalProvider> once, then anywhere:
     const { showAlert, showConfirm } = useAppModal();
     showAlert({ type: 'success', title: 'Saved', message: 'All done.' });
   =========================================================================== */

interface ConfirmOptions {
  type?: AppModalType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppModalContextValue {
  showAlert: (opts: AppModalOptions) => void;
  showConfirm: (opts: ConfirmOptions) => void;
  hide: () => void;
}

const AppModalContext = createContext<AppModalContextValue | null>(null);

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<AppModalOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const hide = useCallback(() => setVisible(false), []);

  const showAlert = useCallback((o: AppModalOptions) => {
    setOpts(o);
    setVisible(true);
  }, []);

  const showConfirm = useCallback((o: ConfirmOptions) => {
    setOpts({
      type: o.type ?? 'warning',
      title: o.title,
      message: o.message,
      buttons: [
        { label: o.cancelLabel ?? 'Cancel', variant: 'ghost', onPress: o.onCancel },
        { label: o.confirmLabel ?? 'Confirm', variant: o.danger ? 'danger' : 'primary', onPress: o.onConfirm },
      ],
    });
    setVisible(true);
  }, []);

  // Each button closes the modal first, then runs its action.
  const buttons = (opts?.buttons ?? [{ label: 'OK', variant: 'primary' as const }]).map((b) => ({
    ...b,
    onPress: () => {
      hide();
      b.onPress?.();
    },
  }));

  return (
    <AppModalContext.Provider value={{ showAlert, showConfirm, hide }}>
      {children}
      <AppModal
        visible={visible}
        type={opts?.type}
        title={opts?.title ?? ''}
        message={opts?.message}
        buttons={buttons}
        dismissable={opts?.dismissable ?? true}
        onDismiss={hide}
      />
    </AppModalContext.Provider>
  );
}

export function useAppModal(): AppModalContextValue {
  const ctx = useContext(AppModalContext);
  if (!ctx) throw new Error('useAppModal must be used within an <AppModalProvider>');
  return ctx;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,10,40,0.45)' },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: c.background,
      borderRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    title: { fontSize: 18, fontWeight: '700', color: c.text, textAlign: 'center' },
    message: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
    btnRowSingle: { justifyContent: 'center' },
    btnFlex: { flex: 1 },
    btn: { height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    btnGhost: { backgroundColor: c.primaryMuted },
    btnText: { fontSize: 14.5, fontWeight: '700' },
    btnTextSolid: { color: '#fff' },
    btnTextGhost: { color: c.text },
  });
