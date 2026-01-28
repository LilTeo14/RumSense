import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Users, Map, Image } from 'lucide-react';

export default function Engineering() {
    const [tagMappings, setTagMappings] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('tagMappings');
        return saved ? JSON.parse(saved) : {};
    });

    // Map Config State - Initialize from LocalStorage
    const [mapSize, setMapSize] = useState(() => localStorage.getItem('mapSize') || "40");
    const [offsetX, setOffsetX] = useState(() => localStorage.getItem('offsetX') || "-2");
    const [offsetY, setOffsetY] = useState(() => localStorage.getItem('offsetY') || "-2");

    // Background Image Config - Initialize from LocalStorage
    const [bgSize, setBgSize] = useState(() => localStorage.getItem('bgSize') || "100");
    const [bgOffsetX, setBgOffsetX] = useState(() => localStorage.getItem('bgOffsetX') || "0");
    const [bgOffsetY, setBgOffsetY] = useState(() => localStorage.getItem('bgOffsetY') || "0");
    const [bgOpacity, setBgOpacity] = useState(() => localStorage.getItem('bgOpacity') || "1.0");

    // Auto-save map config changes to allow live preview in Map tab
    useEffect(() => {
        localStorage.setItem('mapSize', mapSize);
        localStorage.setItem('offsetX', offsetX);
        localStorage.setItem('offsetY', offsetY);

        localStorage.setItem('bgSize', bgSize);
        localStorage.setItem('bgOffsetX', bgOffsetX);
        localStorage.setItem('bgOffsetY', bgOffsetY);
        localStorage.setItem('bgOpacity', bgOpacity);

        window.dispatchEvent(new Event('storage'));
    }, [mapSize, offsetX, offsetY, bgSize, bgOffsetX, bgOffsetY, bgOpacity]);

    const saveMapConfig = () => {
        // Redundant with auto-save, but keeps the button functional for user reassurance
        alert('Configuración guardada (Live Update activo)');
    };

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Ingeniería y Configuración</h2>
                <p className="text-gray-500">Configuración del sistema y mapeo de hardware</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ID Mapping */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">Mapeo de Etiquetas</h3>
                        <button
                            onClick={() => {
                                const saved = localStorage.getItem('tagMappings');
                                if (saved) setTagMappings(JSON.parse(saved));
                            }}
                            className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualizar
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-64">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Tag ID</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Nombre Visible</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {['T1', 'T2', 'T3', 'T4', 'T5'].map((tagId) => (
                                    <tr key={tagId} className="group">
                                        <td className="py-3 font-mono text-sm text-gray-600">{tagId}</td>
                                        <td className="py-3">
                                            <input
                                                type="text"
                                                value={tagMappings[tagId] || ''}
                                                onChange={(e) => setTagMappings(prev => ({ ...prev, [tagId]: e.target.value }))}
                                                placeholder={`Nombre para ${tagId}`}
                                                className="border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
                                            />
                                        </td>
                                        <td className="py-3">
                                            <button
                                                onClick={() => {
                                                    localStorage.setItem('tagMappings', JSON.stringify(tagMappings));
                                                    window.dispatchEvent(new Event('storage'));
                                                    alert('Mapeo guardado correctamente');
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Guardar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Map Configuration Combined */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Map className="w-5 h-5 mr-3 text-blue-600" />
                            <h3 className="font-bold text-gray-800 text-lg">Configuración del Mapa</h3>
                        </div>
                        <button
                            onClick={saveMapConfig}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Map View */}
                        <div>
                            <h4 className="font-semibold text-gray-600 text-sm border-b pb-1 mb-3">Vista (Coordenadas)</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Zoom / Tamaño (Metros)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="10" max="200" step="1" value={mapSize} onChange={(e) => setMapSize(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={mapSize} onChange={(e) => setMapSize(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Offset X (Horizontal)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="-5" max="5" step="0.01" value={offsetX} onChange={(e) => setOffsetX(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={offsetX} onChange={(e) => setOffsetX(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Offset Y (Vertical)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="-5" max="5" step="0.01" value={offsetY} onChange={(e) => setOffsetY(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={offsetY} onChange={(e) => setOffsetY(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Image */}
                        <div>
                            <h4 className="font-semibold text-gray-600 text-sm border-b pb-1 mb-3 flex items-center gap-2">
                                <Image size={14} /> Imagen de Fondo
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tamaño (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="10" max="200" step="1" value={bgSize} onChange={(e) => setBgSize(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={bgSize} onChange={(e) => setBgSize(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Offset X (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="-5" max="5" step="0.01" value={bgOffsetX} onChange={(e) => setBgOffsetX(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={bgOffsetX} onChange={(e) => setBgOffsetX(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Offset Y (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="-5" max="5" step="0.01" value={bgOffsetY} onChange={(e) => setBgOffsetY(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <input type="number" value={bgOffsetY} onChange={(e) => setBgOffsetY(e.target.value)} className="w-16 border-gray-200 rounded px-2 py-1 text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Opacidad</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={(e) => setBgOpacity(e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <span className="text-xs w-16">{bgOpacity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Thresholds - Moved down */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">Configuración de Interacciones y Alertas</h3>
                        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">Interacciones</h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Distancia de Proximidad</label>
                                        <span className="text-sm font-bold text-blue-600">1.5 m</span>
                                    </div>
                                    <input type="range" min="0.5" max="5.0" step="0.1" defaultValue="1.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Tiempo Mínimo</label>
                                        <span className="text-sm font-bold text-blue-600">5 s</span>
                                    </div>
                                    <input type="range" min="1" max="60" defaultValue="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">Alertas de Comportamiento</h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Max Inactividad</label>
                                        <span className="text-sm font-bold text-blue-600">10 h</span>
                                    </div>
                                    <input type="range" min="1" max="24" defaultValue="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Min Actividad</label>
                                        <span className="text-sm font-bold text-blue-600">500 m/día</span>
                                    </div>
                                    <input type="range" min="100" max="5000" defaultValue="500" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
