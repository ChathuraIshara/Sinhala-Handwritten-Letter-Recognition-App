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
      console.log('Raw response:', response);

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
    <div className="min-h-screen w-full bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1e1b4b] to-black flex items-center justify-center p-4 overflow-hidden relative selection:bg-cyan-500/30">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 md:p-8 transition-all duration-300 flex flex-col gap-6 md:gap-8 max-h-[95vh] overflow-y-auto md:overflow-hidden">
        
        {/* Header - Full Width */}
        <div className="text-center space-y-1 flex-shrink-0">
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 font-outfit tracking-tight drop-shadow-sm">
            Sinhala Letter Recognition
            </h1>
            <p className="text-slate-400 text-sm font-outfit font-medium">Draw a Sinhala letter below to identify it</p>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-center gap-8 md:gap-12 w-full h-full">
            {/* Left Side: Drawing Area & Controls */}
            <div className="flex flex-col items-center gap-6 w-full md:w-auto flex-shrink-0">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative flex items-center justify-center p-1 bg-slate-900 rounded-2xl ring-1 ring-white/10">
                    <canvas
                        ref={canvasRef}
                        className="w-[280px] h-[280px] rounded-xl cursor-crosshair touch-none bg-black border border-white/5"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    </div>
                </div>

                <div className="flex flex-col w-full gap-4 max-w-[280px]">
                    {/* Stroke Width Control */}
                    <div className="flex flex-col gap-3 p-3 border border-white/5 bg-white/5 rounded-2xl">
                        <div className="flex justify-between items-center">
                            <label htmlFor="stroke-width" className="text-sm font-semibold text-slate-300 font-outfit">
                            Brush Size
                            </label>
                            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-500/20">
                            {strokeWidth}px
                            </span>
                        </div>
                        
                        <input
                        id="stroke-width"
                        type="range"
                        min="4"
                        max="16"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="slider w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                        onClick={clearCanvas}
                        className="px-4 py-3 text-sm font-semibold text-slate-300 bg-slate-800/50 border border-white/10 rounded-xl hover:bg-slate-700/50 hover:text-white transition-all duration-200 focus:ring-2 focus:ring-slate-500/20 active:scale-95 flex items-center justify-center gap-2"
                        disabled={isLoading}
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                        </button>
                        <button
                        onClick={handlePredict}
                        className="px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        disabled={isLoading}
                        >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Thinking...</span>
                            </>
                        ) : (
                            <>
                            <span>Predict</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            </>
                        )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Prediction Result */}
            <div className="flex flex-col w-full md:w-[320px] lg:w-[380px] md:h-[460px] gap-4">
                 {/* Placeholder or Error Area */}
                {error && (
                    <div className="w-full p-4 border border-red-500/20 rounded-xl bg-red-500/10 backdrop-blur-sm animate-fadeIn">
                        <p className="text-sm font-medium text-red-200 text-center">{error}</p>
                    </div>
                )}

                {/* Prediction Card */}
                <div className={`flex flex-col items-center justify-center flex-1 w-full p-6 text-center border transition-all duration-500 rounded-3xl relative overflow-hidden group ${prediction ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 shadow-[0_0_40px_rgba(6,182,212,0.1)]' : 'border-white/5 bg-white/5'}`}>
                    
                    {prediction ? (
                         <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <p className="mb-4 text-sm font-bold tracking-[0.2em] text-cyan-300 uppercase opacity-90 font-outfit">
                                    Predicted Letter
                                </p>
                                <div className="w-40 h-40 md:w-48 md:h-48 flex items-center justify-center bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm mb-4">
                                    <p className="text-8xl md:text-9xl font-bold text-white font-sinhala drop-shadow-[0_0_25px_rgba(34,211,238,0.6)] animate-scaleIn">
                                        {prediction}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    <p className="text-slate-400 text-xs font-outfit">AI Confidence: High</p>
                                </div>
                            </div>
                         </>
                    ) : (
                        <div className="text-slate-500 flex flex-col items-center gap-4">
                             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                             </div>
                             <p className="text-sm font-medium font-outfit">Waiting for drawing...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;

