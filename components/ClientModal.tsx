'use client';

import { useState, useEffect } from 'react';

const BASE_URL = 'https://builderpulse-app-production.up.railway.app';

interface Client {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  pm_name: string | null;
  package: string;
  ga4_property_id: string | null;
  gsc_site_url: string | null;
  meta_ad_account_id: string | null;
  ghl_location_id: string | null;
  google_business_id: string | null;
  auto_send_reports?: boolean;
  report_email?: string | null;
  portal_enabled?: boolean;
  portal_token?: string | null;
  client_login_enabled?: boolean;
}

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
}

export default function ClientModal({ client, onClose }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    pm_name: '',
    package: 'essentials',
    ga4_property_id: '',
    gsc_site_url: '',
    meta_ad_account_id: '',
    ghl_location_id: '',
    google_business_id: '',
    auto_send_reports: false,
    report_email: '',
    portal_enabled: false,
    client_login_enabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendLinkModal, setSendLinkModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        website_url: client.website_url || '',
        pm_name: client.pm_name || '',
        package: client.package,
        ga4_property_id: client.ga4_property_id || '',
        gsc_site_url: client.gsc_site_url || '',
        meta_ad_account_id: client.meta_ad_account_id || '',
        ghl_location_id: client.ghl_location_id || '',
        google_business_id: client.google_business_id || '',
        auto_send_reports: client.auto_send_reports || false,
        report_email: client.report_email || '',
        portal_enabled: client.portal_enabled || false,
        client_login_enabled: client.client_login_enabled || false,
      });
      const tok = client.portal_token || null;
      setPortalToken(tok);
      if (tok) {
        setPortalUrl(`${BASE_URL}/portal/${client.slug}?token=${tok}`);
      }
      setSendEmail('');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients';
      const method = client ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onClose();
      } else {
        alert('Failed to save client');
      }
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenToken = async () => {
    if (!client) return;
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/portal-token`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPortalToken(data.token);
        setPortalUrl(data.portalUrl);
      } else {
        alert('Failed to generate token');
      }
    } catch {
      alert('Failed to generate token');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendLink = async () => {
    if (!client || !sendEmail) return;
    setSendLoading(true);
    setSendSuccess(false);
    try {
      const res = await fetch(`/api/clients/${client.id}/send-portal-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sendEmail, customMessage: sendMessage || undefined }),
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => {
          setSendLinkModal(false);
          setSendSuccess(false);
          setSendMessage('');
        }, 1500);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to send');
      }
    } catch {
      alert('Failed to send portal link');
    } finally {
      setSendLoading(false);
    }
  };

  const handleCreateLogin = async () => {
    if (!client || !loginEmail || !loginPassword) return;
    setLoginLoading(true);
    setLoginError('');
    setLoginSuccess(false);
    try {
      const res = await fetch(`/api/clients/${client.id}/create-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginSuccess(true);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(data.error || 'Failed to create login');
      }
    } catch {
      setLoginError('Failed to create login');
    } finally {
      setLoginLoading(false);
    }
  };

  const maskedToken = portalToken ? portalToken.slice(0, 8) + '...' : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-6">
            {client ? 'Edit Client' : 'Add Client'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Website URL</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Manager</label>
              <input
                type="text"
                value={formData.pm_name}
                onChange={(e) => setFormData({ ...formData, pm_name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Package *</label>
              <select
                required
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="essentials">Essentials</option>
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">GA4 Property ID</label>
              <input
                type="text"
                value={formData.ga4_property_id}
                onChange={(e) => setFormData({ ...formData, ga4_property_id: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Google Search Console Site URL</label>
              <input
                type="url"
                value={formData.gsc_site_url}
                onChange={(e) => setFormData({ ...formData, gsc_site_url: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Meta Ad Account ID</label>
              <input
                type="text"
                value={formData.meta_ad_account_id}
                onChange={(e) => setFormData({ ...formData, meta_ad_account_id: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">GoHighLevel Location ID</label>
              <input
                type="text"
                value={formData.ghl_location_id}
                onChange={(e) => setFormData({ ...formData, ghl_location_id: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Google Business ID</label>
              <input
                type="text"
                value={formData.google_business_id}
                onChange={(e) => setFormData({ ...formData, google_business_id: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Report Settings */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">Report Settings</p>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white">Auto-send monthly reports</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, auto_send_reports: !formData.auto_send_reports })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.auto_send_reports ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.auto_send_reports ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Report email</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={formData.report_email}
                  onChange={(e) => setFormData({ ...formData, report_email: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">Where monthly reports are sent. Falls back to client email if blank.</p>
              </div>
            </div>

            {/* Client Portal Settings */}
            {client && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">Client Portal</p>

                {/* Portal enabled toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-medium text-white">Portal enabled</label>
                    <p className="text-xs text-muted">Allow token-based access to client dashboard</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, portal_enabled: !formData.portal_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.portal_enabled ? 'bg-accent' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.portal_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Token + URL */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs text-muted mb-1">Portal Token</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={maskedToken || 'No token generated'}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-muted text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRegenToken}
                        disabled={regenLoading}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-border transition-colors disabled:opacity-50"
                      >
                        {regenLoading ? '...' : 'Regenerate'}
                      </button>
                    </div>
                  </div>

                  {portalUrl && (
                    <div>
                      <label className="block text-xs text-muted mb-1">Portal URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={portalUrl}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-muted text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-border transition-colors"
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSendLinkModal(true);
                      setSendEmail('');
                    }}
                    disabled={!portalUrl}
                    className="w-full px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium rounded-lg border border-accent/30 transition-colors disabled:opacity-40"
                  >
                    Send Portal Link via Email
                  </button>
                </div>

                {/* Client login toggle */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium text-white">Client login enabled</label>
                    <p className="text-xs text-muted">Allow client to log in with email/password</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, client_login_enabled: !formData.client_login_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.client_login_enabled ? 'bg-accent' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.client_login_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {formData.client_login_enabled && (
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Create Client Login</p>
                    <div>
                      <label className="block text-xs text-white mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="client@example.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    {loginError && <p className="text-xs text-red-400">{loginError}</p>}
                    {loginSuccess && <p className="text-xs text-green-400">Client login created successfully!</p>}
                    <button
                      type="button"
                      onClick={handleCreateLogin}
                      disabled={loginLoading || !loginEmail || !loginPassword}
                      className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loginLoading ? 'Creating...' : 'Create Login'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Send portal link modal */}
      {sendLinkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-bold text-white mb-4">Send Portal Link</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={sendEmail}
                  onChange={e => setSendEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Custom Message (optional)</label>
                <textarea
                  value={sendMessage}
                  onChange={e => setSendMessage(e.target.value)}
                  placeholder="Add a personal note to the email..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              {sendSuccess && <p className="text-sm text-green-400">Portal link sent successfully!</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSendLink}
                  disabled={sendLoading || !sendEmail}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sendLoading ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSendLinkModal(false); setSendSuccess(false); setSendMessage(''); }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
