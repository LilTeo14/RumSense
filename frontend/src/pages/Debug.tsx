import React, { useState, useEffect } from 'react';
import { Terminal, Wifi, WifiOff, Clock, Tag } from 'lucide-react';

interface PositionData {
    data: {
        mapId: number;
        pos: [number, number, number];
        posNoise: [number, number, number];
        time: number;
        // uid and deviceName are NOT here in the actual JSON
    };
    uid: string; // <-- Moved here
    deviceName: string; // <-- Moved here
    name: string;
}

const Debug = () => {
    const [messages, setMessages] = useState<PositionData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Group messages by Tag ID for the status view
    const tagStatus = messages.reduce((acc: Record<string, PositionData>, msg: PositionData) => {
        // Validation: msg.uid is at root, not inside data
        if (msg.uid) {
            acc[msg.uid] = msg;
        }
        return acc;
    }, {} as Record<string, PositionData>);

    const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);

    const connectWs = () => {
        if (wsInstance) {
            wsInstance.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

        ws.onopen = () => {
            setIsConnected(true);
            console.log('Connected to Debug Stream');
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('Disconnected from Debug Stream');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastUpdate(new Date());
                setMessages((prev: PositionData[]) => [data, ...prev].slice(0, 50));
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        };

        setWsInstance(ws);
    };

    useEffect(() => {
        connectWs();
        return () => {
            if (wsInstance) wsInstance.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Debug Console</h2>
                    <p className="text-gray-500 mt-1">Inspección de datos en tiempo real (Port 5000)</p>
                </div>
                <div className="flex items-center gap-3">
                    {!isConnected && (
                        <button
                            onClick={connectWs}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold flex items-center transition-colors shadow-sm"
                        >
                            Reconectar
                        </button>
                    )}
                    <div className={`flex items-center px-4 py-2 rounded-full border ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                        {isConnected ? <Wifi className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />}
                        <span className="font-bold">{isConnected ? 'Conectado' : 'Simulando / Desconectado'}</span>
                    </div>
                </div>
            </header>

            {/* Active Tags Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(tagStatus).sort((a, b) => a.deviceName.localeCompare(b.deviceName)).map((tag: PositionData) => (
                    <div key={tag.uid} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{tag.deviceName}</h3>
                                    <code className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{tag.uid}</code>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">Map ID: {tag.data.mapId}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Posición (X, Y)</p>
                                <div className="flex space-x-2 font-mono text-sm font-bold text-gray-800">
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border text-red-500">X: {tag.data.pos[0].toFixed(4)}m</span>
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border text-green-500">Y: {tag.data.pos[1].toFixed(4)}m</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>{new Date(tag.data.time).toLocaleTimeString()}</span>
                                </div>
                                <span>Noise: {JSON.stringify(tag.data.posNoise)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Raw Data Log */}
            <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-800">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                    <div className="flex items-center">
                        <Terminal className="w-5 h-5 text-green-400 mr-2" />
                        <h3 className="font-bold text-gray-200">Raw Data Stream</h3>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                        Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
                    </span>
                </div>
                <div className="h-96 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-gray-900 custom-scrollbar">
                    {messages.map((msg: PositionData, idx: number) => (
                        <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-green-500 mr-2">[{new Date(msg.data.time).toLocaleTimeString()}]</span>
                            <span className="text-purple-400 font-bold">{msg.name}</span>
                            <span className="text-gray-500 mx-2">ID: {msg.uid}</span>
                            <span className="text-gray-300 break-all">
                                {JSON.stringify(msg)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Debug;
