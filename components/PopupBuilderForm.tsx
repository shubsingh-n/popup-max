'use client';

interface PopupBuilderFormProps {
  formData: {
    siteId: string;
    title: string;
    description: string;
    ctaText: string;
    styles: {
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
    };
    triggers: {
      timeDelay: number | null;
      exitIntent: boolean;
    };
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  sites: Array<{ _id: string; name: string; siteId: string }>;
}

export default function PopupBuilderForm({
  formData,
  setFormData,
  sites,
}: PopupBuilderFormProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      {/* Basic Info */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site
            </label>
            <select
              required
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site._id} value={site.siteId}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter popup title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter popup description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Button Text
            </label>
            <input
              type="text"
              value={formData.ctaText}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Subscribe"
            />
          </div>
        </div>
      </div>

      {/* Styles */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Styles</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.styles.backgroundColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, backgroundColor: e.target.value },
                  })
                }
                className="h-10 w-20 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={formData.styles.backgroundColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, backgroundColor: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.styles.textColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, textColor: e.target.value },
                  })
                }
                className="h-10 w-20 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={formData.styles.textColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, textColor: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.styles.buttonColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, buttonColor: e.target.value },
                  })
                }
                className="h-10 w-20 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={formData.styles.buttonColor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: { ...formData.styles, buttonColor: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Triggers */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Triggers</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Delay (seconds)
            </label>
            <input
              type="number"
              min="0"
              value={formData.triggers.timeDelay || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  triggers: {
                    ...formData.triggers,
                    timeDelay: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to disable"
            />
            <p className="text-xs text-gray-500 mt-1">
              Show popup after X seconds (0 = immediately)
            </p>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.triggers.exitIntent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    triggers: { ...formData.triggers, exitIntent: e.target.checked },
                  })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Exit Intent</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Show popup when user moves mouse to leave the page
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Only active popups will be shown on websites
        </p>
      </div>
    </div>
  );
}

