import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ContentDetailPage from './pages/ContentDetailPage';
import ImageGenerationPage from './pages/ImageGenerationPage';
import PosterGenerationPage from './pages/PosterGenerationPage';
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/content-detail/:slug" element={<ContentDetailPage />} />
          <Route path="/content-detail/:slug/image-generation" element={<ImageGenerationPage />} />
          <Route path="/content-detail/:slug/poster-generation" element={<PosterGenerationPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
