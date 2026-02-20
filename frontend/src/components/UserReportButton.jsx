import React, { useState } from 'react';

// Componente para reportar usuarios con lógica de seguridad mejorada
export default function UserReportButton({ userId, userName, className = "" }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const reportReasons = [
    { value: 'INAPPROPRIATE_CONTENT', label: 'Contenido inapropiado' },
    { value: 'HARASSMENT', label: 'Acoso o acoso sexual' },
    { value: 'FAKE_PROFILE', label: 'Perfil falso o engañoso' },
    { value: 'SPAM', label: 'Spam o mensajes no deseados' },
    { value: 'HATE_SPEECH', label: 'Discurso de odio' },
    { value: 'MINOR', label: 'Usuario menor de edad' },
    { value: 'OTHER', label: 'Otro motivo' }
  ];

  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert('Por favor selecciona un motivo para el reporte');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Obtener initData de Telegram Web App
      const initData = window.Telegram?.WebApp?.initData || 'test_init_data_12345';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          reportedUserId: userId,
          reason: reportReason,
          details: reportDetails
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setReportSubmitted(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportReason('');
          setReportDetails('');
          setReportSubmitted(false);
        }, 2000);
      } else {
        alert('Error al enviar reporte: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error enviando reporte:', error);
      alert('Error al enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón de reporte */}
      <button
        onClick={() => setShowReportModal(true)}
        className={`flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors ${className}`}
        title="Reportar usuario"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm font-medium">Reportar</span>
      </button>

      {/* Modal de reporte */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reportar Usuario</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-green-900 mb-2">¡Reporte Enviado!</h4>
                  <p className="text-sm text-gray-600">
                    Gracias por ayudarnos a mantener la comunidad segura. Revisaremos el reporte pronto.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Por qué estás reportando a {userName || 'este usuario'}?
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Selecciona un motivo</option>
                      {reportReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detalles adicionales (opcional)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Proporciona más detalles sobre el incidente..."
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex">
                      <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Los reportes falsos pueden tener consecuencias. Por favor, usa esta función responsablemente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={isSubmitting || !reportReason}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </div>
                      ) : (
                        'Enviar Reporte'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
