import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'artist' | 'gallery' | 'collector' | null;

interface SignUpForm {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  orgName: string;
  city: string;
  country: string;
  website: string;
  instagram: string;
  bio: string;
  phone: string;
  avatarUrl: string;
  acceptedTerms: boolean;
}

export default function SetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SignUpForm>({
    fullName: '',
    email: '',
    password: '',
    role: null,
    orgName: '',
    city: '',
    country: '',
    website: '',
    instagram: '',
    bio: '',
    phone: '',
    avatarUrl: '',
    acceptedTerms: false,
  });

  // Define all steps
  const totalSteps = 12;
  const steps = [
    { key: 'fullName', required: true },
    { key: 'email', required: true },
    { key: 'password', required: true },
    { key: 'role', required: true },
    { key: 'orgName', required: false, conditional: () => !!form.role },
    { key: 'city', required: true },
    { key: 'country', required: true },
    { key: 'phone', required: false },
    { key: 'bio', required: false },
    { key: 'website', required: false },
    { key: 'instagram', required: false },
    { key: 'acceptedTerms', required: true },
  ];

  // Get current step info
  const currentStep = steps[step - 1];
  const isConditionalStep = currentStep.conditional && !currentStep.conditional();

  // Skip conditional steps that don't apply
  const getNextStep = (current: number): number => {
    let next = current + 1;
    while (next <= totalSteps) {
      const stepInfo = steps[next - 1];
      if (stepInfo.conditional && !stepInfo.conditional()) {
        next++;
      } else {
        break;
      }
    }
    return next;
  };

  const getPrevStep = (current: number): number => {
    let prev = current - 1;
    while (prev >= 1) {
      const stepInfo = steps[prev - 1];
      if (stepInfo.conditional && !stepInfo.conditional()) {
        prev--;
      } else {
        break;
      }
    }
    return prev;
  };

  const handleChange = (key: keyof SignUpForm, value: string | boolean | Role) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    const next = getNextStep(step);
    if (next > totalSteps) {
      await handleSubmit();
    } else {
      setStep(next);
      setError(null); // Clear error when moving to next step
    }
  };

  const handleSubmit = async () => {
    if (!canContinue()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.fullName,
            full_name: form.fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Ensure we have a session before creating profile (needed for RLS)
      if (!authData.session) {
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        // Try to get the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session not established. Please try again.');
        }
      }

      // Step 2: Map role to user_type (lowercase to match database constraint)
      const userTypeMap: Record<string, string> = {
        artist: 'artist',
        gallery: 'gallery',
        collector: 'collector',
      };
      const userType = form.role ? userTypeMap[form.role] || 'artist' : 'artist';

      // Step 3: Prepare profile data for user_profiles table
      const location = form.city && form.country
        ? `${form.city}, ${form.country}`
        : form.city || form.country || null;

      const profileData = {
        id: authData.user.id,
        email: form.email,
        full_name: form.fullName || null,
        user_type: userType || null,
        location: location || null,
        website: form.website || null,
        instagram: form.instagram || null,
        bio: form.bio || null,
        phone: form.phone || null,
        avatar_url: form.avatarUrl || null,
      };

      // Step 4: Create profile in user_profiles table
      // Use insert for new profiles (upsert can have RLS issues during signup)
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (userProfilesError) {
        // If insert fails due to duplicate, try update instead
        if (userProfilesError.code === '23505' || userProfilesError.message.includes('duplicate')) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('id', authData.user.id);

          if (updateError) {
            throw new Error(`Failed to create profile: ${updateError.message}`);
          }
        } else {
          throw new Error(`Failed to create profile: ${userProfilesError.message}`);
        }
      }

      // Step 5: Navigate to home
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      Alert.alert(
        'Setup Failed',
        err.message || 'Failed to create account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinue = () => {
    const stepInfo = steps[step - 1];
    if (!stepInfo) return false;

    if (stepInfo.required) {
      if (stepInfo.key === 'fullName') {
        return !!form.fullName.trim();
      }
      if (stepInfo.key === 'email') {
        return !!form.email.trim();
      }
      if (stepInfo.key === 'password') {
        return form.password.length >= 6;
      }
      if (stepInfo.key === 'role') {
        return !!form.role;
      }
      if (stepInfo.key === 'city') {
        return !!form.city.trim();
      }
      if (stepInfo.key === 'country') {
        return !!form.country.trim();
      }
      if (stepInfo.key === 'acceptedTerms') {
        return form.acceptedTerms;
      }
      // Optional fields can always continue
      if (stepInfo.key === 'phone' || stepInfo.key === 'bio' || stepInfo.key === 'website' || stepInfo.key === 'instagram') {
        return true;
      }
    }
    return true; // Optional fields can always continue
  };

  const roleLabel =
    form.role === 'gallery'
      ? 'Gallery name'
      : form.role === 'collector'
        ? 'Collection / Organization name (optional)'
        : 'Studio name (optional)';

  const getStepHeading = () => {
    switch (step) {
      case 1:
        return { heading: "What's your name?", subheading: "We'll use this to personalize your Aether experience." };
      case 2:
        return { heading: "What's your email?", subheading: "We'll use this to sign you in and send important updates." };
      case 3:
        return { heading: "Create a password", subheading: "Choose a secure password with at least 6 characters." };
      case 4:
        return { heading: "How do you use Aether?", subheading: "Choose the role that best describes you. You can change this later." };
      case 5:
        return { heading: roleLabel, subheading: "This helps others find and connect with you." };
      case 6:
        return { heading: "What city are you in?", subheading: "This helps us tailor certificates and features to your region." };
      case 7:
        return { heading: "What country are you in?", subheading: "This helps us provide region-specific features." };
      case 8:
        return { heading: "What's your phone number?", subheading: "Share your phone number so others can reach you. (optional)" };
      case 9:
        return { heading: "Tell us about yourself", subheading: "Write a short bio to help others learn more about you. (optional)" };
      case 10:
        return { heading: "What's your website?", subheading: "Share your website so others can learn more about you. (optional)" };
      case 11:
        return { heading: "What's your Instagram?", subheading: "Share your social handle so others can connect. (optional)" };
      case 12:
        return { heading: "Almost done!", subheading: "Please review and accept our terms to continue." };
      default:
        return { heading: "", subheading: "" };
    }
  };

  const { heading, subheading } = getStepHeading();

  const renderStepContent = () => {
    switch (step) {
      case 1: // Full name
        return (
          <View style={styles.card}>
            <Input
              value={form.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              placeholder="e.g., Rashod Korala"
              autoCapitalize="words"
              autoFocus
            />
          </View>
        );

      case 2: // Email
        return (
          <View style={styles.card}>
            <Input
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        );

      case 3: // Password
        return (
          <View style={styles.card}>
            <Input
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              placeholder="At least 6 characters"
              secureTextEntry
              autoFocus
            />
          </View>
        );

      case 4: // Role
        return (
          <View>
            <RolePill
              label="I'm an artist"
              active={form.role === 'artist'}
              onPress={() => handleChange('role', 'artist')}
              description="Manage your works, collections, and certificates."
              index={0}
            />

            <RolePill
              label="I run a gallery or studio"
              active={form.role === 'gallery'}
              onPress={() => handleChange('role', 'gallery')}
              description="Organize exhibitions, collections, and artists."
              index={1}
            />

            <RolePill
              label="I'm a collector"
              active={form.role === 'collector'}
              onPress={() => handleChange('role', 'collector')}
              description="Track provenance and verify authenticity."
              index={2}
            />
          </View>
        );

      case 5: // Org name
        return (
          <View style={styles.card}>
            <Input
              value={form.orgName}
              onChangeText={(text) => handleChange('orgName', text)}
              placeholder={
                form.role === 'gallery'
                  ? 'Aurora Art Gallery'
                  : form.role === 'collector'
                    ? 'Optional'
                    : 'e.g., Studio Korala (optional)'
              }
              autoFocus
            />
          </View>
        );

      case 6: // City
        return (
          <View style={styles.card}>
            <Input
              value={form.city}
              onChangeText={(text) => handleChange('city', text)}
              placeholder="e.g., St. John's"
              autoFocus
            />
          </View>
        );

      case 7: // Country
        return (
          <View style={styles.card}>
            <Input
              value={form.country}
              onChangeText={(text) => handleChange('country', text)}
              placeholder="e.g., Canada"
              autoFocus
            />
          </View>
        );

      case 8: // Phone
        return (
          <View style={styles.card}>
            <Input
              value={form.phone}
              onChangeText={(text) => handleChange('phone', text)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              autoFocus
            />
          </View>
        );

      case 9: // Bio
        return (
          <View style={styles.card}>
            <Input
              value={form.bio}
              onChangeText={(text) => handleChange('bio', text)}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
          </View>
        );

      case 10: // Website
        return (
          <View style={styles.card}>
            <Input
              value={form.website}
              onChangeText={(text) => handleChange('website', text)}
              placeholder="https://yourstudio.com"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        );

      case 11: // Instagram
        return (
          <View style={styles.card}>
            <Input
              value={form.instagram}
              onChangeText={(text) => handleChange('instagram', text)}
              placeholder="@yourhandle"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        );

      case 12: // Terms
        return (
          <View>
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => handleChange('acceptedTerms', !form.acceptedTerms)}
              activeOpacity={0.7}
            >
              <AnimatedCheckbox checked={form.acceptedTerms} />
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // Get visible step index (for stepper display)
  const getVisibleStepIndex = () => {
    let visibleCount = 0;
    for (let i = 0; i < step; i++) {
      const stepInfo = steps[i];
      if (stepInfo.conditional && !stepInfo.conditional()) continue;
      visibleCount++;
    }
    return visibleCount;
  };

  const getTotalVisibleSteps = () => {
    return steps.filter((s) => !(s.conditional && !s.conditional())).length;
  };

  const visibleStepIndex = getVisibleStepIndex();
  const totalVisibleSteps = getTotalVisibleSteps();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Stepper */}
            <View style={styles.stepper}>
              {Array.from({ length: totalVisibleSteps }, (_, i) => i + 1).map((s) => {
                const isActive = visibleStepIndex === s;
                const isCompleted = visibleStepIndex > s;

                return (
                  <View key={s} style={styles.stepperItem}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          width: isActive ? 32 : 8,
                          opacity: isCompleted || isActive ? 1 : 0.3,
                          backgroundColor: isCompleted || isActive ? theme.colors.primary : theme.colors.backgroundTertiary,
                        },
                      ]}
                    />
                    {s < totalVisibleSteps && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            opacity: isCompleted ? 1 : 0.3,
                            backgroundColor: isCompleted ? theme.colors.primary : theme.colors.backgroundTertiary,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Big conversational heading */}
            <View key={`heading-${step}`}>
              <Text style={styles.heading}>{heading}</Text>
              <Text style={styles.subheading}>{subheading}</Text>
            </View>

            {/* Single question input */}
            {renderStepContent()}

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* One primary action - big Continue button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!canContinue() || isSubmitting) && styles.continueButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canContinue() || isSubmitting}
                activeOpacity={0.9}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.continueButtonText,
                      (!canContinue() || isSubmitting) && { opacity: 0.5 },
                    ]}
                  >
                    {step < totalSteps ? 'Continue' : 'Create account'}
                  </Text>
                )}
              </TouchableOpacity>

              {step > 1 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(getPrevStep(step))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Checkbox Component
const AnimatedCheckbox = ({ checked }: { checked: boolean }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <View
      style={[
        styles.checkbox,
        {
          backgroundColor: checked ? theme.colors.primary : theme.colors.background,
          borderColor: theme.colors.primary,
        },
      ]}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
};

// Helper Components
const Label = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const Input = (props: React.ComponentProps<typeof TextInput>) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.inputContainer}>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textTertiary}
        style={styles.input}
      />
    </View>
  );
};

