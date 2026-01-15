# Sinhala Letter Recognition - Frontend

A modern React + TypeScript frontend application for recognizing Sinhala handwritten letters using a machine learning backend.

## Features

- 🎨 **Interactive Drawing Canvas**: Draw Sinhala characters with mouse or touch support
- 🎯 **Real-time Prediction**: Submit drawings to ML backend API for recognition
- 📱 **Mobile-Friendly**: Responsive design that works on all devices
- 🎨 **Modern UI**: Clean, professional interface with smooth animations
- ⚙️ **Adjustable Stroke Width**: Customize drawing thickness with slider
- 🔄 **Loading States**: Visual feedback during API requests
- ❌ **Error Handling**: Graceful error messages for API failures

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS (styling)
- Vite (build tool)
- Canvas API for drawing
- Fetch API for HTTP requests

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://127.0.0.1:5000/predict`

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

1. Draw a Sinhala character on the canvas using your mouse or touch
2. Adjust stroke width using the slider (optional)
3. Click "Clear" to reset the canvas
4. Click "Predict" to send the drawing to the backend API
5. View the predicted Sinhala letter displayed below

## API Endpoint

The app expects a Flask backend API at:
- **URL**: `http://127.0.0.1:5000/predict`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Field name**: `file` (Flask expects 'file' field)
- **Response format**: JSON with `prediction` field (string) or `error` field (string)

Example success response:
```json
{
  "prediction": "අ"
}
```

Example error response:
```json
{
  "error": "Error message here"
}
```

### CORS Configuration

If you encounter CORS errors, add the following to your Flask app (`app.py`):

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
```

Or install flask-cors: `pip install flask-cors`

## Project Structure

```
.
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Tailwind CSS directives
│   └── index.tsx        # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript config
└── vite.config.ts       # Vite config
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

