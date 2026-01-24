import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, FlipHorizontal, FlipVertical, RotateCw, Radio } from 'lucide-react';

interface PositionData {
    data: {
        mapId: number;
        pos: [number, number, number];
        posNoise: [number, number, number];
        time: number;
    };
    uid: string;
    deviceName: string;
    name: string;
}

interface Beacon {
    name: string;
    uid: string;
    type: number;
    coordinate: {
        coords: [number, number, number];
    };
}

// const MAP_SIZE_METERS = 40; 

export default function MapPage() {
    const [mapSize, setMapSize] = useState(() => {
        const saved = localStorage.getItem('mapSize');
        return saved ? parseInt(saved, 10) : 40; // Default to 40 if not set
    });

    useEffect(() => {
        const handleStorage = () => {
            const saved = localStorage.getItem('mapSize');
            if (saved) setMapSize(parseInt(saved, 10));
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    const [positions, setPositions] = useState<Record<string, PositionData>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [flipX, setFlipX] = useState(true);
    const [flipY, setFlipY] = useState(true);
    const [rotation, setRotation] = useState(0);
    const [beacons, setBeacons] = useState<Beacon[]>([]);

    const fetchBeacons = async () => {
        try {
            // Trying localhost instead of host.docker.internal for browser access
            const response = await fetch('http://localhost:8088/openapi/v1/devices?deviceType=2');
            const result = await response.json();
            if (result.data && result.data.records) {
                const fetchedBeacons = result.data.records as Beacon[];
                setBeacons(fetchedBeacons);

                // Auto-adjust map size
                let maxCoord = 0;
                fetchedBeacons.forEach(b => {
                    maxCoord = Math.max(maxCoord, b.coordinate.coords[0], b.coordinate.coords[1]);
                });

                if (maxCoord > 0) {
                    const newSize = Math.ceil(maxCoord * 1.2); // Add 20% padding
                    setMapSize(newSize);
                    localStorage.setItem('mapSize', newSize.toString());
                    window.dispatchEvent(new Event('storage'));
                    alert(`Cargados ${fetchedBeacons.length} beacons exitosamente. Tamaño del mapa ajustado a ${newSize}m.`);
                } else {
                    alert(`Cargados ${fetchedBeacons.length} beacons exitosamente.`);
                }
            }
        } catch (error) {
            console.error('Error fetching beacons:', error);
            alert('Error al cargar beacons. Asegúrese de que el servicio uBEACON esté corriendo en el puerto 8088.');
        }
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
            setIsConnected(true);
            console.log('Connected to Map Stream');
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('Disconnected from Map Stream');
        };

        ws.onmessage = (event) => {
            try {
                const data: PositionData = JSON.parse(event.data);
                // Update the position logic
                // Check if valid message with uid
                if (data.uid) {
                    setPositions(prev => ({
                        ...prev,
                        [data.uid]: data
                    }));
                }
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const padding = mapSize * 0.1;
    const viewMin = -padding;
    const viewRange = mapSize + 2 * padding;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mapa en Tiempo Real</h2>
                    <p className="text-gray-500 text-sm">Dimensión: {mapSize}x{mapSize} metros (Vista: {viewMin.toFixed(1)}m a {(mapSize + padding).toFixed(1)}m)</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={fetchBeacons}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Cargar Beacons"
                        >
                            <Radio className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button
                            onClick={() => setFlipX(!flipX)}
                            className={`p-2 rounded-md transition-colors ${flipX ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Reflejar Horizontalmente"
                        >
                            <FlipHorizontal className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setFlipY(!flipY)}
                            className={`p-2 rounded-md transition-colors ${flipY ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Reflejar Verticalmente"
                        >
                            <FlipVertical className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Rotar 90°"
                        >
                            <RotateCw className="w-5 h-5" style={{ transform: `rotate(${rotation}deg)` }} />
                        </button>
                    </div>

                    <div className={`flex items-center px-3 py-1 rounded-full border text-sm ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                        {isConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                        <span className="font-bold">{isConnected ? 'En Línea' : 'Desconectado'}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex items-center justify-center p-8">
                {/* Map Container - Aspect Ratio Square */}
                <div
                    className="relative bg-gray-50 border-2 border-gray-200 rounded-lg shadow-inner"
                    style={{
                        width: '100%',
                        maxWidth: '80vh',
                        aspectRatio: '1 / 1'
                    }}
                >
                    {/* Grid Lines (Optional visual guide) */}
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-10">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="border border-gray-400"></div>
                        ))}
                    </div>

                    {/* Beacons */}
                    {beacons.map((beacon) => {
                        const x = Math.max(0, Math.min(beacon.coordinate.coords[0], mapSize));
                        const y = Math.max(0, Math.min(beacon.coordinate.coords[1], mapSize));

                        // Normalize with padding
                        let nx = (x - viewMin) / viewRange;
                        let ny = (y - viewMin) / viewRange;

                        // Apply Transformations
                        if (flipX) nx = 1 - nx;
                        if (flipY) ny = 1 - ny;

                        // Apply Rotation
                        let finalX = nx;
                        let finalY = ny;

                        switch (rotation) {
                            case 90:
                                finalX = ny;
                                finalY = 1 - nx;
                                break;
                            case 180:
                                finalX = 1 - nx;
                                finalY = 1 - ny;
                                break;
                            case 270:
                                finalX = 1 - ny;
                                finalY = nx;
                                break;
                        }

                        // Convert to percentage
                        const left = finalX * 100;
                        const bottom = finalY * 100;

                        return (
                            <div
                                key={beacon.uid || beacon.name}
                                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 ease-linear"
                                style={{
                                    left: `${left}%`,
                                    bottom: `${bottom}%`,
                                }}
                            >
                                {/* Beacon Icon */}
                                <div className="p-1 bg-gray-700 rounded-sm shadow-md border border-white z-10">
                                    <Radio className="w-3 h-3 text-white" />
                                </div>
                                {/* Label */}
                                <div className="mt-1 px-1 py-0.5 bg-white/90 backdrop-blur border border-gray-200 rounded text-[9px] font-bold text-gray-600 shadow-sm whitespace-nowrap z-20">
                                    {beacon.name}
                                </div>
                            </div>
                        );
                    })}

                    {/* Tags */}
                    {Object.values(positions).map((tag) => {
                        const x = Math.max(0, Math.min(tag.data.pos[0], mapSize));
                        const y = Math.max(0, Math.min(tag.data.pos[1], mapSize));

                        // Normalize with padding
                        let nx = (x - viewMin) / viewRange;
                        let ny = (y - viewMin) / viewRange;

                        // Apply Transformations
                        if (flipX) nx = 1 - nx;
                        if (flipY) ny = 1 - ny;

                        // Apply Rotation
                        let finalX = nx;
                        let finalY = ny;

                        switch (rotation) {
                            case 90:
                                finalX = ny;
                                finalY = 1 - nx;
                                break;
                            case 180:
                                finalX = 1 - nx;
                                finalY = 1 - ny;
                                break;
                            case 270:
                                finalX = 1 - ny;
                                finalY = nx;
                                break;
                        }

                        // Convert to percentage
                        const left = finalX * 100;
                        const bottom = finalY * 100;

                        return (
                            <div
                                key={tag.uid}
                                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 ease-linear"
                                style={{
                                    left: `${left}%`,
                                    bottom: `${bottom}%`,
                                }}
                            >
                                {/* Dot */}
                                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md animate-pulse relative z-10"></div>
                                {/* Label */}
                                <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur border border-gray-200 rounded text-[10px] font-bold text-gray-700 shadow-sm whitespace-nowrap z-20">
                                    {tag.deviceName}
                                </div>
                                {/* Coordinates tooltip */}
                                <div className="text-[9px] text-gray-400 font-mono bg-white/80 px-1 rounded mt-0.5">
                                    ({x.toFixed(2)}, {y.toFixed(2)})
                                </div>
                            </div>
                        );
                    })}

                    {/* Origin Label */}
                    <div className="absolute bottom-2 left-2 text-xs font-mono text-gray-400 font-bold bg-white/50 px-1 rounded">
                        ({viewMin.toFixed(1)}, {viewMin.toFixed(1)})
                    </div>
                </div>
            </div>
        </div>
    );
}
