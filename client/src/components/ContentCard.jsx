import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Code2, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Clock, 
  Smartphone, 
  Tv,
  Maximize2
} from 'lucide-react';

export function ContentCard({
  message,
  onCopy,
  onDelete,
  isCopied = false,
  isTvMode = false,
  cardIndex = 0
}) {
  const [showImageModal, setShowImageModal] = useState(false);

  const { id, type, content, title, file_name, file_size, file_type, sender_device, created_at } = message;

  // Format time
  const timeFormatted = created_at
    ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLink = type === 'link' || (type === 'text' && /^https?:\/\/[^\s]+$/i.test(content.trim()));

  return (
    <div 
      className={`group relative bg-[#18181B] border transition-all duration-200 rounded-2xl ${
        isTvMode 
          ? 'p-6 mb-6 border-zinc-800 shadow-tv-card hover:border-zinc-700' 
          : 'p-4 mb-4 border-zinc-800/80 shadow-md'
      }`}
    >
      {/* Header bar of Card: Type badge, Sender device, Timestamp, Delete */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          {/* Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium tracking-wide uppercase ${
            isTvMode ? 'text-sm' : 'text-xs'
          } ${
            isLink 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : type === 'code'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : type === 'image'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : type === 'file'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
          }`}>
            {isLink ? <ExternalLink className="w-3.5 h-3.5" /> :
             type === 'code' ? <Code2 className="w-3.5 h-3.5" /> :
             type === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> :
             type === 'file' ? <FileText className="w-3.5 h-3.5" /> :
             <FileText className="w-3.5 h-3.5" />}
            <span>{isLink ? 'Link' : type}</span>
          </span>

          {/* Sender */}
          <span className={`flex items-center gap-1 text-zinc-400 ${isTvMode ? 'text-base' : 'text-xs'}`}>
            {sender_device === 'mobile' ? (
              <Smartphone className={isTvMode ? 'w-4 h-4 text-indigo-400' : 'w-3 h-3 text-indigo-400'} />
            ) : (
              <Tv className={isTvMode ? 'w-4 h-4 text-emerald-400' : 'w-3 h-3 text-emerald-400'} />
            )}
            <span className="capitalize">{sender_device || 'Phone'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-zinc-500 ${isTvMode ? 'text-base' : 'text-xs'}`}>
            <Clock className={isTvMode ? 'w-4 h-4' : 'w-3 h-3'} />
            {timeFormatted}
          </span>

          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              title="Delete item"
              className={`text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors tv-focusable ${
                isTvMode ? 'p-2' : ''
              }`}
              data-tv-focus
              aria-label="Delete item"
            >
              <Trash2 className={isTvMode ? 'w-5 h-5' : 'w-4 h-4'} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="space-y-3">
        {title && (
          <h3 className={`font-semibold text-white ${isTvMode ? 'text-2xl' : 'text-base'}`}>
            {title}
          </h3>
        )}

        {/* 1. Image Content */}
        {type === 'image' && (
          <div className="rounded-xl overflow-hidden bg-black/40 border border-zinc-800 flex flex-col items-center justify-center">
            <img 
              src={content} 
              alt={file_name || 'Shared image'} 
              className={`w-full max-h-[500px] object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity ${
                isTvMode ? 'max-h-[600px]' : 'max-h-[350px]'
              }`}
              onClick={() => setShowImageModal(true)}
            />
            {file_name && (
              <div className={`w-full p-2.5 bg-zinc-900/90 text-zinc-400 flex items-center justify-between border-t border-zinc-800 ${
                isTvMode ? 'text-base' : 'text-xs'
              }`}>
                <span className="truncate">{file_name}</span>
                <span>{formatSize(file_size)}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. File Content */}
        {type === 'file' && (
          <div className={`p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4 ${
            isTvMode ? 'p-6' : ''
          }`}>
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0 ${
                isTvMode ? 'p-4' : ''
              }`}>
                <FileText className={isTvMode ? 'w-8 h-8' : 'w-6 h-6'} />
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-white truncate ${isTvMode ? 'text-2xl' : 'text-sm'}`}>
                  {file_name || 'Shared Document'}
                </p>
                <p className={`text-zinc-400 ${isTvMode ? 'text-lg' : 'text-xs'}`}>
                  {formatSize(file_size)} • {file_type || 'File'}
                </p>
              </div>
            </div>

            <a
              href={content}
              download={file_name || 'download'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all tv-focusable shadow-md shrink-0 ${
                isTvMode ? 'text-xl py-3 px-6' : 'text-sm'
              }`}
              data-tv-focus
            >
              <Download className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
              <span>Download</span>
            </a>
          </div>
        )}

        {/* 3. Code Snippet */}
        {type === 'code' && (
          <div className="rounded-xl overflow-hidden bg-[#0D0D10] border border-zinc-800">
            <div className={`px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono flex items-center justify-between ${
              isTvMode ? 'text-base' : 'text-xs'
            }`}>
              <span>Code Snippet</span>
              <span>{content.split('\n').length} lines</span>
            </div>
            <pre className={`p-4 overflow-x-auto font-mono text-zinc-200 leading-relaxed select-text ${
              isTvMode ? 'text-2xl max-h-[450px]' : 'text-xs max-h-[300px]'
            }`}>
              <code>{content}</code>
            </pre>
          </div>
        )}

        {/* 4. URL / Link */}
        {isLink && (
          <div className={`p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-col gap-2 ${
            isTvMode ? 'p-6' : ''
          }`}>
            <span className={`text-blue-400 font-mono break-all font-medium select-text ${
              isTvMode ? 'text-2xl' : 'text-sm'
            }`}>
              {content}
            </span>
          </div>
        )}

        {/* 5. Plain / Long Text */}
        {type === 'text' && !isLink && (
          <div className={`text-zinc-100 whitespace-pre-wrap leading-relaxed select-text font-sans ${
            isTvMode ? 'text-3xl' : 'text-base'
          }`}>
            {content}
          </div>
        )}
      </div>

      {/* Prominent Action Bar (Copy button & Link button) */}
      <div className={`mt-5 pt-4 border-t border-zinc-800/80 flex items-center gap-3 flex-wrap ${
        isTvMode ? 'mt-6 pt-5' : ''
      }`}>
        {/* Large Prominent COPY Button */}
        <button
          onClick={() => onCopy(type === 'image' || type === 'file' ? content : content, id)}
          data-tv-focus
          data-tv-primary={cardIndex === 0 ? "true" : undefined}
          data-tv-initial={cardIndex === 0 ? "true" : undefined}
          className={`flex-1 flex items-center justify-center gap-2.5 font-bold rounded-xl transition-all duration-200 tv-focusable ${
            isCopied
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-indigo-600/30'
          } ${
            isTvMode ? 'text-2xl py-4 px-8' : 'text-sm py-3 px-4'
          }`}
          aria-label={isCopied ? 'Copied' : 'Copy Content to Clipboard'}
        >
          {isCopied ? (
            <>
              <Check className={isTvMode ? 'w-7 h-7' : 'w-4 h-4'} />
              <span>COPIED TO TV CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy className={isTvMode ? 'w-7 h-7' : 'w-4 h-4'} />
              <span>{isTvMode ? 'COPY CONTENT (PRESS OK)' : 'Copy to Clipboard'}</span>
            </>
          )}
        </button>

        {/* If URL: Open Link button (very convenient for Smart TV browser) */}
        {isLink && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            data-tv-focus
            className={`flex items-center justify-center gap-2 font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 tv-focusable shadow-lg shadow-blue-600/30 ${
              isTvMode ? 'text-2xl py-4 px-8' : 'text-sm py-3 px-4'
            }`}
          >
            <ExternalLink className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
            <span>Open Link</span>
          </a>
        )}

        {/* If image: Fullscreen preview button */}
        {type === 'image' && (
          <button
            onClick={() => setShowImageModal(true)}
            data-tv-focus
            className={`flex items-center justify-center gap-2 font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all tv-focusable ${
              isTvMode ? 'text-xl py-4 px-6' : 'text-sm py-3 px-4'
            }`}
          >
            <Maximize2 className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
            <span>View Full</span>
          </button>
        )}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowImageModal(false)}
        >
          <img 
            src={content} 
            alt="Fullscreen view" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl"
          />
          <button
            onClick={() => setShowImageModal(false)}
            data-tv-focus
            className={`mt-4 px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 font-medium tv-focusable ${
              isTvMode ? 'text-xl py-3 px-8' : 'text-sm'
            }`}
          >
            Close Fullscreen (Press OK / Back)
          </button>
        </div>
      )}
    </div>
  );
}
