'use client';

interface PopupPreviewProps {
  formData: {
    title: string;
    description: string;
    ctaText: string;
    styles: {
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
    };
  };
}

export default function PopupPreview({ formData }: PopupPreviewProps) {
  return (
    <div className="relative">
      <div
        className="p-6 rounded-lg shadow-lg border-2 border-gray-200"
        style={{
          backgroundColor: formData.styles.backgroundColor,
          color: formData.styles.textColor,
        }}
      >
        <h3 className="text-2xl font-bold mb-3">{formData.title || 'Popup Title'}</h3>
        <p className="mb-4 text-gray-600">{formData.description || 'Popup description'}</p>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: formData.styles.textColor }}
            disabled
          />
        </div>
        <button
          className="w-full px-4 py-2 rounded-md font-semibold text-white transition-colors"
          style={{ backgroundColor: formData.styles.buttonColor }}
        >
          {formData.ctaText || 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

