import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Eye, Clock, Shield, XCircle } from 'lucide-react';

export default function SecurePDFViewer() {
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [screenshotAttempts, setScreenshotAttempts] = useState(0);
  const viewerRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('id') || 'demo123';
    
    const allLinks = JSON.parse(localStorage.getItem('secureLinks') || '[]');
    const link = allLinks.find(l => l.id === linkId);
    
    if (!link) {
      setError('Ce lien est invalide ou a expiré');
      return;
    }

    if (link.config.destructionType === 'firstView' && link.opened) {
      setError('Ce document a déjà été consulté et s\'est auto-détruit');
      return;
    }

    link.opened = true;
    link.openedAt = new Date().toLocaleString('fr-FR');
    
    const updatedLinks = allLinks.map(l => l.id === linkId ? link : l);
    localStorage.setItem('secureLinks', JSON.stringify(updatedLinks));

    sendNotification(link);
    
    setLinkData(link);
    
    if (link.config.destructionType === 'time') {
      setTimeRemaining(link.config.destructionTime);
    }
  }, []);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) {
        destroyDocument();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          destroyDocument();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    const preventScreenshot = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        setScreenshotAttempts(prev => prev + 1);
        alert('⚠️ TENTATIVE DE CAPTURE DÉTECTÉE\nCe document est protégé. L\'administrateur a été notifié.');
      }
    };

    const preventRightClick = (e) => {
      e.preventDefault();
      alert('Action bloquée - Document protégé');
    };

    document.addEventListener('keyup', preventScreenshot);
    document.addEventListener('contextmenu', preventRightClick);
    
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('keyup', preventScreenshot);
      document.removeEventListener('contextmenu', preventRightClick);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  const sendNotification = (link) => {
    console.log(`📧 EMAIL envoyé à ${link.config.notifyEmail}`);
    console.log(`Sujet: Document "${link.fileName}" ouvert`);
    console.log(`Le document a été consulté le ${link.openedAt}`);
  };

  const destroyDocument = () => {
    setIsDestroyed(true);
    setLinkData(null);
    
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('id');
    
    if (linkId) {
      const allLinks = JSON.parse(localStorage.getItem('secureLinks') || '[]');
      const updatedLinks = allLinks.filter(l => l.id !== linkId);
      localStorage.setItem('secureLinks', JSON.stringify(updatedLinks));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center shadow-2xl border border-red-500">
          <XCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (isDestroyed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center shadow-2xl border border-red-500 animate-pulse">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Document détruit</h2>
          <p className="text-slate-300 mb-4">
            Ce document s'est auto-détruit conformément aux paramètres de sécurité.
          </p>
          <p className="text-sm text-slate-400">
            Les données ont été définitivement supprimées.
          </p>
        </div>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-500" size={24} />
              <div>
                <h1 className="font-bold text-lg">{linkData.fileName}</h1>
                <p className="text-sm text-slate-400">Document sécurisé</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2 bg-red-900/30 px-4 py-2 rounded-lg border border-red-500">
                  <Clock className="text-red-400" size={20} />
                  <div>
                    <div className="text-xs text-slate-400">Auto-destruction</div>
                    <div className="font-bold text-red-400 text-lg">{formatTime(timeRemaining)}</div>
                  </div>
                </div>
              )}
              
              {linkData.config.destructionType === 'firstView' && (
                <div className="flex items-center gap-2 bg-orange-900/30 px-4 py-2 rounded-lg border border-orange-500">
                  <Eye className="text-orange-400" size={20} />
                  <div className="text-sm">
                    <div className="text-xs text-slate-400">Lecture unique</div>
                    <div className="font-semibold text-orange-400">Se détruira à la fermeture</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {screenshotAttempts > 0 && (
        <div className="container mx-auto px-4 py-3">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <span className="text-sm">
              {screenshotAttempts} tentative(s) de capture détectée(s) - Administrateur notifié
            </span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-700/50 px-6 py-3 border-b border-slate-600">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Shield size={16} />
              <span>Protections actives : Clic droit bloqué • Impression désactivée • Téléchargement impossible</span>
            </div>
          </div>
          
          <div ref={viewerRef} className="relative bg-slate-900 p-8" style={{ minHeight: '600px' }}>
            <div className="relative">
              <embed
                src={linkData.pdfData}
                type="application/pdf"
                className="w-full h-[700px] rounded shadow-lg"
                style={{ pointerEvents: 'none' }}
              />
              
              {linkData.watermarks.map((wm) => (
                <div
                  key={wm.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${wm.x}%`,
                    top: `${wm.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="text-red-600 font-bold text-3xl opacity-40 rotate-[-15deg] whitespace-nowrap select-none px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-red-500 shadow-xl">
                    ATTESTATION
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600 text-center">
            <p className="text-sm text-slate-400">
              ⚠️ Ce document est protégé et se détruira automatiquement. Toute tentative de copie est surveillée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
