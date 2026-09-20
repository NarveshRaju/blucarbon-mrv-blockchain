import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Tag
} from 'lucide-react';
import './EvidenceUpload.css';

export const EVIDENCE_CATEGORIES = [
  { value: 'Site Photograph', label: 'Site Photograph' },
  { value: 'Before Plantation', label: 'Before Plantation (Baseline)' },
  { value: 'After Plantation', label: 'After Plantation (Growth)' },
  { value: 'Field Survey', label: 'Field Survey & GPS Plot' },
  { value: 'NGO Document', label: 'NGO Document / ID Proof' },
  { value: 'Permission / Authorization', label: 'Land Permission / Tenure Agreement' },
  { value: 'Other Supporting Document', label: 'Other Supporting Document' },
];

/**
 * Compresses and scales images client-side to ensure fast uploads
 * and prevent payload overflow.
 */
const compressImage = (file, maxDimension = 1600, quality = 0.82) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const estimatedSize = Math.round(dataUrl.length * 0.75);
        resolve({ dataUrl, size: estimatedSize });
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target.result, size: file.size });
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      resolve({ dataUrl: '', size: 0 });
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Enhanced Evidence Upload Component for Blue Carbon Project Proofs.
 * Supports drag-and-drop, category classification, client-side image compression,
 * thumbnail lightbox previews, and PDF document management.
 *
 * @param {object} props
 * @param {Array<object>} props.files - List of uploaded evidence objects
 * @param {Function} props.onChange - Called with updated array of evidence objects
 * @param {number} [props.maxFiles=10] - Maximum allowed files
 * @param {number} [props.maxSizeMB=10] - Maximum size per file in MB
 * @param {string} [props.className]
 */
const EvidenceUpload = ({
  files = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
  className = '',
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (incomingFiles) => {
    setUploadError('');
    const newFiles = [...files];

    if (newFiles.length + incomingFiles.length > maxFiles) {
      setUploadError(`You can upload a maximum of ${maxFiles} evidence documents/photos.`);
      return;
    }

    setIsProcessing(true);

    try {
      for (const file of Array.from(incomingFiles)) {
        // Validate file size (10 MB max initial limit)
        if (file.size > maxSizeMB * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`);
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';

        if (!isImage && !isPDF) {
          setUploadError(`"${file.name}" has an unsupported format. Please upload JPG, PNG, WEBP, or PDF.`);
          continue;
        }

        if (isImage) {
          // Client-side image compression to ~150-300KB
          const { dataUrl, size } = await compressImage(file);
          newFiles.push({
            id: `evi_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            name: file.name,
            size: size || file.size,
            type: 'image/jpeg',
            category: 'Site Photograph',
            uploadedAt: new Date().toISOString(),
            base64: dataUrl,
            isImage: true,
            isPDF: false,
            status: 'Available for Review',
          });
        } else {
          // Read PDF directly
          const base64Data = await new Promise((res) => {
            const r = new FileReader();
            r.onload = (ev) => res(ev.target.result);
            r.readAsDataURL(file);
          });
          newFiles.push({
            id: `evi_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            category: 'Permission / Authorization',
            uploadedAt: new Date().toISOString(),
            base64: base64Data,
            isImage: false,
            isPDF: true,
            status: 'Available for Review',
          });
        }
      }

      onChange([...newFiles]);
    } catch (err) {
      console.error('Error processing evidence files:', err);
      setUploadError('Failed to process one or more files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileId) => {
    const updated = files.filter((f) => f.id !== fileId);
    onChange(updated);
  };

  const handleCategoryChange = (fileId, newCategory) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, category: newCategory } : f
    );
    onChange(updated);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`evidence-upload-container ${className}`}>
      {/* Dropzone Area */}
      <div
        className={`eu-dropzone ${dragOver ? 'drag-over' : ''} ${files.length >= maxFiles || isProcessing ? 'disabled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => files.length < maxFiles && !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={files.length >= maxFiles || isProcessing}
        />
        <div className="eu-dropzone-icon">
          <UploadCloud size={32} />
        </div>
        <div className="eu-dropzone-text">
          <strong>
            {isProcessing ? 'Processing & optimizing evidence files...' : 'Click to browse or drag & drop project evidence files'}
          </strong>
          <p>
            Upload site photographs, before/after records, field surveys, land permissions, and NGO documents (JPG, PNG, WEBP, PDF up to {maxSizeMB}MB)
          </p>
        </div>
        <span className="eu-limit-badge">
          {files.length} / {maxFiles} Files Attached
        </span>
      </div>

      {uploadError && (
        <div className="eu-error-message">
          <AlertTriangle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files Classified List */}
      {files.length > 0 && (
        <div className="eu-evidence-list">
          <div className="eu-list-header">
            <h4>Uploaded Files & Classification ({files.length})</h4>
            <span className="eu-list-subtitle">Select an evidence category for each uploaded file for validator review.</span>
          </div>

          <div className="eu-items-grid">
            {files.map((file) => (
              <div key={file.id} className="eu-evidence-card">
                {/* Thumbnail / Document Preview */}
                <div className="eu-card-preview">
                  {file.isImage ? (
                    <div
                      className="eu-thumb-wrapper"
                      onClick={() => setPreviewModalImg(file)}
                      title="Click to view larger"
                    >
                      <img src={file.base64} alt={file.name} />
                      <span className="eu-preview-overlay">
                        <Eye size={16} />
                      </span>
                    </div>
                  ) : (
                    <div className="eu-pdf-placeholder">
                      <FileText size={32} />
                      <span className="eu-pdf-tag">PDF</span>
                    </div>
                  )}
                </div>

                {/* File Details and Category Selection */}
                <div className="eu-card-content">
                  <div className="eu-card-info-row">
                    <span className="eu-card-filename" title={file.name}>
                      {file.name}
                    </span>
                    <span className="eu-card-filesize">{formatFileSize(file.size)}</span>
                  </div>

                  {/* Category Selector */}
                  <div className="eu-category-wrap">
                    <label htmlFor={`cat-${file.id}`}>
                      <Tag size={12} /> Category:
                    </label>
                    <select
                      id={`cat-${file.id}`}
                      value={file.category || 'Site Photograph'}
                      onChange={(e) => handleCategoryChange(file.id, e.target.value)}
                      className="eu-category-select"
                    >
                      {EVIDENCE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remove Action */}
                <button
                  type="button"
                  className="eu-remove-btn"
                  onClick={() => handleRemoveFile(file.id)}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transparency & Academic Notice */}
      <div className="eu-transparency-note">
        <ShieldCheck size={18} />
        <div>
          <strong>Supporting Documentation Notice:</strong>
          <p>
            Uploaded evidence will be available to validators as supporting documentation during project verification. Uploading permissions or surveys does not constitute automatic legal certification.
          </p>
        </div>
      </div>

      {/* Full-size Image Lightbox Modal */}
      {previewModalImg && (
        <div className="eu-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="eu-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eu-modal-header">
              <div>
                <strong>{previewModalImg.name}</strong>
                <span className="eu-modal-cat">{previewModalImg.category}</span>
              </div>
              <button
                type="button"
                className="eu-modal-close"
                onClick={() => setPreviewModalImg(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="eu-modal-body">
              <img src={previewModalImg.base64} alt={previewModalImg.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;
