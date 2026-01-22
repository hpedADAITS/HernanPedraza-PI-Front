import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Music, Heart } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';

export function SongSelection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);

  const songs = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synthwave', duration: '3:20' },
    { id: 2, title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', duration: '3:21' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', genre: 'Disco Pop', duration: '3:23' },
    { id: 4, title: 'Uptown Funk', artist: 'Bruno Mars', genre: 'Funk', duration: '4:30' },
    { id: 5, title: 'Good as Hell', artist: 'Lizzo', genre: 'Hip Hop', duration: '3:33' },
    { id: 6, title: 'Dance The Night', artist: 'Dua Lipa', genre: 'Dance Pop', duration: '2:53' },
  ];

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSong = (id: number) => {
    setSelectedSongs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAddSongs = () => {
    if (selectedSongs.length > 0) {
      alert(`Added ${selectedSongs.length} song(s) to queue!`);
      navigate(-1);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-down">
          <h1 className="text-3xl font-bold text-slate-900">Select Songs</h1>
          <p className="text-slate-600 mt-1">Browse and select songs to add to the queue</p>
        </div>

        {/* Search */}
        <div className="animate-fade-in-up animation-delay-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs or artists..."
              className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Songs Grid */}
        <div className="animate-fade-in-up animation-delay-200">
          <div className="grid gap-3">
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSongs.includes(song.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center text-white">
                        <Music size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{song.title}</p>
                        <p className="text-sm text-slate-600">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {song.genre}
                      </span>
                      <span className="text-sm text-slate-600">{song.duration}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSong(song.id);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedSongs.includes(song.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {selectedSongs.includes(song.id) ? <Plus size={20} /> : <Heart size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Music size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">No songs found matching your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="animate-fade-in-up animation-delay-300 flex gap-4 sticky bottom-0 bg-white p-4 rounded-lg shadow-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSongs}
            disabled={selectedSongs.length === 0}
            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors"
          >
            Add {selectedSongs.length > 0 ? `(${selectedSongs.length})` : 'Songs'}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
