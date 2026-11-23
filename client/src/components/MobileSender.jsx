import React, { useState, useRef } from 'react';
import { 
  Send, 
  ClipboardPaste, 
  Link as LinkIcon, 
  Code2, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  X, 
  Sparkles,
  Tv,
  Check
} from 'lucide-react';
import { ContentCard } from './ContentCard';

export function MobileSender({
  session,
  messages,
  devices,
  isTvConnected,
  onSendMessage,
  onDeleteMessage,
  onClearSession,
  onCopyContent,
  copiedId
}) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'code' | 'image' | 'file'
  const [textContent, setTextContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Auto detect if text is a URL
  const isUrl = /^https?:\/\/[^\s]+$/i.test(textContent.trim());

  // Paste from clipboard helper
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTextContent(text);
          setErrorMsg('');
        }
      } else {
        setErrorMsg('Please tap and hold the input box to paste on this browser.');
      }
    } catch (err) {
      setErrorMsg('Clipboard access denied. Please paste manually into the text box.');
    }
  };

  // Handle file select (images or files)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25 MB limit.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Send
  const handleSend = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    // If uploading a file or image
    if (activeTab === 'image' || activeTab === 'file') {
      if (!selectedFile) {
        setErrorMsg('Please select a file to send.');
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sessionCode', session.code);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadData = await uploadRes.json();

        await onSendMessage({
          type: uploadData.isImage ? 'image' : 'file',
          content: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          senderDevice: 'mobile'
        });

        handleClearFile();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send file');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Sending text / link / code
    const cleanText = textContent.trim();
    if (!cleanText) {
      setErrorMsg('Please enter some text before sending.');
      return;
    }

    setIsSending(true);
    try {
      const msgType = activeTab === 'code' ? 'code' : (isUrl ? 'link' : 'text');
      await onSendMessage({
        type: msgType,
        content: cleanText,
        title: activeTab === 'code' ? `${codeLanguage.toUpperCase()} Snippet` : null,
        senderDevice: 'mobile'
      });

      setTextContent('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to deliver message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* TV Connection Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
        isTvConnected
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isTvConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">
              {isTvConnected ? 'Smart TV is Connected' : 'Waiting for TV...'}
            </p>
            <p className="text-xs text-zinc-400">
              {isTvConnected 
                ? 'Sent content will immediately pop up on the TV screen.'
                : `Ensure code ${session.code.slice(0,3)}-${session.code.slice(3)} is active on your TV.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${isTvConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-xs font-medium">
            {isTvConnected ? 'Live' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Main Sender Box */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-3xl p-5 shadow-xl">
        {/* Type Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[#09090B] rounded-2xl mb-4 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-primary text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text / Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-primary text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-primary text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'file'
                ? 'bg-primary text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>File</span>
          </button>
        </div>

        {/* Input Areas based on activeTab */}

        {/* 1. Text & Link Input */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type or paste text, links, notes, or YouTube URLs to send to TV..."
                rows={5}
                className="w-full bg-[#09090B] border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-500 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
              />

              {/* Paste button overlay */}
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/50 backdrop-blur-sm transition-all"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-primary-light" />
                <span>Paste</span>
              </button>
            </div>

            {/* URL auto-detection indicator */}
            {isUrl && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-300 text-xs font-medium">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Web URL detected — will provide direct "Open in TV Browser" button on TV screen.</span>
              </div>
            )}
          </div>
        )}

        {/* 2. Code Snippet Input */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-400 font-medium">Programming Language:</span>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="bg-[#09090B] border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1 outline-none"
              >
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML / CSS</option>
                <option value="json">JSON</option>
                <option value="bash">Shell / Bash</option>
                <option value="sql">SQL</option>
                <option value="text">Plain Monospace</option>
              </select>
            </div>

            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="// Paste your code snippet here..."
              rows={6}
              className="w-full bg-[#09090B] border border-zinc-800 rounded-2xl p-4 text-white font-mono placeholder-zinc-600 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all leading-relaxed"
            />
          </div>
        )}

        {/* 3 & 4. Image or File Attachment Input */}
        {(activeTab === 'image' || activeTab === 'file') && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'image' ? 'image/*' : '*/*'}
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-primary/60 bg-[#09090B]/60 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-zinc-800 rounded-2xl text-primary">
                  {activeTab === 'image' ? <ImageIcon className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {activeTab === 'image' ? 'Tap to choose photo or camera' : 'Tap to select any file'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Maximum file size: 25 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#09090B] border border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-zinc-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFile}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error message if any */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-xl border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Send Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || isUploading}
            className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <span>Uploading & Sending to TV...</span>
            ) : isSending ? (
              <span>Sending...</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send to TV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sent Items History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Sent History</h2>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
              {messages.length}
            </span>
          </div>

          {messages.length > 0 && onClearSession && (
            <button
              onClick={onClearSession}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500">
            <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No items sent yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Type anything above and hit Send to TV!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <ContentCard
                key={msg.id}
                message={msg}
                onCopy={onCopyContent}
                onDelete={onDeleteMessage}
                isCopied={copiedId === msg.id}
                isTvMode={false}
                cardIndex={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
