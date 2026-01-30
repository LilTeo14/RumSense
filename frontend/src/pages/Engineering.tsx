import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Users, Map, Image, FlipHorizontal, FlipVertical, RotateCw, Radio } from 'lucide-react';

export default function Engineering() {
    const [tagMappings, setTagMappings] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('tagMappings');
        return saved ? JSON.parse(saved) : {};
    });

    // Map Config State - Initialize from LocalStorage
    const [mapWidth, setMapWidth] = useState(() => localStorage.getItem('mapWidth') || "10");
    const [mapHeight, setMapHeight] = useState(() => localStorage.getItem('mapHeight') || "10");
    const [offsetX, setOffsetX] = useState(() => localStorage.getItem('offsetX') || "-2");
    const [offsetY, setOffsetY] = useState(() => localStorage.getItem('offsetY') || "-2");

    // Background Image Config - Initialize from LocalStorage
    const [bgWidth, setBgWidth] = useState(() => localStorage.getItem('bgWidth') || "10");
    const [bgHeight, setBgHeight] = useState(() => localStorage.getItem('bgHeight') || "10");
    const [bgOffsetX, setBgOffsetX] = useState(() => localStorage.getItem('bgOffsetX') || "0");
    const [bgOffsetY, setBgOffsetY] = useState(() => localStorage.getItem('bgOffsetY') || "0");
    const [bgOpacity, setBgOpacity] = useState(() => localStorage.getItem('bgOpacity') || "1.0");
    const [flipX, setFlipX] = useState(() => localStorage.getItem('flipX') === 'true');
    const [flipY, setFlipY] = useState(() => localStorage.getItem('flipY') === 'true');
    const [rotation, setRotation] = useState(() => parseInt(localStorage.getItem('rotation') || '0'));

    // Auto-save map config changes to allow live preview in Map tab
    useEffect(() => {
        localStorage.setItem('mapWidth', mapWidth);
        localStorage.setItem('mapHeight', mapHeight);
        localStorage.setItem('offsetX', offsetX);
        localStorage.setItem('offsetY', offsetY);

        localStorage.setItem('bgWidth', bgWidth);
        localStorage.setItem('bgHeight', bgHeight);
        localStorage.setItem('bgOffsetX', bgOffsetX);
        localStorage.setItem('bgOffsetY', bgOffsetY);
        localStorage.setItem('bgOpacity', bgOpacity);
        localStorage.setItem('flipX', flipX.toString());
        localStorage.setItem('flipY', flipY.toString());
        localStorage.setItem('rotation', rotation.toString());

        window.dispatchEvent(new Event('storage'));
    }, [mapWidth, mapHeight, offsetX, offsetY, bgWidth, bgHeight, bgOffsetX, bgOffsetY, bgOpacity, flipX, flipY, rotation]);

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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Ancho (X) Metros</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={mapWidth}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapWidth(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Alto (Y) Metros</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={mapHeight}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapHeight(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Offset X (Horizontal)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={offsetX}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOffsetX(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Offset Y (Vertical)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={offsetY}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOffsetY(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Background Image */}
                        <div>
                            <h4 className="font-semibold text-gray-600 text-sm border-b pb-1 mb-3 flex items-center gap-2">
                                <Image size={14} /> Imagen de Fondo
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Ancho Img (m)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bgWidth}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgWidth(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Alto Img (m)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bgHeight}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgHeight(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Offset X (Metros)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bgOffsetX}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgOffsetX(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Offset Y (Metros)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bgOffsetY}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgOffsetY(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Opacidad</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={bgOpacity}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgOpacity(e.target.value)}
                                        className="w-24 border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                    />
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

                {/* Beacon Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Radio className="w-5 h-5 mr-3 text-blue-600" />
                            <h3 className="font-bold text-gray-800 text-lg">Configuración de Beacons</h3>
                        </div>
                        <button
                            onClick={() => alert('Configuración de beacons guardada')}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </button>
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-gray-500">Ajusta la orientación y rotación de los beacons en el mapa.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFlipX(!flipX)}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${flipX ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                            >
                                <FlipHorizontal size={24} />
                                <span className="text-xs font-bold uppercase tracking-wider">Reflejar X</span>
                            </button>
                            <button
                                onClick={() => setFlipY(!flipY)}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${flipY ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                            >
                                <FlipVertical size={24} />
                                <span className="text-xs font-bold uppercase tracking-wider">Reflejar Y</span>
                            </button>
                            <button
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 text-gray-500 transition-all"
                            >
                                <RotateCw size={24} />
                                <span className="text-xs font-bold uppercase tracking-wider">Rotar {rotation}°</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
