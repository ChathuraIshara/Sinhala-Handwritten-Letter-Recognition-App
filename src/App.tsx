import { useRef, useState, useEffect } from 'react';
import './App.css';

interface PredictionResponse {
  prediction?: string;
  confidence?: number;
  error?: string;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [strokeWidth, setStrokeWidth] = useState<number>(8);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - optimized to fit screen
    canvas.width = 280;
    canvas.height = 280;

    // Set drawing styles
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [strokeWidth]);

  // Update stroke width when slider changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = strokeWidth;
  }, [strokeWidth]);

  // Get coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Draw on canvas
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction('');
    setError('');
  };

  // Convert canvas to blob
  const canvasToBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  };

  // Submit prediction request
  const handlePredict = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError('');
    setPrediction('');

    try {
      // Convert canvas to blob
      const blob = await canvasToBlob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'drawing.png');

      // Send POST request
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PredictionResponse = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.prediction) {
        setPrediction(data.prediction);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to the API';
      setError(`Error: ${errorMessage}. Make sure the backend server is running on http://127.0.0.1:5000`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-3 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col items-center gap-3 p-4 md:p-5 border border-white/80 backdrop-blur-sm h-full max-h-[calc(100vh-1.5rem)] flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center flex-shrink-0">
          Sinhala Letter Recognition
        </h1>

        <div className="w-full flex justify-center items-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-inner border-2 border-indigo-100 flex-shrink-0">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[240px] md:max-w-[280px] h-[240px] md:h-[280px] rounded-lg cursor-crosshair touch-none shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="w-full flex flex-col gap-2 px-2 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 justify-center flex-wrap p-2 md:p-3 bg-gray-50 rounded-xl border border-indigo-100">
            <label htmlFor="stroke-width" className="text-xs md:text-sm font-semibold text-gray-700 min-w-[90px] md:min-w-[110px]">
              Stroke Width:
            </label>
            <input
              id="stroke-width"
              type="range"
              min="4"
              max="16"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="slider flex-1 min-w-[120px] md:min-w-[180px] max-w-[200px] md:max-w-[250px] h-2 rounded bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 transition-colors"
            />
            <span className="text-xs md:text-sm font-bold text-indigo-600 min-w-[45px] md:min-w-[50px] text-right bg-indigo-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
              {strokeWidth}px
            </span>
          </div>

          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <button
              onClick={clearCanvas}
              className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl cursor-pointer transition-all duration-300 min-w-[120px] md:min-w-[140px] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-black/5 hover:-translate-y-0.5 active:translate-y-0"
              disabled={isLoading}
            >
              Clear
            </button>
            <button
              onClick={handlePredict}
              className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl cursor-pointer transition-all duration-300 min-w-[120px] md:min-w-[140px] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 active:translate-y-0"
              disabled={isLoading}
            >
              {isLoading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-2 py-2 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 text-xs md:text-sm">Analyzing your drawing...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 w-full text-center flex-shrink-0">
            <p className="text-red-700 text-xs md:text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {prediction && !isLoading && (
          <div className="w-full text-center p-4 md:p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl shadow-lg border-2 border-indigo-200 animate-fadeIn flex-shrink-0">
            <p className="text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3 uppercase tracking-wide opacity-80">
              Predicted Letter:
            </p>
            <p className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 min-h-[60px] md:min-h-[80px] flex items-center justify-center font-sinhala drop-shadow-lg animate-scaleIn">
              {prediction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

