import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Map, Settings, BarChart, Database } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Engineering from './pages/Engineering';
import Charts from './pages/Charts';
import Data from './pages/Data';

// Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">RumSense</h1>
          <p className="text-xs text-gray-400 mt-1">Desarrollado por Tenku Servicios para el Dr.Daniel Ignacio Cartes Lillo</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/')
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Activity className={`w-5 h-5 mr-3 ${isActive('/') ? 'text-blue-600' : 'text-gray-400'}`} />
            Panel
          </Link>
          <Link
            to="/analysis"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/analysis')
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Map className={`w-5 h-5 mr-3 ${isActive('/analysis') ? 'text-blue-600' : 'text-gray-400'}`} />
            Análisis
          </Link>
          <Link
            to="/charts"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/charts')
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <BarChart className={`w-5 h-5 mr-3 ${isActive('/charts') ? 'text-blue-600' : 'text-gray-400'}`} />
            Gráficos
          </Link>
          <Link
            to="/data"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/data')
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Database className={`w-5 h-5 mr-3 ${isActive('/data') ? 'text-blue-600' : 'text-gray-400'}`} />
            Datos
          </Link>
          <Link
            to="/engineering"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/engineering')
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Settings className={`w-5 h-5 mr-3 ${isActive('/engineering') ? 'text-blue-600' : 'text-gray-400'}`} />
            Ingeniería
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500">Estado del Sistema</p>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              <span className="text-xs font-bold text-gray-700">En Línea</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/data" element={<Data />} />
          <Route path="/engineering" element={<Engineering />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
