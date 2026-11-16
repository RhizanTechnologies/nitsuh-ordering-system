'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  Sparkles,
  Link2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Female Exec
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Male Manager
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Female Cashier
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Male Waiter
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Female Waiter
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', // Chef Male
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', // Chef Female
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', // Storekeeper
];

interface StaffAvatarUploaderProps {
  value: string;
  onChange: (url: string) => void;
  staffName?: string;
  label?: string;
}

export function StaffAvatarUploader({
  value,
  onChange,
  staffName,
  label = 'Staff Profile Photo / Avatar',
}: StaffAvatarUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customSizeInfo, setCustomSizeInfo] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isCustomUpload = value?.startsWith('data:image/');
  const isPreset = AVATAR_PRESETS.includes(value);

  // Center-crop and optimize image to a crisp 256x256 square JPEG (~15-25 KB)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, or HEIC).');
      return;
    }

    setProcessing(true);
    setUploadError(null);

    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const TARGET_SIZE = 256;
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setUploadError('Could not initialize image processing canvas.');
            setProcessing(false);
            return;
          }

          // Center-square crop calculation
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          // Draw cropped & resized square
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, TARGET_SIZE, TARGET_SIZE);

          // Compress to JPEG at 0.88 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const optimizedSizeKb = Math.round((optimizedDataUrl.length * 3) / 4 / 1024);

          onChange(optimizedDataUrl);
          setCustomSizeInfo(`Optimized: ${optimizedSizeKb} KB (${TARGET_SIZE}×${TARGET_SIZE}px)`);
        } catch (err: any) {
          console.error('Image compression error:', err);
          setUploadError('Failed to process image. Please try another image.');
        } finally {
          setProcessing(false);
        }
      };

      img.onerror = () => {
        setUploadError('Failed to load image file. Please try another.');
        setProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setUploadError('Failed to read selected file.');
      setProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput('');
    setCustomSizeInfo(null);
  };

  const handleResetToPreset = () => {
    onChange(AVATAR_PRESETS[0]);
    setCustomSizeInfo(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300">
          {label}
        </label>
        {isCustomUpload && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
            <Check className="w-3 h-3" /> Custom Photo
          </span>
        )}
      </div>

      {/* Main Avatar Card (Preview + Controls) */}
      <div className="bg-stone-50 dark:bg-[#1A1614] border border-stone-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5">
        {/* Large Avatar Preview */}
        <div className="relative flex-shrink-0">
          {value ? (
            <img
              src={value}
              alt={staffName || 'Staff Avatar'}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md shadow-amber-500/15"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xl">
              {staffName ? staffName.charAt(0).toUpperCase() : '?'}
            </div>
          )}

          {isCustomUpload && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Current status info & quick actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-stone-900 dark:text-white truncate">
              {staffName ? staffName : 'Profile Image'}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-zinc-300">
              {isCustomUpload ? 'Uploaded Photo' : isPreset ? 'Stock Preset' : 'Custom URL'}
            </span>
          </div>

          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate mt-0.5">
            {customSizeInfo || (isCustomUpload ? 'Square profile photo optimized for terminals' : 'Used for touch POS badges, waiter pad & receipts')}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Change Photo</span>
            </button>

            {isCustomUpload && (
              <>
                <span className="text-stone-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset to stock</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Upload Method */}
      <div className="flex border-b border-stone-200 dark:border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition ${
            activeTab === 'upload'
              ? 'border-amber-500 text-stone-900 dark:text-amber-300'
              : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload / Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`py-2 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition ${
            activeTab === 'presets'
              ? 'border-amber-500 text-stone-900 dark:text-amber-300'
              : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Stock Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`py-2 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition ${
            activeTab === 'url'
              ? 'border-amber-500 text-stone-900 dark:text-amber-300'
              : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-white'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Image URL</span>
        </button>
      </div>

      {/* TAB CONTENT: Upload & Camera Dropzone */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                : 'border-stone-300 dark:border-white/15 bg-stone-50/50 dark:bg-white/[0.02] hover:border-amber-500/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {processing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                  {processing ? 'Optimizing photo...' : 'Drag & drop staff photo here, or'}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                  PNG, JPG, WebP • Auto-crops to center square for badge & receipts
                </p>
              </div>

              {/* Action Buttons: Choose File & Take Photo */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Take photo using mobile or laptop camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Photo</span>
                </button>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Stock Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-2">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Choose from standard cafe role avatars:
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {AVATAR_PRESETS.map((url, idx) => {
              const isSelected = value === url;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(url);
                    setCustomSizeInfo(null);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition border-2 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400/50 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-102'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 font-black stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Direct URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleApplyUrl} className="space-y-2">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">
            Paste a link to any existing online photo (Unsplash, company intranet, etc.):
          </p>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://example.com/staff-photo.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
