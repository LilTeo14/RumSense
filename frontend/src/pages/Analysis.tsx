import React from 'react';
import { Play, Calendar } from 'lucide-react';

export default function Analysis() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Análisis Científico</h2>
                    <p className="text-gray-500">Análisis profundo de métricas de comportamiento</p>
                </div>
                <div className="flex space-x-4">
                    <button className="flex items-center px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700 hover:bg-gray-50">
                        <Calendar className="w-4 h-4 mr-2" />
                        Seleccionar Rango de Fechas
                    </button>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Map Container */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-400 font-medium">Visualización de Mapa Deck.gl (Marcador)</p>
                        {/* TODO: Integrate Deck.gl here */}
                    </div>

                    {/* Playback Controls Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                                <Play className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <span className="text-sm font-mono text-gray-600">12:45:30</span>
                        </div>
                    </div>
                </div>

                {/* Stats Panel */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4">Estadísticas de Sesión</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">ID Seleccionado</label>
                            <div className="mt-1 p-2 bg-blue-50 text-blue-700 rounded font-medium">Bessie (ID: 1)</div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Distancia Total</label>
                            <div className="text-2xl font-bold text-gray-800">5.2 km</div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Velocidad Promedio</label>
                            <div className="text-2xl font-bold text-gray-800">1.2 m/s</div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Uso de Cuadrantes</label>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Noreste</span>
                                    <span className="font-bold">45%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
