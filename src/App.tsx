import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ContentDetailPage from './pages/ContentDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/content-detail/:slug" element={<ContentDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
