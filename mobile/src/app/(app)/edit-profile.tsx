import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { api } from '@/api/client';
import type { AuthUser } from '@/api/types';
import { Card } from '@/components/card';
import { MemberPhoto } from '@/components/member-photo';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MARITAL = ['Single', 'Married', 'Widowed', 'Divorced'];

// Text fields keyed by profile field name.
type FieldKey =
  | 'name'
  | 'whatsapp'
  | 'email'
  | 'address'
  | 'dateOfBirth'
  | 'weddingAnniversary'
  | 'nativePlace'
  | 'gnati'
  | 'occupation'
  | 'occupationDetails'
  | 'officeAddress'
  | 'father'
  | 'mother'
  | 'spouse'
  | 'children'
  | 'siblings';

type FieldDef = {
  key: FieldKey;
  label: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  placeholder?: string;
};

const CONTACT_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Member Name', required: true, placeholder: 'Full name' },
  { key: 'whatsapp', label: 'WhatsApp Number', required: true, keyboardType: 'phone-pad', placeholder: '+91 …' },
  { key: 'email', label: 'Email ID', required: true, keyboardType: 'email-address', placeholder: 'you@example.com' },
  { key: 'address', label: 'Home Address', required: true, multiline: true, placeholder: 'House, street, area, city' },
];

const PERSONAL_FIELDS: FieldDef[] = [
  { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'e.g. 15 Aug 1980' },
  { key: 'weddingAnniversary', label: 'Wedding Anniversary', placeholder: 'e.g. 12 Feb 2005' },
  { key: 'nativePlace', label: 'Native Place (in Gujarat)', placeholder: 'e.g. Jamnagar' },
  { key: 'gnati', label: 'Gnati (Community)', placeholder: 'e.g. Lohana' },
];

const OCCUPATION_FIELDS: FieldDef[] = [
  { key: 'occupation', label: 'Occupation', placeholder: 'e.g. Business, Doctor' },
  { key: 'occupationDetails', label: 'Occupation Details', multiline: true, placeholder: 'Firm / role / details' },
  { key: 'officeAddress', label: 'Office Address', multiline: true, placeholder: 'Work address' },
];

const FAMILY_FIELDS: FieldDef[] = [
  { key: 'father', label: 'Father', placeholder: "Father's name" },
  { key: 'mother', label: 'Mother', placeholder: "Mother's name" },
  { key: 'spouse', label: 'Spouse', placeholder: "Spouse's name" },
  { key: 'children', label: 'Children', multiline: true, placeholder: 'Names (comma separated)' },
  { key: 'siblings', label: 'Siblings', multiline: true, placeholder: 'Names (comma separated)' },
];

const ALL_FIELDS = [...CONTACT_FIELDS, ...PERSONAL_FIELDS, ...OCCUPATION_FIELDS, ...FAMILY_FIELDS];

