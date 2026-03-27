'use client';

import { useState, useEffect } from 'react';

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
  });
  const [loading, setLoading] = useState(false);

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
      });
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-6">
          {client ? 'Edit Client' : 'Add Client'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Project Manager
            </label>
            <input
              type="text"
              value={formData.pm_name}
              onChange={(e) =>
                setFormData({ ...formData, pm_name: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Package *
            </label>
            <select
              required
              value={formData.package}
              onChange={(e) =>
                setFormData({ ...formData, package: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="essentials">Essentials</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              GA4 Property ID
            </label>
            <input
              type="text"
              value={formData.ga4_property_id}
              onChange={(e) =>
                setFormData({ ...formData, ga4_property_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Google Search Console Site URL
            </label>
            <input
              type="url"
              value={formData.gsc_site_url}
              onChange={(e) =>
                setFormData({ ...formData, gsc_site_url: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Meta Ad Account ID
            </label>
            <input
              type="text"
              value={formData.meta_ad_account_id}
              onChange={(e) =>
                setFormData({ ...formData, meta_ad_account_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              GoHighLevel Location ID
            </label>
            <input
              type="text"
              value={formData.ghl_location_id}
              onChange={(e) =>
                setFormData({ ...formData, ghl_location_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Google Business ID
            </label>
            <input
              type="text"
              value={formData.google_business_id}
              onChange={(e) =>
                setFormData({ ...formData, google_business_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

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
  );
}
