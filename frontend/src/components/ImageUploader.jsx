import React, { useState, useRef } from 'react';
import { Upload, X, Image, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ImageUploader = ({ 
  onImagesChange, 
  initialImages = [], 
  maxImages = 5,
  label = "Product Images"
}) => {
  const { api } = useAuth();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check max images
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setError('');

    const newImages = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Max 10MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          // Use full URL for production
          const imageUrl = response.data.url.startsWith('http') 
            ? response.data.url 
            : `${API_URL}/api${response.data.url}`;
          
          newImages.push(imageUrl);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}`);
      }
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleUrlAdd = (url) => {
    if (url && url.startsWith('http')) {
      const updatedImages = [...images, url];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=Error';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 dark:hover:border-red-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-red-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-red-500 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB ({images.length}/{maxImages})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* URL Input Alternative */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Or paste image URL..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleUrlAdd(e.target.value);
              e.target.value = '';
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            const input = e.target.previousSibling;
            handleUrlAdd(input.value);
            input.value = '';
          }}
        >
          Add URL
        </Button>
      </div>
    </div>
  );
};

export default ImageUploader;
