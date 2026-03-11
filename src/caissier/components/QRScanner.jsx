import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/ui/Button';

const QRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scanCooldownRef = useRef(false);
  const readerIdRef = useRef('qr-reader-scanner');

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        }).catch(() => {});
      } catch (_e) {}
      html5QrCodeRef.current = null;
    }
    const el = document.getElementById(readerIdRef.current);
    if (el) {
      el.innerHTML = '';
      el.style.display = 'none';
    }
    if (scannerRef.current) {
      scannerRef.current.innerHTML = '';
    }
    scanCooldownRef.current = false;
    setIsScanning(false);
    setScanSuccess(false);
  };

  const triggerScanFeedback = () => {
    setScanSuccess(true);
    try {
      if (navigator.vibrate) navigator.vibrate(200);
    } catch (_e) {}
  };

  const startScanning = async () => {
    try {
      setError('');
      setStatusMessage('Activation de la caméra...');
      setIsScanning(true);
      scanCooldownRef.current = false;

      await new Promise((r) => setTimeout(r, 100));

      const { Html5Qrcode } = await import('html5-qrcode');

      const readerId = readerIdRef.current;
      const container = document.getElementById(readerId);
      if (!container) {
        setError('Erreur: conteneur du scan introuvable.');
        setIsScanning(false);
        return;
      }
      container.innerHTML = '';
      container.style.display = 'block';

      const html5QrCode = new Html5Qrcode(readerId);

      const qrboxSize = Math.min(280, typeof window !== 'undefined' ? window.innerWidth * 0.75 : 280);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decodedText) => {
          if (scanCooldownRef.current) return;
          scanCooldownRef.current = true;
          triggerScanFeedback();
          setStatusMessage('QR code reçu !');

          const value = (decodedText || '').toString().trim();
          if (!value) return;

          try {
            onScan(value);
          } catch (_e) {
            scanCooldownRef.current = false;
          }
        },
        () => {
          // Pas de QR visible - pas d'erreur à afficher
        }
      );

      html5QrCodeRef.current = html5QrCode;
      setStatusMessage('Positionnez le QR code dans le cadre');
    } catch (err) {
      setIsScanning(false);
      const msg = err?.message || '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Accès à la caméra refusé. Autorisez la caméra dans les paramètres du navigateur.');
      } else if (msg.includes('NotFoundError')) {
        setError('Aucune caméra trouvée.');
      } else if (msg.includes('NotReadableError')) {
        setError('Caméra déjà utilisée par une autre application.');
      } else {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-[#F7F5FF] rounded-lg flex items-center justify-center border-2 border-[#E4E0FF]">
              <svg className="w-12 h-12 text-[#472EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            Cliquez sur &quot;Démarrer le scan&quot; pour activer la caméra et scanner le QR code du ticket
          </p>
          <Button variant="primary" onClick={startScanning} className="w-full bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold py-3">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Démarrer le scan
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`relative rounded-xl overflow-hidden bg-black transition-all duration-300 ${
              scanSuccess ? 'ring-4 ring-green-500 ring-offset-2' : ''
            }`}
            style={{ minHeight: '320px' }}
          >
            <div ref={scannerRef} className="w-full qr-scanner-video-wrapper" style={{ minHeight: '320px' }}>
              <style>{`#qr-reader-scanner video { transform: scaleX(-1); }`}</style>
              <div
                id={readerIdRef.current}
                className="w-full overflow-hidden rounded-xl"
                style={{ minHeight: '320px' }}
              />
            </div>
            {/* Cadre de guidage par-dessus la vidéo (le scan utilise toute la zone) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-4 border-[#F58020] rounded-2xl shadow-2xl bg-black/20" style={{ width: 'min(280px, 85vw)', height: 'min(280px, 85vw)' }}>
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />
              </div>
            </div>
          </div>

          <p className="text-sm text-center font-medium text-gray-700 min-h-[1.25rem]">
            {statusMessage || 'Positionnez le QR code dans le cadre orange'}
          </p>

          {scanSuccess && (
            <p className="text-sm text-center font-semibold text-green-600 animate-pulse">
              ✓ QR code détecté
            </p>
          )}

          <Button variant="danger" onClick={stopScanning} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3">
            Arrêter le scan
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} className="flex-1 border border-gray-300">
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;
