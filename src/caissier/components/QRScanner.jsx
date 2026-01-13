import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/ui/Button';

const QRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const qrCodeDetectorRef = useRef(null);

  useEffect(() => {
    return () => {
      // Nettoyer à la fermeture
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Vérifier si l'API BarcodeDetector est disponible (Chrome/Edge)
      if ('BarcodeDetector' in window) {
        await startNativeBarcodeDetection();
      } else {
        // Fallback: utiliser html5-qrcode si disponible
        await startHtml5QRCode();
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions ou installez html5-qrcode: npm install html5-qrcode');
      setIsScanning(false);
    }
  };

  const startNativeBarcodeDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Caméra arrière de préférence
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.display = 'block';
      
      // Masquer le conteneur html5-qrcode
      const qrReader = document.getElementById('qr-reader');
      if (qrReader) {
        qrReader.style.display = 'none';
      }
      
      if (scannerRef.current) {
        scannerRef.current.replaceChildren();
        scannerRef.current.appendChild(video);
        scannerRef.current.style.display = 'block';
      }

      await video.play();

      const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
      qrCodeDetectorRef.current = { video, stream, barcodeDetector };

      const detectQR = async () => {
        if (!qrCodeDetectorRef.current) return;

        try {
          const barcodes = await qrCodeDetectorRef.current.barcodeDetector.detect(qrCodeDetectorRef.current.video);
          
          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            stopScanning();
            onScan(qrData);
            return;
          }
        } catch (_err) {
          // Ignorer les erreurs de détection et continuer
        }

        if (qrCodeDetectorRef.current) {
          requestAnimationFrame(detectQR);
        }
      };

      detectQR();
    } catch (err) {
      throw err;
    }
  };

  const startHtml5QRCode = async () => {
    try {
      // Essayer d'importer html5-qrcode dynamiquement
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Masquer le conteneur natif
      if (scannerRef.current) {
        scannerRef.current.style.display = 'none';
      }
      
      // Afficher le conteneur html5-qrcode
      const qrReader = document.getElementById('qr-reader');
      if (qrReader) {
        qrReader.style.display = 'block';
      }
      
      const html5QrCode = new Html5Qrcode('qr-reader');
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code détecté
          stopScanning();
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
          }).catch(() => {});
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignorer les erreurs de décodage (pas de QR code visible)
        }
      );

      qrCodeDetectorRef.current = html5QrCode;
    } catch (err) {
      if (err.message.includes('Cannot find module')) {
        throw new Error('html5-qrcode n\'est pas installé. Installez-le avec: npm install html5-qrcode');
      }
      throw err;
    }
  };

  const stopScanning = () => {
    if (qrCodeDetectorRef.current) {
      if (qrCodeDetectorRef.current.stream) {
        // Arrêter le stream natif
        qrCodeDetectorRef.current.stream.getTracks().forEach(track => track.stop());
      } else if (qrCodeDetectorRef.current.stop) {
        // Arrêter html5-qrcode
        qrCodeDetectorRef.current.stop().then(() => {
          qrCodeDetectorRef.current.clear();
        }).catch(() => {});
      }
      qrCodeDetectorRef.current = null;
    }
    
    if (scannerRef.current) {
      scannerRef.current.replaceChildren();
    }
    
    setIsScanning(false);
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
            Cliquez sur "Démarrer le scan" pour activer la caméra et scanner le QR code du ticket
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
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
            {/* Conteneur pour la vidéo (API native) */}
            <div ref={scannerRef} className="w-full h-full" style={{ display: 'none' }}></div>
            {/* Conteneur pour html5-qrcode */}
            <div id="qr-reader" className="w-full h-full" style={{ display: 'none' }}></div>
            {/* Zone de scan visuelle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-4 border-[#F58020] rounded-lg w-64 h-64 relative shadow-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F58020] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F58020] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F58020] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F58020] rounded-br-lg"></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-center text-gray-700 font-medium">
            Positionnez le QR code dans le cadre orange
          </p>
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

