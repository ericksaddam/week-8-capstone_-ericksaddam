import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile, changeUserPassword, updateUserPreferences, deleteUserAccount } from '@/lib/userSettingsApi';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';

// Define a type for the user profile
interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
    };
    theme?: string;
    language?: string;
    timezone?: string;
  };
}

const Settings: React.FC = () => {
  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Appearance
  const [theme, setTheme] = useState('light');

  // System Preferences
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Africa/Nairobi');

    // Auth
  const { token, logout } = useAuth();

  // Loading state
  const [loading, setLoading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getUserProfile(token)
      .then((user: UserProfile) => {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
        if (user.preferences) {
          setEmailNotif(user.preferences.notifications?.email ?? true);
          setSmsNotif(user.preferences.notifications?.sms ?? false);
          setTheme(user.preferences.theme || 'light');
          setLanguage(user.preferences.language || 'en');
          setTimezone(user.preferences.timezone || 'Africa/Nairobi');
        }
      })
      .catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [token]);

  // Profile
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await updateUserProfile({ name, email, phone, bio }, token);
      toast({ title: 'Profile updated' });
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Profile update failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await changeUserPassword({ currentPassword, newPassword }, token);
      toast({ title: 'Password changed' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Password change failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Notifications
  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await updateUserPreferences({ notifications: { email: emailNotif, sms: smsNotif } }, token);
      toast({ title: 'Notification preferences updated' });
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Failed to update notifications', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Theme
  const handleThemeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await updateUserPreferences({ theme }, token);
      toast({ title: 'Theme updated' });
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Failed to update theme', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // System Preferences
  const handleSystemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await updateUserPreferences({ language, timezone }, token);
      toast({ title: 'System preferences updated' });
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Failed to update preferences', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    setLoading(true);
    try {
      await deleteUserAccount(token);
      toast({ title: 'Account deleted' });
      logout();
    } catch (error) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		toast({ title: 'Failed to delete account', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Profile completeness calculation (gamification)
  const completedFields = [name, email, phone, bio].filter(Boolean).length + (profilePic ? 1 : 0);
  const totalFields = 5;
  const profilePercent = Math.round((completedFields / totalFields) * 100);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-10">
        <div className="w-[90vw] max-w-5xl mx-auto bg-white dark:bg-muted rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden animate-fadein">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <span role="img" aria-label="settings">⚙️</span> Settings
          </h1>

        {/* Profile Completeness Bar */}
        <div style={{ margin: '16px 0 28px 0' }}>
          <div style={{ fontSize: 14, marginBottom: 4, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span role="img" aria-label="trophy">🏆</span> Profile completeness: <b>{profilePercent}%</b>
          </div>
          <div style={{ background: '#e2e8f0', borderRadius: 8, height: 8, width: '100%' }}>
            <div style={{ width: `${profilePercent}%`, background: profilePercent === 100 ? '#22c55e' : '#3b82f6', height: 8, borderRadius: 8, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Tabs UI */}
        <Tabs defaultValue="profile" onValueChange={() => {
          // Always refetch the latest profile on tab switch
          if (token) {
            getUserProfile(token).then((user: UserProfile) => {
              setName(user.name || '');
              setEmail(user.email || '');
              if (user.preferences) {
                setEmailNotif(user.preferences.notifications?.email ?? true);
                setSmsNotif(user.preferences.notifications?.sms ?? false);
                setTheme(user.preferences.theme || 'light');
                setLanguage(user.preferences.language || 'en');
                setTimezone(user.preferences.timezone || 'Africa/Nairobi');
              }
            });
          }
        }}>
          <TabsList style={{ marginBottom: 24 }}>
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
            <TabsTrigger value="security">🔒 Security</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
            <TabsTrigger value="appearance">🎨 Appearance</TabsTrigger>
            <TabsTrigger value="preferences">🛠️ Preferences</TabsTrigger>
            <TabsTrigger value="danger">⚠️ Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            {/* Profile Management */}
            <section style={{ marginBottom: 32 }}>
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 500 }}>
                  Name:
                  <input value={name} onChange={e => setName(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} />
                </label>
                <label style={{ fontWeight: 500 }}>
                  Email:
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} />
                </label>
                <label style={{ fontWeight: 500 }}>
                  Phone:
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} />
                </label>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'start', gap: 8 }}>
                  Bio:
                  <textarea value={bio} onChange={e => setBio(e.target.value)} style={{ flex: 1, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px', minHeight: '80px' }} />
                </label>
                <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                  Profile Picture:
                  <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
                  {profilePic && <img src={profilePic} alt="Profile preview" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #94a3b8', objectFit: 'cover', boxShadow: '0 2px 8px #e2e8f0' }} />}
                </label>
                <button type="submit" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px #e0e7ef', transition: 'background 0.3s' }}>Save Profile</button>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="security">
            {/* Security */}
            <section style={{ marginBottom: 32 }}>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label>Current Password: <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} /></label>
                <label>New Password: <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} /></label>
                <label>Confirm Password: <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }} /></label>
                <button type="submit" style={{ background: 'linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px #fde68a', transition: 'background 0.3s' }}>Change Password</button>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="notifications">
            {/* Notification Preferences */}
            <section style={{ marginBottom: 32 }}>
              <form onSubmit={handleNotificationsSave} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label><input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} style={{ marginRight: 8 }} /> Email Notifications</label>
                <label><input type="checkbox" checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} style={{ marginRight: 8 }} /> SMS Notifications</label>
                <button type="submit" style={{ background: 'linear-gradient(90deg, #10b981 0%, #22d3ee 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px #a7f3d0', transition: 'background 0.3s' }}>Save Preferences</button>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="appearance">
            {/* Appearance */}
            <section style={{ marginBottom: 32 }}>
              <form onSubmit={handleThemeChange} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontWeight: 500 }}>Theme:
                  <select value={theme} onChange={e => setTheme(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <button type="submit" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 16, marginLeft: 12, cursor: 'pointer', boxShadow: '0 2px 8px #c7d2fe', transition: 'background 0.3s' }}>Save Theme</button>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="preferences">
            {/* System Preferences */}
            <section style={{ marginBottom: 32 }}>
              <form onSubmit={handleSystemSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontWeight: 500 }}>Language:
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }}>
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </label>
                <label style={{ fontWeight: 500 }}>Timezone:
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, border: '1px solid #cbd5e1', padding: '6px 12px' }}>
                    <option value="Africa/Nairobi">Africa/Nairobi</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
                <button type="submit" style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px #bae6fd', transition: 'background 0.3s' }}>Save Preferences</button>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="danger">
            {/* Danger Zone */}
            <section style={{ marginBottom: 0 }}>
              <button style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, marginTop: 4, cursor: 'pointer', boxShadow: '0 2px 8px #fecaca', transition: 'background 0.3s' }} onClick={handleDeleteAccount}>Delete Account</button>
            </section>
          </TabsContent>
        </Tabs>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
    </div>
  );
};

export default Settings;
