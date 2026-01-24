import React from 'react';
import { Save, RefreshCw, Users, Map } from 'lucide-react';

export default function Engineering() {
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
                        <button className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualizar
                        </button>
                    </div>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">UID (Nooploop)</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Nombre Visible</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Especie</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <tr className="group">
                                <td className="py-3 font-mono text-sm text-gray-600">ea221ffdb4</td>
                                <td className="py-3">
                                    <input type="text" defaultValue="Bessie" className="border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="py-3 text-sm text-gray-600">Vaca</td>
                                <td className="py-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Guardar</button>
                                </td>
                            </tr>
                            <tr className="group">
                                <td className="py-3 font-mono text-sm text-gray-600">f4a12bb99c</td>
                                <td className="py-3">
                                    <input type="text" defaultValue="Molly" className="border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="py-3 text-sm text-gray-600">Vaca</td>
                                <td className="py-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Guardar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Thresholds */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-lg">Umbrales de Alerta</h3>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Duración Máx. de Descanso (Horas)</label>
                                <span className="text-sm font-bold text-blue-600">10.0 h</span>
                            </div>
                            <input type="range" min="1" max="24" defaultValue="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <p className="mt-1 text-xs text-gray-500">Alerta si el animal está inactivo por más tiempo que esto.</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Actividad Mínima (Metros/Día)</label>
                                <span className="text-sm font-bold text-blue-600">500 m</span>
                            </div>
                            <input type="range" min="100" max="5000" defaultValue="500" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <p className="mt-1 text-xs text-gray-500">Alerta si la distancia diaria es menor a este valor.</p>
                        </div>
                    </div>
                </div>

                {/* Interaction Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Users className="w-5 h-5 mr-3 text-blue-600" />
                            <h3 className="font-bold text-gray-800 text-lg">Configuración de Interacciones</h3>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Configuración
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Distancia de Proximidad</label>
                                <span className="text-sm font-bold text-blue-600">1.5 m</span>
                            </div>
                            <input type="range" min="0.5" max="5.0" step="0.1" defaultValue="1.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <p className="mt-1 text-xs text-gray-500">Distancia máxima entre tags para considerar un posible contacto.</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Tiempo Mínimo de Permanencia</label>
                                <span className="text-sm font-bold text-blue-600">5 seg</span>
                            </div>
                            <input type="range" min="1" max="60" defaultValue="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <p className="mt-1 text-xs text-gray-500">Tiempo que deben permanecer dentro del rango para registrar una interacción.</p>
                        </div>
                    </div>
                </div>
                {/* Map Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Map className="w-5 h-5 mr-3 text-blue-600" />
                            <h3 className="font-bold text-gray-800 text-lg">Configuración del Mapa</h3>
                        </div>
                        <button
                            onClick={() => {
                                const input = document.getElementById('mapSizeInput') as HTMLInputElement;
                                if (input) {
                                    localStorage.setItem('mapSize', input.value);
                                    window.dispatchEvent(new Event('storage')); // Notify other components
                                    alert('Configuración guardada correctamente');
                                }
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Tamaño del Mapa (Metros)</label>
                            </div>
                            <input
                                id="mapSizeInput"
                                type="number"
                                min="10"
                                max="1000"
                                defaultValue={localStorage.getItem('mapSize') || "40"}
                                className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Define las dimensiones del área de visualización (Ancho x Alto).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
