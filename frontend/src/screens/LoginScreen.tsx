import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { colors, globalStyles, authStyles } from '../styles/styles';

export const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, register } = useAuth();
  const { showError, showWarning, showSuccess } = useAlert();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      showWarning('Please enter both email and password.', 'Missing Credentials');
      return;
    }

    if (!isLogin && !username.trim()) {
      showWarning('Please choose a username for your account.', 'Missing Username');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(trimmedEmail, trimmedPassword);
        showSuccess('Welcome back!', 'Signed In');
      } else {
        await register({
          username: username.trim(),
          email: trimmedEmail,
          password: trimmedPassword,
          phone_number: phoneNumber.trim() || undefined,
        });
        showSuccess('Your account has been created successfully.', 'Welcome');
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please check your credentials.';
      showError(errMsg, isLogin ? 'Login Failed' : 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={authStyles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.brandHeader}>
            <Text style={authStyles.title}>RideShare Ontario</Text>
            <Text style={authStyles.subtitle}>
              Reliable city-to-city and regional rides across Ontario
            </Text>
          </View>

          <View style={globalStyles.card}>
            <Text style={authStyles.formHeading}>
              {isLogin ? 'Sign In to Your Account' : 'Create an Account'}
            </Text>

            {!isLogin && (
              <>
                <Text style={globalStyles.label}>Username</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="e.g. driver_ontario"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </>
            )}

            <Text style={globalStyles.label}>Email Address</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="e.g. rider@domain.ca"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={globalStyles.label}>Password</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {!isLogin && (
              <>
                <Text style={globalStyles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </>
            )}

            <TouchableOpacity
              style={[globalStyles.primaryBtn, isSubmitting && globalStyles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={globalStyles.primaryBtnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={authStyles.toggleRow}>
            <Text style={authStyles.toggleText}>
              {isLogin
                ? "Don't have an account yet? "
                : 'Already registered? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={authStyles.toggleLink}>
                {isLogin ? 'Register' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};