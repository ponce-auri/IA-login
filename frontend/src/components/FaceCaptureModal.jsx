import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../App';

export default function FaceCaptureModal({ isOpen, onClose, onCaptureComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const { addToast } = useToast();
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Iniciando...');
  const [statusType, setStatusType] = useState('info'); // info, success, error, warning
  const [latestDescriptor, setLatestDescriptor] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Load face-api models
  useEffect(() => {
    if (!isOpen) return;

    const loadModels = async () => {
      try {
        setStatusMessage('Cargando modelos de reconocimiento...');
        setStatusType('info');
        
        // Load the models from public/models
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        
        setModelsLoaded(true);
        setStatusMessage('Modelos cargados. Iniciando cámara...');
      } catch (err) {
        console.error('Error al cargar modelos:', err);
        setStatusMessage('Error al cargar modelos de reconocimiento.');
        setStatusType('error');
        addToast('No se pudieron cargar los modelos de reconocimiento facial.', 'error');
      }
    };

    loadModels();
  }, [isOpen]);

  // Start Camera once models are loaded
  useEffect(() => {
    if (!isOpen || !modelsLoaded) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
          setStatusMessage('Cámara activa. Por favor, mire de frente.');
          setStatusType('info');
        }
      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        let msg = 'No se pudo acceder a la cámara.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Permiso de cámara denegado. Por favor, habilítelo en su navegador.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'Cámara no disponible. Asegúrese de que está conectada.';
        }
        setStatusMessage(msg);
        setStatusType('error');
        addToast(msg, 'error');
      }
    };

    startVideo();

    return () => {
      stopCamera();
    };
  }, [isOpen, modelsLoaded]);

  // Stop camera stream
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setLatestDescriptor(null);
  };

  // Perform real-time detection
  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return;

      const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        faceapi.matchDimensions(canvas, displaySize);
      }

      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding box
        faceapi.draw.drawDetections(canvas, resizedDetections);

        if (detections.length === 0) {
          setStatusMessage('Rostro no detectado. Alinee su rostro en el recuadro.');
          setStatusType('warning');
          setLatestDescriptor(null);
        } else if (detections.length > 1) {
          setStatusMessage('Múltiples rostros detectados. Por favor, colóquese solo.');
          setStatusType('error');
          setLatestDescriptor(null);
        } else {
          setStatusMessage('Rostro detectado correctamente. Listo para capturar.');
          setStatusType('success');
          setLatestDescriptor(detections[0].descriptor);
        }
      } catch (err) {
        console.error('Error durante la detección de rostro:', err);
      }
    }, 200);
  };

  const handleVideoPlay = () => {
    startDetection();
  };

  const handleCapture = () => {
    if (!latestDescriptor) {
      addToast('Asegúrese de tener un rostro detectado antes de capturar.', 'error');
      return;
    }
    
    setIsCapturing(true);
    setStatusMessage('Procesando rostro...');
    
    setTimeout(() => {
      // Convert Float32Array to regular array for JSON serialization
      const descriptorArray = Array.from(latestDescriptor);
      onCaptureComplete(descriptorArray);
      setIsCapturing(false);
      handleClose();
    }, 600);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="face-modal-overlay">
      <div className="face-modal-container glass-card">
        <button className="face-modal-close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="face-modal-header">
          <h3 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Reconocimiento Facial
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Escanea tu rostro para configurar tu acceso biométrico seguro
          </p>
        </div>

        <div className="face-modal-body">
          <div className="video-viewport">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onPlay={handleVideoPlay}
              className="video-element"
            />
            <canvas ref={canvasRef} className="canvas-overlay" />
            
            {!cameraActive && (
              <div className="viewport-loader">
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{statusMessage}</p>
              </div>
            )}

            {cameraActive && (
              <div className="scanline-overlay"></div>
            )}
          </div>

          <div className={`status-bar status-${statusType}`}>
            {statusType === 'info' && <RefreshCw className="animate-spin" size={16} />}
            {statusType === 'success' && <CheckCircle2 size={16} />}
            {statusType === 'warning' && <AlertCircle size={16} />}
            {statusType === 'error' && <AlertCircle size={16} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{statusMessage}</span>
          </div>
        </div>

        <div className="face-modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isCapturing}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            disabled={!latestDescriptor || isCapturing}
            onClick={handleCapture}
            style={{ minWidth: '150px' }}
          >
            <Camera size={18} />
            {isCapturing ? 'Procesando...' : 'Capturar Rostro'}
          </button>
        </div>
      </div>
    </div>
  );
}
