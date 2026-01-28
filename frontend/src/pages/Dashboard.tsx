import React, { useState, useEffect } from 'react';
import { Battery, Activity, Moon, AlertTriangle, CheckCircle, Zap, Users, MapPin } from 'lucide-react';

interface Tag {
    id: string;
    x: number;
    y: number;
    last_seen: number;
    status: string;
}

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'active') return <CheckCircle className="w-6 h-6 text-green-500" />;
    return <AlertTriangle className="w-6 h-6 text-red-500" />;
};

const TagCard = ({ tag, name }: { tag: Tag, name: string }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${tag.status !== 'active' ? 'opacity-70' : ''}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tag.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                    <span className="font-bold text-lg">{name ? name[0].toUpperCase() : tag.id[0]}</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{name || tag.id}</h3>
                    <p className="text-xs text-gray-500">ID: {tag.id}</p>
                </div>
            </div>
            <StatusIcon status={tag.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                <div className="flex items-center text-blue-600 mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Última Posición</span>
                </div>
                <p className="text-lg font-bold text-gray-800">({tag.x.toFixed(2)}, {tag.y.toFixed(2)})</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center text-purple-600 mb-1">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Estado</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{tag.status === 'active' ? 'Activo' : 'Sin Datos'}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center text-orange-600 mb-1">
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Señal</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{tag.status === 'active' ? 'Fuerte' : 'Perdida'}</p>
            </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center">
                <Battery className="w-4 h-4 mr-2" />
                <span>--%</span>
            </div>
            <span>{tag.status !== 'active' ? 'Desconectado' : 'En línea'}</span>
        </div>
    </div>
);

export default function Dashboard() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagMappings, setTagMappings] = useState<Record<string, string>>({});

    useEffect(() => {
        // Load mappings
        const savedMappings = localStorage.getItem('tagMappings');
        if (savedMappings) setTagMappings(JSON.parse(savedMappings));

        const fetchTags = async () => {
            try {
                const response = await fetch('http://localhost:8000/tags');
                const data = await response.json();
                if (data.tags) {
                    setTags(data.tags);
                }
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };

        fetchTags(); // Initial fetch
        const interval = setInterval(fetchTags, 2000); // Poll every 2s

        return () => clearInterval(interval);
    }, []);

    // Ensure we always have at least placeholders for T1-T5 if DB is empty? 
    // Or just show what we have. The prompt implies explicit T1-T5 monitoring.
    // I'll assume DB fills up as UDP comes in. If empty, it shows nothing until data arrives.
    // Alternatively, I could merge with T1-T5 list if I want them to appear inactive initially.
    // Let's stick to showing DB content for now to be "real".

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Panel de Salud</h2>
                <p className="text-gray-500">Monitoreo en tiempo real del rebaño</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tags.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400">
                        Esperando datos de las etiquetas...
                    </div>
                ) : (
                    tags.map(tag => (
                        <TagCard key={tag.id} tag={tag} name={tagMappings[tag.id] || tag.id} />
                    ))
                )}
            </div>
        </div>
    );
}
