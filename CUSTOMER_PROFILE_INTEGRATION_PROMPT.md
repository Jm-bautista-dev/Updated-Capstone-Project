# Customer Mobile App — Personal Information & Password API Integration Prompt

> Copy-paste this entire document into your AI assistant or React Native / Expo project building the **Customer Mobile App** to ensure flawless profile and password synchronization.

---

## 1. Overview & API Contract

The backend exposes separated, protected REST endpoints under `auth:sanctum`:

| Endpoint | Method | Purpose | Payload |
|---|---|---|---|
| `/api/v1/user` | `GET` | Retrieve authenticated profile | *None* |
| `/api/v1/user` | `PATCH` *(or `PUT`, `POST`)* | Update customer personal info (Name, Phone) | `{ "name": "...", "phone": "..." }` |
| `/api/v1/user/password` | `PATCH` *(or `PUT`, `POST`)* | Change customer account password | `{ "current_password": "...", "password": "...", "password_confirmation": "..." }` |

---

## 2. TypeScript Types

```typescript
export interface UserProfile {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name: string;
  email: string;
  mobile_number?: string | null;
  phone?: string | null;
  role: 'customer' | 'rider' | 'admin' | 'cashier';
  branch_id?: number | null;
  branch_name?: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  mobile_number?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  success: boolean;
  message?: string;
  data?: T;
  user?: T;
  errors?: Record<string, string[]>;
}
```

---

## 3. Mobile API Service (Axios Example)

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://makidesuoperation.site/api/v1'; // Or your local API host

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach Sanctum Bearer Token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Profile & Password API calls
export const ProfileApi = {
  /**
   * Fetch current authenticated customer profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get<ApiResponse<UserProfile>>('/user');
    return res.data.data || res.data.user!;
  },

  /**
   * Update customer name and/or phone
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await api.patch<ApiResponse<UserProfile>>('/user', payload);
    return res.data.data || res.data.user!;
  },

  /**
   * Change customer password
   */
  updatePassword: async (payload: UpdatePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch<ApiResponse>('/user/password', payload);
    return {
      success: res.data.success,
      message: res.data.message || 'Password updated successfully.',
    };
  },
};
```

---

## 4. React Native / Expo Screen Implementation Example

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ProfileApi, UserProfile } from './services/ProfileApi';

export default function PersonalInformationScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field error messages
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfileApi.getProfile();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.mobile_number || data.phone || '');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  // ── SAVE PERSONAL INFO (Separate from Password) ──────────────────────────
  const handleSaveProfile = async () => {
    setProfileErrors({});
    if (!name.trim()) {
      setProfileErrors({ name: ['Name is required.'] });
      return;
    }

    try {
      setSavingProfile(true);
      const updatedUser = await ProfileApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
      });

      setProfile(updatedUser);
      Alert.alert('Success', 'Your personal information has been updated.');
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setProfileErrors(err.response.data.errors);
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // ── CHANGE PASSWORD (Separate from Personal Info) ────────────────────────
  const handleChangePassword = async () => {
    setPasswordErrors({});

    if (!currentPassword) {
      setPasswordErrors({ current_password: ['Current password is required.'] });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErrors({ password: ['New password must be at least 8 characters.'] });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    try {
      setSavingPassword(true);
      const res = await ProfileApi.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      // Clear password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success', res.message);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to update password.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E75480" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── PERSONAL INFORMATION CARD ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, profileErrors.name ? styles.inputError : null]}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
        />
        {profileErrors.name && <Text style={styles.errorText}>{profileErrors.name[0]}</Text>}

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, profileErrors.phone ? styles.inputError : null]}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 09123456789"
          keyboardType="phone-pad"
        />
        {profileErrors.phone && <Text style={styles.errorText}>{profileErrors.phone[0]}</Text>}

        <Text style={styles.label}>Email Address (Read-only)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={profile?.email || ''}
          editable={false}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── SECURITY & PASSWORD CARD ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={[styles.input, passwordErrors.current_password ? styles.inputError : null]}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />
        {passwordErrors.current_password && (
          <Text style={styles.errorText}>{passwordErrors.current_password[0]}</Text>
        )}

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[styles.input, passwordErrors.password ? styles.inputError : null]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Min 8 characters"
          secureTextEntry
        />
        {passwordErrors.password && (
          <Text style={styles.errorText}>{passwordErrors.password[0]}</Text>
        )}

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, passwordErrors.password_confirmation ? styles.inputError : null]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />
        {passwordErrors.password_confirmation && (
          <Text style={styles.errorText}>{passwordErrors.password_confirmation[0]}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleChangePassword}
          disabled={savingPassword}
        >
          {savingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#3D2C2E', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#7D6B6E', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#F8C8DC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3D2C2E',
    backgroundColor: '#FFF5F7',
  },
  inputDisabled: { backgroundColor: '#F0F0F0', color: '#888' },
  inputError: { borderColor: '#E53E3E' },
  errorText: { color: '#E53E3E', fontSize: 11, marginTop: 2 },
  button: {
    backgroundColor: '#E75480',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonSecondary: { backgroundColor: '#2D3748' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
```
