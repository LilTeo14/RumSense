import React from 'react';
import { Battery, Activity, Moon, AlertTriangle, CheckCircle } from 'lucide-react';

// Mock Data
const ANIMALS = [
    { id: '1', name: 'Bessie', status: 'OK', battery: 85, distance: 2.4, rest: 6.5 },
    { id: '2', name: 'Molly', status: 'WARNING', battery: 42, distance: 0.8, rest: 11.2 },
    { id: '3', name: 'Daisy', status: 'OK', battery: 91, distance: 3.1, rest: 5.8 },
    { id: '4', name: 'Bella', status: 'CRITICAL', battery: 12, distance: 0.1, rest: 14.0 },
    { id: '5', name: 'Luna', status: 'OK', battery: 78, distance: 2.8, rest: 7.1 },
];

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OK') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (status === 'WARNING') return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <AlertTriangle className="w-6 h-6 text-red-500" />;
};

const AnimalCard = ({ animal }: { animal: any }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${animal.status === 'OK' ? 'bg-green-100 text-green-600' :
                        animal.status === 'WARNING' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    }`}>
                    <span className="font-bold text-lg">{animal.name[0]}</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{animal.name}</h3>
                    <p className="text-xs text-gray-500">ID: {animal.id}</p>
                </div>
            </div>
            <StatusIcon status={animal.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center text-blue-600 mb-1">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Distancia</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{animal.distance} km</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center text-purple-600 mb-1">
                    <Moon className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Descanso</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{animal.rest} h</p>
            </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center">
                <Battery className="w-4 h-4 mr-2" />
                <span>{animal.battery}%</span>
            </div>
            <span>Actualizado hace 2m</span>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Panel de Salud</h2>
                <p className="text-gray-500">Monitoreo en tiempo real del rebaño</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ANIMALS.map(animal => (
                    <AnimalCard key={animal.id} animal={animal} />
                ))}
            </div>
        </div>
    );
}