function initialForm(user: AuthUser): Record<FieldKey, string> {
  const form = {} as Record<FieldKey, string>;
  for (const f of ALL_FIELDS) form[f.key] = (user as Record<string, unknown>)[f.key] as string ?? '';
  return form;
}

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, updateUser, bumpPhoto } = useAuth();

  const [form, setForm] = useState<Record<FieldKey, string>>(() =>
    user ? initialForm(user) : ({} as Record<FieldKey, string>),
  );
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup ?? '');
  const [maritalStatus, setMaritalStatus] = useState(user?.maritalStatus ?? '');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(true); // assume until proven otherwise
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const set = (key: FieldKey, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to change your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setUploading(true);
    try {
      await api.updatePhoto(token, { contentType: asset.mimeType ?? 'image/jpeg', base64: asset.base64 });
      setPickedUri(asset.uri);
      setHasPhoto(true);
      bumpPhoto();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    // Compulsory validation.
    const missing: string[] = [];
    for (const f of CONTACT_FIELDS) {
      if (f.required && !form[f.key]?.trim()) missing.push(f.label);
    }
    if (!bloodGroup) missing.push('Blood Group');
    if (missing.length) {
      Alert.alert('Please complete required fields', `Missing: ${missing.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const patch: Record<string, string> = { bloodGroup, maritalStatus };
      for (const f of ALL_FIELDS) patch[f.key] = form[f.key]?.trim() ?? '';
      const updated = await api.updateProfile(token, patch);
      await updateUser(updated);
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: FieldDef) => (
    <View key={f.key} style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {f.label}
        {f.required ? <ThemedText style={{ color: '#DC2626' }}> *</ThemedText> : null}
      </ThemedText>
      <TextInput
        value={form[f.key]}
        onChangeText={(t) => set(f.key, t)}
        placeholder={f.placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={f.keyboardType}
        multiline={f.multiline}
        autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
        style={[
          styles.input,
          f.multiline && styles.inputMultiline,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
        ]}
      />
    </View>
  );

  return (
    <ScreenScroll>
      {/* Photo (required) */}
      <View style={styles.photoWrap}>
        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <MemberPhoto samajId={user.samajId} name={user.name} size={110} />
        )}
        <Pressable
          onPress={changePhoto}
          disabled={uploading}
          style={({ pressed }) => [
            styles.changeBtn,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          {uploading ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <Ionicons name="camera-outline" size={18} color={theme.tint} />
          )}
          <ThemedText type="small" style={{ color: theme.tint }}>
            {uploading ? 'Uploading…' : hasPhoto ? 'Change Photo' : 'Add Photo *'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Read-only identity */}
      <Card style={styles.form}>
        <ThemedText type="smallBold">Membership</ThemedText>
        <View style={styles.readonlyRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Membership No
          </ThemedText>
          <ThemedText type="smallBold">{user.samajId}</ThemedText>
        </View>
        <View style={styles.readonlyRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Mobile No (login)
          </ThemedText>
          <ThemedText type="smallBold">{user.phone || '—'}</ThemedText>
        </View>
      </Card>

      {/* Contact — required */}
      <Card style={styles.form}>
        <ThemedText type="smallBold">Contact Details</ThemedText>
        {CONTACT_FIELDS.map(renderField)}

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Blood Group<ThemedText style={{ color: '#DC2626' }}> *</ThemedText>
          </ThemedText>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((bg) => {
              const active = bg === bloodGroup;
              return (
                <Pressable
                  key={bg}
                  onPress={() => setBloodGroup(bg)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border },
                    active ? { backgroundColor: theme.tint, borderColor: theme.tint } : null,
                  ]}>
                  <ThemedText type="small" style={{ color: active ? '#fff' : theme.textSecondary }}>
                    {bg}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Personal — optional */}
      <Card style={styles.form}>
        <ThemedText type="smallBold">Personal (optional)</ThemedText>
        {PERSONAL_FIELDS.map(renderField)}
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Marital Status
          </ThemedText>
          <View style={styles.chipRow}>
            {MARITAL.map((m) => {
              const active = m === maritalStatus;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMaritalStatus(active ? '' : m)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border },
                    active ? { backgroundColor: theme.tint, borderColor: theme.tint } : null,
                  ]}>
                  <ThemedText type="small" style={{ color: active ? '#fff' : theme.textSecondary }}>
                    {m}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Occupation — optional */}
      <Card style={styles.form}>
        <ThemedText type="smallBold">Occupation (optional)</ThemedText>
        {OCCUPATION_FIELDS.map(renderField)}
      </Card>

      {/* Family — optional */}
      <Card style={styles.form}>
        <ThemedText type="smallBold">Family (optional)</ThemedText>
        {FAMILY_FIELDS.map(renderField)}
      </Card>

      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, { backgroundColor: theme.tint, opacity: pressed || saving ? 0.85 : 1 }]}>
        {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveText}>Save Profile</ThemedText>}
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  photoWrap: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  photo: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#00000010' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  form: { gap: Spacing.two },
  field: { gap: Spacing.one },
  readonlyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 46,
    alignItems: 'center',
  },
  saveBtn: {
    height: 52,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