const RolePill = ({
  label,
  description,
  active,
  onPress,
  index,
}: {
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
  index: number;
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <View
      style={[
        styles.rolePill,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.background,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.rolePillTouchable}
      >
        <View style={styles.rolePillContent}>
          <Text
            style={[
              styles.rolePillLabel,
              { color: active ? theme.colors.textInverse : theme.colors.text },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.rolePillDescription,
              { color: active ? theme.colors.backgroundTertiary : theme.colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
        <View
          style={[
            styles.roleRadio,
            {
              borderColor: active ? theme.colors.textInverse : theme.colors.border,
              backgroundColor: active ? theme.colors.textInverse : 'transparent',
            },
          ]}
        >
          {active && <View style={styles.roleRadioInner} />}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing['2xl'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    // Handled by Moti
  },
  stepLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
  },
  stepLineActive: {
    // Handled by Moti
  },
  heading: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: theme.typography.letterSpacing.tight,
    lineHeight: theme.typography.lineHeight.loose,
  },
  subheading: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['3xl'],
    lineHeight: theme.typography.lineHeight.normal,
  },
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius['2xl'],
    marginBottom: theme.spacing['2xl'],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  labelSpacing: {
    marginTop: theme.spacing.xl,
  },
  optionalText: {
    color: theme.colors.textTertiary,
    fontWeight: theme.typography.fontWeight.normal,
  },
  inputContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderStyle: 'solid',
  },
  input: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
    minHeight: 20,
  },
  rolePill: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rolePillTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rolePillContent: {
    flex: 1,
  },
  rolePillLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  rolePillDescription: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.tight,
  },
  roleRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  orgNameContainer: {
    marginTop: theme.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  checkmark: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  termsText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    lineHeight: 22,
  },
  termsLink: {
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  continueButtonText: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.lg,
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
  },
});
