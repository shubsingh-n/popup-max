'use client';

import React, { useState } from 'react';

interface CustomWidgetBuilderProps {
  initialTitle?: string;
  initialCode?: { html?: string; css?: string; js?: string };
  onSave: (title: string, code: { html: string; css: string; js: string }) => void;
  isSaving: boolean;
  siteId: string;
  popupId?: string;
}

export default function CustomWidgetBuilder({
  initialTitle = 'New Custom Widget',
  initialCode = { html: '', css: '', js: '' },
  onSave,
  isSaving,
  popupId,
}: CustomWidgetBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [html, setHtml] = useState(initialCode.html || '');
  const [css, setCss] = useState(initialCode.css || '');
  const [js, setJs] = useState(initialCode.js || '');

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const handleSave = () => {
    onSave(title, { html, css, js });
  };

  const handleEditTriggers = () => {
    if (popupId && popupId !== 'new') {
      window.location.href = `/dashboard/popups/${popupId}/triggers`;
    } else {
      alert("Please save the widget first before editing triggers.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Widget Title"
          />
        </div>
        <div className="flex items-center gap-4">
          {popupId && popupId !== 'new' && (
            <button
              onClick={handleEditTriggers}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Edit Triggers
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Widget'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full flex flex-col p-4 gap-4">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'html' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab('html')}
            >
              HTML
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'css' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab('css')}
            >
              CSS
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'js' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab('js')}
            >
              JavaScript
            </button>
          </div>

          <div className="flex-1">
            {activeTab === 'html' && (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="<!-- Enter HTML code here -->\n<div class='my-widget'>\n  Hello World\n</div>"
              />
            )}
            {activeTab === 'css' && (
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="/* Enter CSS styles here */\n.my-widget {\n  background: white;\n  padding: 20px;\n}"
              />
            )}
            {activeTab === 'js' && (
              <textarea
                value={js}
                onChange={(e) => setJs(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="// Enter JavaScript here\n// You can interact with your HTML elements and the parent page\nconsole.log('Widget loaded');\n\n// To close widget programmatically:\n// window.PopupMax.close('your-popup-id');"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
