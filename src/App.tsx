import { useRef, useState, useEffect } from 'react';
import './App.css';

interface PredictionResponse {
  prediction?: string;
  confidence?: number;
  error?: string;
  predicted_letter?: string;    
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

      // Create form data - Flask backend expects field name 'file'
      const formData = new FormData();
      formData.append('file', blob, 'drawing.png');

      // Send POST request to Flask backend
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData, 
      });

      const data: PredictionResponse = await response.json();
      console.log('Prediction response:', data);

      // Handle Flask error responses (status 400 or 500)
      if (!response.ok || data.error) {
        const errorMsg = data.error || `HTTP error! status: ${response.status}`;
        setError(errorMsg);
        return;
      }

      // Handle successful prediction
      if (data.predicted_letter) {
        setPrediction(data.predicted_letter);
      } else {
        setError('Invalid response from server: No prediction field found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to the API';
      setError(`Error: ${errorMessage}. Make sure the backend server is running on http://127.0.0.1:5000`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen p-3 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col items-center gap-3 p-4 md:p-5 border border-white/80 backdrop-blur-sm h-full max-h-[calc(100vh-1.5rem)] flex-shrink-0">
        <h1 className="flex-shrink-0 text-xl font-extrabold text-center text-transparent md:text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
          Sinhala Letter Recognition
        </h1>

        <div className="flex items-center justify-center flex-shrink-0 w-full p-3 border-2 border-indigo-100 shadow-inner bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
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

        <div className="flex flex-col flex-shrink-0 w-full gap-2 px-2">
          <div className="flex flex-wrap items-center justify-center gap-2 p-2 border border-indigo-100 md:gap-3 md:p-3 bg-gray-50 rounded-xl">
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

          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
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
          <div className="flex flex-col items-center flex-shrink-0 gap-2 py-2">
            <div className="w-8 h-8 border-4 border-gray-200 rounded-full md:w-10 md:h-10 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-gray-600 md:text-sm">Analyzing your drawing...</p>
          </div>
        )}

        {error && (
          <div className="flex-shrink-0 w-full p-3 text-center border border-red-200 rounded-lg bg-red-50 md:p-4">
            <p className="text-xs leading-relaxed text-red-700 md:text-sm">{error}</p>
          </div>
        )}

        {prediction && !isLoading && (
          <div className="flex-shrink-0 w-full p-4 text-center border-2 border-indigo-200 shadow-lg md:p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl animate-fadeIn">
            <p className="mb-2 text-sm font-semibold tracking-wide text-gray-700 uppercase md:text-base md:mb-3 opacity-80">
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

