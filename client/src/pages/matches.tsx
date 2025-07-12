import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Trophy, Clock } from "lucide-react";
import type { Match, ActiveMatch, Athlete } from "@shared/schema";

export default function Matches() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRing, setSelectedRing] = useState("A");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRing, setFilterRing] = useState("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useRealtime();

  const { data: activeMatches, isLoading: activeMatchesLoading } = useQuery({
    queryKey: ['/api/dashboard/active-matches'],
    queryFn: api.getActiveMatches,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: allMatches, isLoading: allMatchesLoading } = useQuery({
    queryKey: ['/api/matches'],
    queryFn: api.getMatches
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: api.getCategories
  });

  const { data: athletes } = useQuery({
    queryKey: ['/api/athletes'],
    queryFn: api.getAthletes
  });

  const declareWinnerMutation = useMutation({
    mutationFn: ({ matchId, winnerId }: { matchId: number; winnerId: number }) =>
      api.declareWinner(matchId, winnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/active-matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      toast({
        title: "Winner Declared",
        description: "Match completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to declare winner",
        variant: "destructive",
      });
    }
  });

  const createMatchMutation = useMutation({
    mutationFn: (matchData: any) => api.createMatch(matchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/active-matches'] });
      toast({
        title: "Match Started",
        description: "New match has been created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start match",
        variant: "destructive",
      });
    }
  });

  const handleDeclareWinner = (matchId: number, winnerId: number) => {
    declareWinnerMutation.mutate({ matchId, winnerId });
  };

  const handleStartMatch = () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    // Find available athletes for the selected category
    const availableAthletes = athletes?.filter(a => 
      a.kategori.includes(selectedCategory) && a.isPresent && a.status === 'available'
    ) || [];

    if (availableAthletes.length < 2) {
      toast({
        title: "Error",
        description: "Need at least 2 available athletes to start a match",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, select first two available athletes
    const redAthlete = availableAthletes[0];
    const blueAthlete = availableAthletes[1];

    const matchData = {
      groupId: 1, // This would be determined by category logic
      redCornerAthleteId: redAthlete.id,
      blueCornerAthleteId: blueAthlete.id,
      ring: selectedRing,
      round: 1,
      status: 'active',
      startTime: new Date(),
      matchType: 'elimination'
    };

    createMatchMutation.mutate(matchData);
  };

  // Filter matches based on search and filter criteria
  const filteredMatches = (allMatches || [])
    .filter(match => {
      const redAthlete = athletes?.find(a => a.id === match.redCornerAthleteId);
      const blueAthlete = athletes?.find(a => a.id === match.blueCornerAthleteId);
      
      const matchText = `${redAthlete?.name || ''} ${blueAthlete?.name || ''}`.toLowerCase();
      const searchMatch = searchTerm === '' || matchText.includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === 'all' || filterStatus === '' || match.status === filterStatus;
      const ringMatch = filterRing === 'all' || filterRing === '' || match.ring === filterRing;
      
      return searchMatch && statusMatch && ringMatch;
    });

  const isLoading = activeMatchesLoading || allMatchesLoading || declareWinnerMutation.isPending || createMatchMutation.isPending;

  const getMatchesByRing = (ring: string) => {
    return activeMatches?.filter(match => match.ring === ring) || [];
  };

  const completedMatches = filteredMatches.filter(match => match.status === 'completed');

  const renderMatchCard = (match: ActiveMatch, ring: string) => (
    <Card key={match.id}>
      <CardHeader className="border-b border-tkd-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-tkd-gray-900">Ring {ring}</CardTitle>
          <Badge className="bg-orange-100 text-orange-800 animate-pulse">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-tkd-gray-50 rounded-lg p-6 mb-4">
          <div className="text-center mb-4">
            <h4 className="font-semibold text-tkd-gray-900">{match.category} - Round {match.round}</h4>
            <p className="text-sm text-tkd-gray-500">Pertandingan Eliminasi</p>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            {/* Red Corner */}
            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-tkd-red rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                R
              </div>
              <h5 className="font-medium text-tkd-gray-900">{match.redCorner.name}</h5>
              <p className="text-sm text-tkd-gray-500">{match.redCorner.dojang}</p>
            </div>
            
            <div className="px-4">
              <span className="text-2xl font-bold text-tkd-gray-400">VS</span>
            </div>
            
            {/* Blue Corner */}
            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-tkd-blue rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                B
              </div>
              <h5 className="font-medium text-tkd-gray-900">{match.blueCorner.name}</h5>
              <p className="text-sm text-tkd-gray-500">{match.blueCorner.dojang}</p>
            </div>
          </div>
          
          {/* Winner Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => handleDeclareWinner(match.id, match.redCorner.id)}
              className="p-4 bg-tkd-red text-white hover:bg-red-700 transition-colors"
              disabled={declareWinnerMutation.isPending}
            >
              <i className="fas fa-trophy mr-2"></i>
              Menang Sudut Merah
            </Button>
            <Button 
              onClick={() => handleDeclareWinner(match.id, match.blueCorner.id)}
              className="p-4 bg-tkd-blue text-white hover:bg-blue-700 transition-colors"
              disabled={declareWinnerMutation.isPending}
            >
              <i className="fas fa-trophy mr-2"></i>
              Menang Sudut Biru
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyRing = (ring: string) => (
    <Card>
      <CardHeader className="border-b border-tkd-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-tkd-gray-900">Ring {ring}</CardTitle>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">Standby</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <i className="fas fa-clock text-4xl text-tkd-gray-400 mb-4"></i>
          <h4 className="font-medium text-tkd-gray-900 mb-2">Ring Siap Digunakan</h4>
          <p className="text-sm text-tkd-gray-500 mb-4">Pilih kategori untuk memulai pertandingan</p>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleStartMatch}
            className="w-full bg-tkd-blue text-white hover:bg-blue-700"
            disabled={!selectedCategory || createMatchMutation.isPending}
          >
            <i className="fas fa-play mr-2"></i>
            Mulai Pertandingan
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header 
        title="Manajemen Pertandingan" 
        subtitle="Kontrol jalannya pertandingan"
      />
      
      <LoadingOverlay isVisible={isLoading} />
      
      <main className="p-6">
        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cari dan Filter Pertandingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Cari Pertandingan</Label>
                <Input
                  placeholder="Nama atlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Ring</Label>
                <Select value={filterRing} onValueChange={setFilterRing}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Semua Ring" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Ring</SelectItem>
                    <SelectItem value="A">Ring A</SelectItem>
                    <SelectItem value="B">Ring B</SelectItem>
                    <SelectItem value="C">Ring C</SelectItem>
                    <SelectItem value="D">Ring D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterRing('all');
                  }}
                  className="w-full"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <Badge variant="secondary">
                {filteredMatches.length} pertandingan ditemukan
              </Badge>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {filteredMatches.filter(m => m.status === 'active').length} Aktif
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Trophy className="h-3 w-3 mr-1" />
                  {filteredMatches.filter(m => m.status === 'completed').length} Selesai
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ring A */}
          {getMatchesByRing('A').length > 0 ? 
            renderMatchCard(getMatchesByRing('A')[0], 'A') : 
            renderEmptyRing('A')
          }
          
          {/* Ring B */}
          {getMatchesByRing('B').length > 0 ? 
            renderMatchCard(getMatchesByRing('B')[0], 'B') : 
            renderEmptyRing('B')
          }
        </div>
        
        {/* Match Results Summary */}
        <Card>
          <CardHeader className="border-b border-tkd-gray-200">
            <CardTitle className="text-lg font-semibold text-tkd-gray-900">
              Hasil Pertandingan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tkd-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase">Pemenang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase">Ring</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-tkd-gray-200">
                  {completedMatches.length > 0 ? (
                    completedMatches.map((match) => {
                      const winner = athletes?.find(a => a.id === match.winnerId);
                      const redAthlete = athletes?.find(a => a.id === match.redCornerAthleteId);
                      const blueAthlete = athletes?.find(a => a.id === match.blueCornerAthleteId);
                      
                      return (
                        <tr key={match.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-tkd-gray-900">
                            {redAthlete?.kategori || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                                <i className="fas fa-trophy text-white text-xs"></i>
                              </div>
                              <span className="text-sm text-tkd-gray-900">
                                {winner?.nama_lengkap || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                            Ring {match.ring}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-green-100 text-green-800">
                              Selesai
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-500">
                            {match.endTime ? new Date(match.endTime).toLocaleTimeString('id-ID') : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-tkd-gray-500">
                        <div>
                          <i className="fas fa-trophy text-4xl text-tkd-gray-300 mb-4"></i>
                          <p className="text-lg font-medium mb-2">Belum ada pertandingan selesai</p>
                          <p className="text-sm">Hasil pertandingan akan muncul di sini</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
