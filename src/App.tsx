import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ContentDetailPage from './pages/ContentDetailPage';
import ImageGenerationPage from './pages/ImageGenerationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/content-detail/:slug" element={<ContentDetailPage />} />
        <Route path="/content-detail/:slug/image-generation" element={<ImageGenerationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
