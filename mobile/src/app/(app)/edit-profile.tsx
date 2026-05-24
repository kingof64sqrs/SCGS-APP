import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { MemberPhoto } from '@/components/member-photo';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function Field({
  label,
  value,
  onChangeText,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
} & Partial<React.ComponentProps<typeof TextInput>>) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
        placeholderTextColor={theme.textSecondary}
        {...rest}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, updateUser, bumpPhoto } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup ?? 'O+');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

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
      await api.updatePhoto(token, {
        contentType: asset.mimeType ?? 'image/jpeg',
        base64: asset.base64,
      });
      setPickedUri(asset.uri);
      bumpPhoto();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile(token, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        bloodGroup,
      });
      await updateUser(updated);
      router.back();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScroll>
      {/* Photo */}
      <View style={styles.photoWrap}>
        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <MemberPhoto samajId={user.samajId} name={user.name} size={110} />
        )}
        <Pressable
          onPress={changePhoto}
          disabled={uploading}
          style={({ pressed }) => [styles.changeBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          {uploading ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <Ionicons name="camera-outline" size={18} color={theme.tint} />
          )}
          <ThemedText type="small" style={{ color: theme.tint }}>
            {uploading ? 'Uploading…' : 'Change Photo'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Fields */}
      <Card style={styles.form}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Full name" />
        <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+91 …" keyboardType="phone-pad" />
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Address" multiline />

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Blood Group
          </ThemedText>
          <View style={styles.bloodRow}>
            {BLOOD_GROUPS.map((bg) => {
              const active = bg === bloodGroup;
              return (
                <Pressable
                  key={bg}
                  onPress={() => setBloodGroup(bg)}
                  style={[
                    styles.bloodPill,
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

      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, { backgroundColor: theme.tint, opacity: pressed || saving ? 0.85 : 1 }]}>
        {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveText}>Save Changes</ThemedText>}
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  bloodPill: {
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
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
