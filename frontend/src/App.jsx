import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor'; // <--- YENİ IMPORT

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* ARTIK GERÇEK SAYFAYA GİDİYOR */}
          <Route path="/editor/:id" element={<Editor />} /> 
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;