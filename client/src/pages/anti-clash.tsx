import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import type { Athlete } from "@shared/schema";

export default function AntiClash() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useRealtime();

  const { data: competingAthletes, isLoading: competingLoading } = useQuery({
    queryKey: ['/api/anti-clash/competing'],
    queryFn: api.getCompetingAthletes,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: availableAthletes, isLoading: availableLoading } = useQuery({
    queryKey: ['/api/anti-clash/available'],
    queryFn: api.getAvailableAthletes,
    refetchInterval: 5000
  });

  const { data: activeMatches } = useQuery({
    queryKey: ['/api/dashboard/active-matches'],
    queryFn: api.getActiveMatches,
    refetchInterval: 5000
  });

  const callAthleteMutation = useMutation({
    mutationFn: ({ id, status, ring }: { id: number; status: string; ring?: string }) =>
      api.updateAthleteStatus(id, status, ring),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/anti-clash/competing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/anti-clash/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      toast({
        title: "Athlete Called",
        description: "Athlete status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update athlete status",
        variant: "destructive",
      });
    }
  });

  const handleCallAthlete = (athleteId: number) => {
    // For demo purposes, mark as competing in Ring C
    callAthleteMutation.mutate({ id: athleteId, status: 'competing', ring: 'C' });
  };

  const handleReleaseAthlete = (athleteId: number) => {
    callAthleteMutation.mutate({ id: athleteId, status: 'available' });
  };

  const isLoading = competingLoading || availableLoading || callAthleteMutation.isPending;

  // Filter available athletes based on search
  const filteredAvailableAthletes = availableAthletes?.filter(athlete =>
    athlete.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.dojang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getCompetingAthleteRing = (athleteId: number) => {
    const match = activeMatches?.find(m => 
      m.redCorner.id === athleteId || m.blueCorner.id === athleteId
    );
    return match?.ring || 'Unknown';
  };

  const getCompetingAthleteStartTime = (athleteId: number) => {
    // This would typically come from match start time
    // For now, we'll use a placeholder
    return "14:25";
  };

  return (
    <>
      <Header 
        title="Anti-Bentrok Sistem" 
        subtitle="Monitor status atlet dan pencegahan bentrok"
      />
      
      <LoadingOverlay isVisible={isLoading} />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Currently Competing Athletes */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <div className="flex items-center space-x-3">
                <i className="fas fa-shield-alt text-tkd-red text-xl"></i>
                <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                  Atlet Sedang Bertanding
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {competingAthletes && competingAthletes.length > 0 ? (
                  competingAthletes.map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-fist-raised text-white"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-tkd-gray-900">{athlete.nama_lengkap}</h4>
                          <p className="text-sm text-tkd-gray-500">
                            {athlete.kategori} - Ring {getCompetingAthleteRing(athlete.id)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800 mb-1">
                          Aktif
                        </Badge>
                        <p className="text-xs text-tkd-gray-500">
                          Sejak {getCompetingAthleteStartTime(athlete.id)}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReleaseAthlete(athlete.id)}
                          className="mt-2 text-xs"
                        >
                          Release
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-tkd-gray-500">
                    <i className="fas fa-shield-alt text-4xl text-tkd-gray-300 mb-4"></i>
                    <p className="font-medium">Tidak ada atlet yang sedang bertanding</p>
                    <p className="text-sm">Sistem anti-bentrok siap beroperasi</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <span className="text-sm font-medium text-green-800">Sistem Anti-Bentrok Aktif</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Atlet yang sedang bertanding tidak dapat dipanggil di kategori lain
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Available Athletes */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                  Atlet Siap Bertanding
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    {availableAthletes?.length || 0} Tersedia
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search available athletes */}
              <div className="relative mb-4">
                <Input 
                  type="text" 
                  placeholder="Cari atlet tersedia..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-tkd-gray-400"></i>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredAvailableAthletes.length > 0 ? (
                  filteredAvailableAthletes.map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-sm"></i>
                        </div>
                        <div>
                          <h5 className="font-medium text-tkd-gray-900">{athlete.nama_lengkap}</h5>
                          <p className="text-xs text-tkd-gray-500">
                            {athlete.kategori} | {athlete.dojang}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleCallAthlete(athlete.id)}
                        className="bg-tkd-blue text-white hover:bg-blue-700 text-xs"
                        disabled={callAthleteMutation.isPending}
                      >
                        Panggil
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-tkd-gray-500">
                    {availableAthletes?.length === 0 ? (
                      <div>
                        <i className="fas fa-users text-4xl text-tkd-gray-300 mb-4"></i>
                        <p className="font-medium">Tidak ada atlet tersedia</p>
                        <p className="text-sm">Pastikan atlet hadir dan tidak sedang bertanding</p>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-search text-4xl text-tkd-gray-300 mb-4"></i>
                        <p className="font-medium">Tidak ditemukan</p>
                        <p className="text-sm">Coba ubah kata kunci pencarian</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Clash Prevention Rules */}
        <Card>
          <CardHeader className="border-b border-tkd-gray-200">
            <CardTitle className="text-lg font-semibold text-tkd-gray-900">
              Aturan Anti-Bentrok
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-ban text-red-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-tkd-gray-900 mb-2">Pencegahan Otomatis</h4>
                <p className="text-sm text-tkd-gray-500">
                  Sistem otomatis mencegah atlet dipanggil di dua ring berbeda
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-sync-alt text-blue-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-tkd-gray-900 mb-2">Update Real-time</h4>
                <p className="text-sm text-tkd-gray-500">
                  Status atlet diperbarui secara real-time di semua admin
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-unlock text-green-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-tkd-gray-900 mb-2">Auto Release</h4>
                <p className="text-sm text-tkd-gray-500">
                  Status atlet otomatis dirilis setelah pertandingan selesai
                </p>
              </div>
            </div>
            
            {/* Real-time Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{availableAthletes?.length || 0}</div>
                <div className="text-sm text-blue-800">Atlet Tersedia</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{competingAthletes?.length || 0}</div>
                <div className="text-sm text-orange-800">Sedang Bertanding</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{activeMatches?.length || 0}</div>
                <div className="text-sm text-green-800">Ring Aktif</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-red-800">Konflik Terdeteksi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
