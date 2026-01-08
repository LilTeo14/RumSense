import React from 'react';
import { Save, RefreshCw } from 'lucide-react';

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
            </div>
        </div>
    );
}
