import React, { useState, useRef } from 'react';
import { Cloud, X, AlertCircle, Loader2, ImageIcon } from 'lucide-react';

function UploadCard({ onUpload, loading }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, GIF, or BMP image.');
      return;
    }

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }
    setError(null);
    try {
      await onUpload(selectedFile);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const clearPreview = () => {
    setPreview(null);
    setFileName('');
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 transition"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative rounded-2xl border-2 transition-all duration-300 ${
          dragActive
            ? 'border-green-500 bg-green-50'
            : preview
            ? 'border-green-300 bg-green-50'
            : 'border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragDrop}
      >
        {preview ? (
          <div className="p-6">
            {/* Preview Image */}
            <div className="relative rounded-xl overflow-hidden mb-4 bg-white border border-gray-200">
              <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
            </div>

            {/* File Info */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">
                <ImageIcon className="inline w-4 h-4 mr-2" />
                {fileName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={clearPreview}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X size={16} />
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-lg text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Cloud size={16} />
                    Analyze Image
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Cloud className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Upload Plant Image
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Drag and drop your image here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-lg text-white font-medium text-sm transition-all"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Supported formats: JPG, PNG, GIF, BMP (Max 10 MB)
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm font-semibold text-blue-900 mb-3">✓ Best Practices</p>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Clear photos of affected leaf areas</li>
          <li>• Natural lighting, minimal shadows</li>
          <li>• Focus on disease symptoms</li>
          <li>• Avoid blurry or partially visible leaves</li>
        </ul>
      </div>
    </div>
  );
}

export default UploadCard;
