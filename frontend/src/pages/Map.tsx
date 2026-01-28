import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, FlipHorizontal, FlipVertical, RotateCw, Radio, History, Play, Pause, FastForward, Activity } from 'lucide-react';

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

interface HistoryLog {
    uid: string;
    deviceName: string;
    pos: [number, number, number];
    time: number;
}

interface Beacon {
    name: string;
    uid: string;
    type: number;
    coordinate: {
        coords: [number, number, number];
    };
}

interface StatsData {
    deviceName: string;
    totalDistance: number;
    movingTimeMinutes: number;
}

export default function MapPage() {
    // --- Settings & Beacons ---
    // Offset and Size
    const [mapSize, setMapSize] = useState(() => {
        const saved = localStorage.getItem('mapSize');
        return saved ? parseFloat(saved) : 10.0;
    });

    // Default offsets to 0, or read from storage
    const [offsetX, setOffsetX] = useState(() => {
        const saved = localStorage.getItem('offsetX');
        return saved ? parseFloat(saved) : -2.0;
    });
    const [offsetY, setOffsetY] = useState(() => {
        const saved = localStorage.getItem('offsetY');
        return saved ? parseFloat(saved) : -2.0;
    });

    // Background Image State
    const [bgSize, setBgSize] = useState(() => {
        const saved = localStorage.getItem('bgSize');
        return saved ? parseFloat(saved) : 100;
    });
    const [bgOffsetX, setBgOffsetX] = useState(() => {
        const saved = localStorage.getItem('bgOffsetX');
        return saved ? parseFloat(saved) : 0;
    });
    const [bgOffsetY, setBgOffsetY] = useState(() => {
        const saved = localStorage.getItem('bgOffsetY');
        return saved ? parseFloat(saved) : 0;
    });
    const [bgOpacity, setBgOpacity] = useState(() => {
        const saved = localStorage.getItem('bgOpacity');
        return saved ? parseFloat(saved) : 1.0;
    });

    const [tagMappings, setTagMappings] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('tagMappings');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        const handleStorage = () => {
            setMapSize(parseFloat(localStorage.getItem('mapSize') || "10"));
            setOffsetX(parseFloat(localStorage.getItem('offsetX') || "-2"));
            setOffsetY(parseFloat(localStorage.getItem('offsetY') || "-2"));

            setBgSize(parseFloat(localStorage.getItem('bgSize') || "100"));
            setBgOffsetX(parseFloat(localStorage.getItem('bgOffsetX') || "0"));
            setBgOffsetY(parseFloat(localStorage.getItem('bgOffsetY') || "0"));
            setBgOpacity(parseFloat(localStorage.getItem('bgOpacity') || "1.0"));

            setFlipX(localStorage.getItem('flipX') === 'true');
            setFlipY(localStorage.getItem('flipY') === 'true');
            setRotation(parseInt(localStorage.getItem('rotation') || '0'));

            const savedMappings = localStorage.getItem('tagMappings');
            if (savedMappings) setTagMappings(JSON.parse(savedMappings));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);



    const [flipX, setFlipX] = useState(() => localStorage.getItem('flipX') === 'true');
    const [flipY, setFlipY] = useState(() => localStorage.getItem('flipY') === 'true');
    const [rotation, setRotation] = useState(() => parseInt(localStorage.getItem('rotation') || '0'));
    const [beacons, setBeacons] = useState<Beacon[]>([]);

    const fetchBeacons = async () => {
        try {
            const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8088/openapi/v1/devices?deviceType=2`);
            const result = await response.json();
            if (result.data && result.data.records) {
                const fetchedBeacons = result.data.records as Beacon[];
                setBeacons(fetchedBeacons);
                // No auto-resize anymore
            }
        } catch (error) {
            console.error('Error fetching beacons:', error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchBeacons();
    }, []);

    // --- State: View Mode ---
    const [viewMode, setViewMode] = useState<'live' | 'history'>('live');

    // --- Live Mode Logic ---
    const [livePositions, setLivePositions] = useState<Record<string, PositionData>>({});
    const [lastUpdateTimes, setLastUpdateTimes] = useState<Record<string, number>>({});
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (viewMode !== 'live') {
            setIsConnected(false);
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onmessage = (event) => {
            try {
                const data: PositionData = JSON.parse(event.data);
                if (data.uid) {
                    setLivePositions(prev => ({ ...prev, [data.uid]: data }));
                    setLastUpdateTimes(prev => ({ ...prev, [data.uid]: Date.now() }));
                }
            } catch (e) { console.error(e); }
        };

        const interval = setInterval(() => {
            // Force re-render for offline status
            setLastUpdateTimes(prev => ({ ...prev }));
        }, 1000);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, [viewMode]);

    // --- History Mode Logic ---
    const [historyData, setHistoryData] = useState<HistoryLog[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [historyPositions, setHistoryPositions] = useState<Record<string, HistoryLog>>({});
    const animationRef = useRef<number>();

    const fetchHistory = async () => {
        if (!startDate || !endDate) return alert('Seleccione rango de fechas');
        const startTs = new Date(startDate).getTime();
        const endTs = new Date(endDate).getTime();
        try {
            const res = await fetch(`/api/history?start=${startTs}&end=${endTs}`);
            const data = await res.json();
            setHistoryData(data);
            if (data.length > 0) {
                setPlaybackTime(startTs);
                alert(`Cargados ${data.length} puntos históricos.`);
            } else {
                alert('No hay datos en este rango.');
            }

            // Also fetch stats for this range
            fetchStats(startTs, endTs);
        } catch (e) {
            console.error(e);
            alert('Error cargando historial');
        }
    };

    // Playback Loop
    useEffect(() => {
        if (!isPlaying || historyData.length === 0) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        let lastFrameTime = performance.now();

        const animate = (time: number) => {
            const delta = time - lastFrameTime;
            lastFrameTime = time;

            setPlaybackTime(prev => {
                const nextTime = prev + (delta * playbackSpeed);
                const endTs = new Date(endDate).getTime();
                if (nextTime >= endTs) {
                    setIsPlaying(false);
                    return endTs;
                }
                return nextTime;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, historyData, endDate, playbackSpeed]);

    // Update positions based on playbackTime
    useEffect(() => {
        if (viewMode === 'history' && historyData.length > 0) {
            const active: Record<string, HistoryLog> = {};
            for (const log of historyData) {
                if (log.time <= playbackTime) {
                    active[log.uid] = log;
                } else {
                    break;
                }
            }
            setHistoryPositions(active);
        }
    }, [playbackTime, historyData, viewMode]);


    // --- Stats Logic ---
    const [stats, setStats] = useState<Record<string, StatsData>>({});

    const fetchStats = async (start: number, end: number) => {
        try {
            const res = await fetch(`/api/stats?start=${start}&end=${end}`);
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
    };

    // Auto-fetch stats for live mode (last hour)
    useEffect(() => {
        let interval: any;
        if (viewMode === 'live') {
            const updateLiveStats = () => {
                const now = Date.now();
                const oneHourAgo = now - 3600000; // 1 hour
                fetchStats(oneHourAgo, now);
            };

            updateLiveStats(); // Initial call
            interval = setInterval(updateLiveStats, 10000); // Update every 10s
        }
        return () => clearInterval(interval);
    }, [viewMode]);

    // --- Render Helpers ---
    // NO PADDING anymore, precise manual control
    // User sees [offsetX, offsetX + mapSize]

    // Normalized Coordinate Calculation
    const getNormalized = (x: number, y: number) => {
        // Raw normalized 0..1 relative to view
        let nx = (x - offsetX) / mapSize;
        let ny = (y - offsetY) / mapSize;

        // Clamp only for drawing outside? Or just let it flow out? 
        // User wants fixed view.

        if (flipX) nx = 1 - nx;
        if (flipY) ny = 1 - ny;

        let finalX = nx;
        let finalY = ny;

        switch (rotation) {
            case 90: finalX = ny; finalY = 1 - nx; break;
            case 180: finalX = 1 - nx; finalY = 1 - ny; break;
            case 270: finalX = 1 - ny; finalY = nx; break;
        }
        return { x: finalX * 100, y: finalY * 100 };
    };

    const displayPositions = viewMode === 'live'
        ? Object.values(livePositions).map(p => ({
            uid: p.uid,
            deviceName: p.deviceName,
            x: p.data.pos[0],
            y: p.data.pos[1],
            isOffline: (Date.now() - (lastUpdateTimes[p.uid] || 0)) > 5000
        }))
        : Object.values(historyPositions).map(p => ({
            uid: p.uid,
            deviceName: p.deviceName,
            x: p.pos[0],
            y: p.pos[1],
            isOffline: (playbackTime - p.time) > 5000
        }));

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4 font-sans">
            {/* Main Column */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header */}
                <header className="mb-4 flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {viewMode === 'live' ? <Wifi className="text-green-500" /> : <History className="text-blue-500" />}
                            {viewMode === 'live' ? 'Monitoreo en Vivo' : 'Reproducción Histórica'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                            <button
                                onClick={() => setViewMode('live')}
                                className={`px-4 py-2 rounded-md transition-all ${viewMode === 'live' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                En Vivo
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                className={`px-4 py-2 rounded-md transition-all ${viewMode === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Historial
                            </button>
                        </div>
                        {viewMode === 'live' && (
                            <div className={`flex items-center px-3 py-1 rounded-full border text-sm ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </div>
                        )}
                    </div>
                </header>

                {/* History Controls */}
                {viewMode === 'history' && (
                    <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Inicio</label>
                            <input
                                type="datetime-local"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fin</label>
                            <input
                                type="datetime-local"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchHistory}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition"
                        >
                            Cargar Datos
                        </button>

                        {historyData.length > 0 && (
                            <div className="flex-1 flex items-center gap-4 ml-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                </button>

                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={new Date(startDate).getTime()}
                                        max={new Date(endDate).getTime()}
                                        value={playbackTime}
                                        onChange={e => {
                                            setPlaybackTime(Number(e.target.value));
                                            setIsPlaying(false);
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                                        <span>{new Date(playbackTime).toLocaleTimeString()}</span>
                                        <span>{playbackSpeed}x</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPlaybackSpeed(s => s >= 50 ? 1 : s + 5)}
                                    className="flex flex-col items-center text-xs font-bold text-gray-500 hover:text-blue-600"
                                >
                                    <FastForward className="w-4 h-4 mb-0.5" />
                                    {playbackSpeed}x
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Map Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex flex-col items-center justify-center p-8">


                    <div
                        className="relative bg-gray-50 border-2 border-gray-200 rounded-lg shadow-inner select-none transition-all duration-300 overflow-hidden"
                        style={{ width: '100%', maxWidth: '80vh', aspectRatio: '1/1' }}
                    >
                        {/* Background Image */}
                        <img
                            src="/Fondo.png?v=updated"
                            alt="Background"
                            className="absolute pointer-events-none transition-all duration-300"
                            style={{
                                width: `${bgSize}%`,
                                left: `${(bgOffsetX / mapSize) * 100}%`,
                                bottom: `${(bgOffsetY / mapSize) * 100}%`,
                                opacity: bgOpacity,
                                maxWidth: 'none'
                            }}
                        />
                        {/* Grid */}
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-10">
                            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border border-gray-400"></div>)}
                        </div>

                        {/* Beacons */}
                        {beacons.map((beacon) => {
                            const { x, y } = getNormalized(beacon.coordinate.coords[0], beacon.coordinate.coords[1]);
                            return (
                                <div key={beacon.uid || beacon.name} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2" style={{ left: `${x}%`, bottom: `${y}%` }}>
                                    <div className="p-1 bg-gray-700 rounded-sm shadow-md border border-white z-10"><Radio className="w-3 h-3 text-white" /></div>
                                    <div className="mt-1 px-1 py-0.5 bg-white/90 rounded text-[9px] font-bold text-gray-600 shadow-sm">{beacon.name}</div>
                                </div>
                            );
                        })}

                        {/* Tags */}
                        {displayPositions.map((tag) => {
                            const { x, y } = getNormalized(tag.x, tag.y);
                            const displayName = tagMappings[tag.deviceName] || tag.deviceName;

                            return (
                                <div
                                    key={tag.uid}
                                    className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 ease-linear ${tag.isOffline ? 'opacity-40 grayscale' : 'opacity-100'}`}
                                    style={{ left: `${x}%`, bottom: `${y}%` }}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10 ${tag.isOffline ? 'bg-gray-400' : 'bg-blue-600 animate-pulse'}`}></div>
                                    <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur border border-gray-200 rounded text-[10px] font-bold text-gray-700 shadow-sm whitespace-nowrap z-20">
                                        {displayName}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-mono bg-white/80 px-1 rounded mt-0.5">
                                        ({Number(tag.x).toFixed(2)}, {Number(tag.y).toFixed(2)})
                                    </div>
                                </div>
                            );
                        })}

                        {/* Origin Label */}
                        <div className="absolute bottom-2 left-2 text-xs font-mono text-gray-400 font-bold bg-white/50 px-1 rounded">
                            ({offsetX.toFixed(1)}, {offsetY.toFixed(1)})
                        </div>
                        {/* Top Right Label (Max) */}
                        <div className="absolute top-2 right-2 text-xs font-mono text-gray-400 font-bold bg-white/50 px-1 rounded">
                            ({(offsetX + mapSize).toFixed(1)}, {(offsetY + mapSize).toFixed(1)})
                        </div>
                    </div>

                    {/* Manual Correction Readout */}
                    <div className="mt-4 flex gap-6 text-xs font-mono text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
                        <div>
                            <span className="font-bold">ZOOM (Size):</span> {mapSize.toFixed(2)}m
                        </div>
                        <div>
                            <span className="font-bold">OFFSET X:</span> {offsetX.toFixed(2)}m
                        </div>
                        <div>
                            <span className="font-bold">OFFSET Y:</span> {offsetY.toFixed(2)}m
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Sidebar */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 text-gray-800">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Estadísticas</h3>
                </div>

                <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {viewMode === 'live' ? 'Última Hora' : 'Rango Seleccionado'}
                    </div>

                    {Object.keys(stats).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No hay datos suficientes para generar estadísticas.</p>
                    ) : (
                        Object.entries(stats).map(([uid, stat]) => {
                            const displayName = tagMappings[stat.deviceName] || stat.deviceName;
                            return (
                                <div key={uid} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-gray-800">{displayName}</span>
                                        <span className="text-xs bg-white border px-1.5 py-0.5 rounded text-gray-500">ID: {uid}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">Tiempo en Movimiento</div>
                                            <div className="font-mono font-bold text-gray-900 text-lg">
                                                {stat.movingTimeMinutes} <span className="text-sm text-gray-500 font-normal">min</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">Distancia Recorrida</div>
                                            <div className="font-mono font-bold text-gray-900 text-lg">
                                                {stat.totalDistance} <span className="text-sm text-gray-500 font-normal">m</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
