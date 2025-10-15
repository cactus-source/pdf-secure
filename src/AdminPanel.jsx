import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link2, Clock, Eye, Trash2, Settings, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function SecurePDFAdmin() {
  const [view, setView] = useState('upload');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [watermarks, setWatermarks] = useState([]);
  const [config, setConfig] = useState({
    destructionType: 'time',
    destructionTime: 60,
    notifyEmail: 'karlawounang047@gmail.com'
  });
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef(null);
  const [isPlacingWatermark, setIsPlacingWatermark] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPdfPreview(event.target.result);
        setWatermarks([]);
        setView('watermark');
      };
      reader.readAsDataURL(file);
    } else {
      showNotification('Veuillez sélectionner un fichier PDF valide', 'error');
    }
  };

  const handleCanvasClick = (e) => {
    if (!isPlacingWatermark) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setWatermarks([...watermarks, { x, y, id: Date.now() }]);
    setIsPlacingWatermark(false);
  };

  const removeWatermark = (id) => {
    setWatermarks(watermarks.filter(w => w.id !== id));
  };

  const generateSecureLink = () => {
    if (!pdfFile || watermarks.length === 0) {
      showNotification('Ajoutez au moins un filigrane avant de générer le lien', 'error');
      return;
    }

    const linkId = Math.random().toString(36).substring(2, 15);
    const secureLink = {
      id: linkId,
      url: `${window.location.origin}/view/${linkId}`,
      fileName: pdfFile.name,
      created: new Date().toLocaleString('fr-FR'),
      config: { ...config },
      watermarks: [...watermarks],
      pdfData: pdfPreview,
      opened: false,
      openedAt: null
    };

    const links = [...generatedLinks, secureLink];
    setGeneratedLinks(links);
    
    localStorage.setItem('secureLinks', JSON.stringify(links));
    
    showNotification('Lien sécurisé généré avec succès !');
    setView('links');
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    showNotification('Lien copié dans le presse-papier !');
  };

  const deleteLink = (id) => {
    const links = generatedLinks.filter(l => l.id !== id);
    setGeneratedLinks(links);
    localStorage.setItem('secureLinks', JSON.stringify(links));
    showNotification('Lien supprimé');
  };

  useEffect(() => {
    const saved = localStorage.getItem('secureLinks');
    if (saved) {
      setGeneratedLinks(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            PDF Sécurisé Auto-Destructible
          </h1>
          <p className="text-slate-400">Protégez vos documents sensibles avec des liens sécurisés</p>
        </header>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('upload')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              view === 'upload' ? 'bg-blue-600 shadow-lg' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Upload className="inline mr-2" size={18} />
            Nouveau Document
          </button>
          <button
            onClick={() => setView('links')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              view === 'links' ? 'bg-blue-600 shadow-lg' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Link2 className="inline mr-2" size={18} />
            Mes Liens ({generatedLinks.length})
          </button>
        </div>

        {view === 'upload' && (
          <div className="bg-slate-800 rounded-xl p-8 shadow-2xl">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <Upload className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-xl font-semibold mb-2">Uploadez votre PDF</h3>
              <p className="text-slate-400 mb-4">Glissez-déposez ou cliquez pour sélectionner</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors font-medium"
              >
                Choisir un fichier
              </label>
            </div>
          </div>
        )}

        {view === 'watermark' && pdfPreview && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold mb-4">Positionnement du filigrane "ATTESTATION"</h3>
              <p className="text-slate-400 mb-4">
                Cliquez sur "Ajouter Filigrane" puis cliquez sur le document où vous souhaitez protéger les zones sensibles
                (nom entreprise, dates, cachet)
              </p>
              
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setIsPlacingWatermark(!isPlacingWatermark)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    isPlacingWatermark ? 'bg-green-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPlacingWatermark ? 'Cliquez sur le document...' : 'Ajouter Filigrane'}
                </button>
                <button
                  onClick={() => setWatermarks([])}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all"
                >
                  Tout effacer
                </button>
              </div>

              <div className="relative bg-slate-700 rounded-lg p-4 overflow-auto max-h-[500px]">
                <div 
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="relative inline-block cursor-crosshair"
                  style={{ minWidth: '100%' }}
                >
                  <embed
                    src={pdfPreview}
                    type="application/pdf"
                    className="w-full h-[600px] pointer-events-none"
                  />
                  {watermarks.map((wm) => (
                    <div
                      key={wm.id}
                      className="absolute group"
                      style={{
                        left: `${wm.x}%`,
                        top: `${wm.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="relative">
                        <div className="text-red-600 font-bold text-2xl opacity-40 rotate-[-15deg] whitespace-nowrap select-none px-4 py-2 bg-white/10 backdrop-blur-sm rounded border-2 border-red-500">
                          ATTESTATION
                        </div>
                        <button
                          onClick={() => removeWatermark(wm.id)}
                          className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-400">
                <strong>{watermarks.length}</strong> filigrane(s) ajouté(s)
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} />
                Configuration de sécurité
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de destruction</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="destructionType"
                        value="time"
                        checked={config.destructionType === 'time'}
                        onChange={(e) => setConfig({ ...config, destructionType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>Après un délai</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="destructionType"
                        value="firstView"
                        checked={config.destructionType === 'firstView'}
                        onChange={(e) => setConfig({ ...config, destructionType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>Après 1ère lecture</span>
                    </label>
                  </div>
                </div>

                {config.destructionType === 'time' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Durée avant destruction (secondes)
                    </label>
                    <select
                      value={config.destructionTime}
                      onChange={(e) => setConfig({ ...config, destructionTime: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value={10}>10 secondes</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                      <option value={900}>15 minutes</option>
                      <option value={1200}>20 minutes</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Email de notification</label>
                  <input
                    type="email"
                    value={config.notifyEmail}
                    onChange={(e) => setConfig({ ...config, notifyEmail: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={generateSecureLink}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all shadow-lg"
              >
                Générer le Lien Sécurisé
              </button>
            </div>
          </div>
        )}

        {view === 'links' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">Liens générés</h3>
            
            {generatedLinks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Link2 className="mx-auto mb-4" size={48} />
                <p>Aucun lien généré pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedLinks.map((link) => (
                  <div key={link.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{link.fileName}</h4>
                        <p className="text-sm text-slate-400">Créé le {link.created}</p>
                        <div className="flex gap-4 text-sm text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {link.config.destructionType === 'time' 
                              ? `${link.config.destructionTime}s` 
                              : 'Après 1ère lecture'}
                          </span>
                          {link.opened && (
                            <span className="flex items-center gap-1 text-green-400">
                              <Eye size={14} />
                              Ouvert le {link.openedAt}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={link.url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-800 rounded border border-slate-600 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(link.url)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
