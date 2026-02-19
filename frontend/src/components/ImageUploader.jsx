import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ImageUploader = ({ 
  onImagesChange, 
  initialImages = [], 
  maxImages = 5,
  label = "Product Images",
  folder = "products"
}) => {
  const { api } = useAuth();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const uploadToCloudinary = async (file) => {
    try {
      // Get signature from backend
      const sigResponse = await api.get(`/cloudinary/signature?folder=${folder}&resource_type=image`);
      const sig = sigResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const cloudName = sig.cloud_name.toLowerCase(); // Cloudinary cloud names are lowercase
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      const result = await response.json();
      
      if (!response.ok || result.error) {
        console.error('Cloudinary error:', result);
        throw new Error(result.error?.message || 'Upload failed');
      }

      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed, trying local upload:', err);
      // Fallback to local upload
      return await uploadToLocal(file);
    }
  };

  const uploadToLocal = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      // For local uploads, construct full URL
      const imageUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${API_URL}${response.data.url}`;
      return imageUrl;
    }
    throw new Error('Local upload failed');
  };

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
    setUploadProgress(0);

    const newImages = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
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
        const imageUrl = await uploadToCloudinary(file);
        newImages.push(imageUrl);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}`);
      }
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setUploading(false);
    setUploadProgress(0);

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
      if (images.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }
      const updatedImages = [...images, url];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        <span className="ml-2 text-xs text-gray-400 inline-flex items-center gap-1">
          <Cloud className="h-3 w-3" /> Cloud Storage
        </span>
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=Error';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            uploading 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-red-500 hover:bg-red-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-red-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600 font-medium">Uploading to cloud...</p>
              <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
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
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* URL Input Alternative */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Or paste image URL..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            const input = e.target.closest('.flex').querySelector('input');
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
