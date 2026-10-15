import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Image, AlertCircle } from 'lucide-react';

export default function QRScanner({ onScanSuccess }) {
  const [scanMode, setScanMode] = useState('camera');
  const [cameraError, setCameraError] = useState(null);
  
  const containerId = "awris-qr-reader-container";
  const scannerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Audio feedback on successful scan
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  useEffect(() => {
    isMountedRef.current = true;

    // PATCH: Suppress browser unhandled AbortError on <video>.play() interruptions
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const playPromise = originalPlay.apply(this, arguments);
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Ignore harmless media interruptions caused by unmounting or tab switching
          if (err.name === 'AbortError' || err.message?.includes('removed from the document')) {
            return;
          }
          console.warn("Media play error:", err);
        });
      }
      return playPromise;
    };

    if (scanMode === 'camera') {
      let html5QrCode = null;

      const initCamera = async () => {
        // Wait for modal animation and DOM rendering
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!isMountedRef.current) return;

        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        try {
          html5QrCode = new Html5Qrcode(containerId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false
          });
          scannerRef.current = html5QrCode;

          const devices = await Html5Qrcode.getCameras();
          if (!isMountedRef.current) return;

          if (!devices || devices.length === 0) {
            setCameraError("No accessible camera found on this device.");
            return;
          }

          const targetCamera = devices[devices.length - 1].id;

          await html5QrCode.start(
            targetCamera,
            {
              fps: 15,
              qrbox: { width: 180, height: 180 },
              aspectRatio: 1.0
            },
            async (decodedText) => {
              playScanBeep();
              if (html5QrCode && html5QrCode.isScanning) {
                try {
                  await html5QrCode.stop();
                  html5QrCode.clear();
                } catch (e) {}
              }
              if (isMountedRef.current) {
                onScanSuccess(decodedText);
              }
            },
            () => {} // Ignore per-frame non-matches
          );
        } catch (err) {
          if (!isMountedRef.current) return;
          if (err?.name === 'AbortError' || String(err).includes('play()')) return;
          console.warn("Camera start exception:", err);
          setCameraError("Camera unavailable or permission denied.");
        }
      };

      initCamera();

      return () => {
        isMountedRef.current = false;
        HTMLMediaElement.prototype.play = originalPlay;

        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop()
              .then(() => {
                try { html5QrCode.clear(); } catch (e) {}
              })
              .catch(() => {});
          } else {
            try { html5QrCode.clear(); } catch (e) {}
          }
          scannerRef.current = null;
        }
      };
    } else {
      return () => {
        isMountedRef.current = false;
        HTMLMediaElement.prototype.play = originalPlay;
      };
    }
  }, [scanMode, onScanSuccess]);

  const handleFileScan = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const fileScanner = new Html5Qrcode("awris-file-reader-dummy");
      const decodedText = await fileScanner.scanFile(file, true);
      playScanBeep();
      onScanSuccess(decodedText);
    } catch (err) {
      alert("Could not detect a valid QR code in this image. Please ensure the QR is clear and well-lit.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      <style>{`
        #awris-qr-reader-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          border-radius: 12px;
        }
        #awris-qr-reader-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 12px;
          display: block !important;
        }
        #awris-qr-reader-container canvas {
          display: none !important;
        }
      `}</style>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => { setCameraError(null); setScanMode('camera'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            backgroundColor: scanMode === 'camera' ? '#2563EB' : '#F1F5F9',
            color: scanMode === 'camera' ? '#FFF' : '#64748B'
          }}
        >
          <Camera size={14} /> Live Camera
        </button>
        <button
          type="button"
          onClick={() => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
            setScanMode('file');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            backgroundColor: scanMode === 'file' ? '#2563EB' : '#F1F5F9',
            color: scanMode === 'file' ? '#FFF' : '#64748B'
          }}
        >
          <Image size={14} /> Upload QR Screenshot
        </button>
      </div>

      {scanMode === 'camera' && (
        <div 
          style={{ 
            width: '280px', 
            height: '280px', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '2px solid #E2E8F0', 
            backgroundColor: '#0F172A', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {cameraError ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#CBD5E1', fontSize: '12px' }}>
              <AlertCircle size={24} color="#F87171" style={{ margin: '0 auto 8px' }} />
              <p>{cameraError}</p>
            </div>
          ) : (
            <div id={containerId} style={{ width: '100%', height: '100%' }} />
          )}
        </div>
      )}

      {scanMode === 'file' && (
        <div style={{ width: '100%', padding: '24px', border: '2px dashed #CBD5E1', borderRadius: '12px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
          <Image size={32} color="#64748B" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Upload a TNG or DuitNow QR image</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileScan}
            style={{ fontSize: '12px', color: '#64748B' }}
          />
          <div id="awris-file-reader-dummy" style={{ display: 'none' }}></div>
        </div>
      )}
    </div>
  );
}