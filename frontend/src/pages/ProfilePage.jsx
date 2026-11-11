import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { profileApi } from '../api/client.js';
import { Alert, Avatar, Button, PageHeader, TextField } from '../components/UI.jsx';

const editableFields = ['first_name', 'last_name', 'profile_image', 'bio', 'location', 'timezone'];
const emptyForm = {
  first_name: '',
  last_name: '',
  profile_image: '',
  bio: '',
  location: '',
  timezone: '',
};

export function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    profileApi
      .get(token, { signal: controller.signal })
      .then((profile) => {
        updateUser(profile);
        setForm(Object.fromEntries(editableFields.map((field) => [field, profile[field] || ''])));
        setError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Your profile could not be loaded.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [token, updateUser]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    const changes = Object.fromEntries(editableFields.map((field) => [field, form[field].trim()]));
    try {
      const updatedProfile = await profileApi.update(token, changes);
      updateUser(updatedProfile);
      setForm(Object.fromEntries(editableFields.map((field) => [field, updatedProfile[field] || ''])));
      setNotice('Your profile has been saved.');
    } catch (requestError) {
      setError(requestError.message || 'Your changes could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Your profile"
        description="Give people a sense of who you are and what you hope to learn."
      />
      <section className="profile-section">
        <div className="profile-intro">
          <Avatar user={{ ...user, ...form }} size="large" />
          <div>
            <p className="eyebrow">Member since</p>
            <p className="profile-email">
              {user?.created_at
                ? new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
                    new Date(user.created_at),
                  )
                : '—'}
            </p>
            <p className="profile-role">{user?.email}</p>
          </div>
        </div>
        {error && <Alert>{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}
        {isLoading ? (
          <div className="inline-loading" role="status">Loading your details…</div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <TextField
                id="profile-first-name"
                name="first_name"
                label="First name"
                autoComplete="given-name"
                maxLength={150}
                required
                value={form.first_name}
                onChange={updateField}
              />
              <TextField
                id="profile-last-name"
                name="last_name"
                label="Last name"
                autoComplete="family-name"
                maxLength={150}
                required
                value={form.last_name}
                onChange={updateField}
              />
            </div>
            <TextField
              id="profile-email"
              label="Email address"
              type="email"
              value={user?.email || ''}
              readOnly
              hint="Email addresses can’t be changed here."
            />
            <TextField
              id="profile-image"
              name="profile_image"
              label="Profile image URL"
              type="url"
              maxLength={2048}
              value={form.profile_image}
              onChange={updateField}
              placeholder="https://"
            />
            <TextField
              id="profile-location"
              name="location"
              label="Location"
              autoComplete="address-level2"
              maxLength={255}
              value={form.location}
              onChange={updateField}
              placeholder="City, country"
            />
            <TextField
              id="profile-timezone"
              name="timezone"
              label="Timezone"
              maxLength={64}
              value={form.timezone}
              onChange={updateField}
              placeholder="e.g. Europe/London"
            />
            <TextField
              as="textarea"
              id="profile-bio"
              name="bio"
              label="A little about you"
              value={form.bio}
              onChange={updateField}
              rows={5}
              placeholder="What are you curious about? What would you like to share?"
            />
            <div className="form-actions">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
