import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { api } from "@/lib/api";
import type { GoogleSheetsCompetition, GoogleSheetsAthlete } from "@shared/schema";

export default function Athletes() {
  const [selectedCompetition, setSelectedCompetition] = useState<GoogleSheetsCompetition | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<GoogleSheetsAthlete[]>([]);
  const [showCompetitionDialog, setShowCompetitionDialog] = useState(false);
  const [showAthleteDialog, setShowAthleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, clearCache } = useRealtime();

  // Fetch competitions from Google Sheets dengan caching yang lebih baik
  const { data: competitions, isLoading: competitionsLoading, refetch: refetchCompetitions } = useQuery({
    queryKey: ['google-sheets-competitions'],
    queryFn: api.getCompetitionsFromGoogleSheets,
    enabled: showCompetitionDialog,
    staleTime: 30000, // Cache selama 30 detik
    cacheTime: 300000 // Keep in cache for 5 minutes
  });

  // Fetch athletes from selected competition dengan auto-refresh
  const { data: competitionAthletes, isLoading: athletesLoading, refetch: refetchAthletes } = useQuery({
    queryKey: ['google-sheets-athletes', selectedCompetition?.id],
    queryFn: () => api.getAthletesFromCompetition(selectedCompetition!.id),
    enabled: !!selectedCompetition && showAthleteDialog,
    staleTime: 10000, // Cache selama 10 detik
    cacheTime: 60000, // Keep in cache for 1 minute
    refetchInterval: 30000 // Auto-refresh setiap 30 detik
  });

  // Transfer athletes mutation
  const transferAthletesMutation = useMutation({
    mutationFn: api.transferAthletesToManagement,
    onSuccess: (data) => {
      toast({
        title: "Transfer Berhasil",
        description: `${data.count} atlet telah dipindahkan ke sistem manajemen`,
      });
      setShowAthleteDialog(false);
      setSelectedAthletes([]);
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error) => {
      toast({
        title: "Transfer Gagal",
        description: "Terjadi kesalahan saat memindahkan data atlet",
        variant: "destructive",
      });
    }
  });

  const handleSelectCompetition = (competition: GoogleSheetsCompetition) => {
    setSelectedCompetition(competition);
    setShowCompetitionDialog(false);
    setShowAthleteDialog(true);
  };

  const handleToggleAthlete = (athlete: GoogleSheetsAthlete, checked: boolean) => {
    if (checked) {
      setSelectedAthletes(prev => [...prev, athlete]);
    } else {
      setSelectedAthletes(prev => prev.filter(a => a.registrationId !== athlete.registrationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && competitionAthletes) {
      setSelectedAthletes(competitionAthletes);
    } else {
      setSelectedAthletes([]);
    }
  };

  const handleTransferAthletes = () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "Pilih Atlet",
        description: "Silakan pilih minimal satu atlet untuk dipindahkan",
        variant: "destructive",
      });
      return;
    }
    transferAthletesMutation.mutate(selectedAthletes);
  };

  const handleRefreshData = async () => {
    await clearCache();
    if (showCompetitionDialog) {
      refetchCompetitions();
    }
    if (showAthleteDialog) {
      refetchAthletes();
    }
    toast({
      title: "Data Diperbarui",
      description: "Data dari Google Sheets telah diperbarui",
    });
  };

  return (
    <div className="p-6">
      <Header 
        title="Manajemen Atlet" 
        subtitle="Kelola data atlet dan sinkronisasi dengan Google Sheets"
        onRefresh={handleRefreshData}
      />
      
      {/* Connection Status */}
      <div className="mb-4 flex justify-end">
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "🟢 Real-time aktif" : "🔴 Offline"}
        </Badge>
      </div>
      
      <LoadingOverlay isVisible={competitionsLoading || athletesLoading || transferAthletesMutation.isPending} />
      
      {/* Main Action Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <i className="fas fa-download text-white"></i>
            </div>
            Import Atlet dari Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Ambil data atlet dari spreadsheet kejuaraan dan pindahkan ke sistem manajemen turnamen.
          </p>
          <div className="flex gap-3">
            <Dialog open={showCompetitionDialog} onOpenChange={setShowCompetitionDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <i className="fas fa-table mr-2"></i>
                  Pilih Kejuaraan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pilih Kejuaraan dari Google Sheets</DialogTitle>
                </DialogHeader>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Pilih kejuaraan yang ingin diambil data atletnya
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => refetchCompetitions()}
                    disabled={competitionsLoading}
                  >
                    <i className="fas fa-refresh mr-2"></i>
                    Refresh
                  </Button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                {competitions?.map((competition) => (
                  <Card 
                    key={competition.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectCompetition(competition)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{competition.nama}</h3>
                          <p className="text-sm text-muted-foreground">{competition.deskripsi}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {competition.id}</p>
                        </div>
                        <Badge variant={competition.status === 1 ? "default" : "secondary"}>
                          {competition.status === 1 ? "Aktif" : "Selesai"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Athletes Selection Dialog */}
      <Dialog open={showAthleteDialog} onOpenChange={setShowAthleteDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Pilih Atlet dari: {selectedCompetition?.nama}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Control Bar */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedAthletes.length === competitionAthletes?.length && competitionAthletes?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Pilih Semua ({competitionAthletes?.length || 0} atlet)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => refetchAthletes()}
                  disabled={athletesLoading}
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Refresh Data
                </Button>
                <Badge variant={athletesLoading ? "secondary" : "default"}>
                  {athletesLoading ? "Memuat..." : `${competitionAthletes?.length || 0} atlet`}
                </Badge>
              </div>
              <Badge variant="secondary">
                {selectedAthletes.length} dipilih
              </Badge>
            </div>

            {/* Athletes List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {competitionAthletes?.map((athlete) => (
                <div 
                  key={athlete.registrationId} 
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedAthletes.some(a => a.registrationId === athlete.registrationId)}
                    onCheckedChange={(checked) => handleToggleAthlete(athlete, checked as boolean)}
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <p className="font-medium">{athlete.nama}</p>
                      <p className="text-xs text-muted-foreground">{athlete.dojang}</p>
                    </div>
                    <div>
                      <p className="text-sm">{athlete.gender} - {athlete.sabuk}</p>
                      <p className="text-xs text-muted-foreground">{athlete.berat}kg / {athlete.tinggi}cm</p>
                    </div>
                    <div>
                      <p className="text-sm">{athlete.kategori}</p>
                      <p className="text-xs text-muted-foreground">Kelas: {athlete.kelas}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowAthleteDialog(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleTransferAthletes}
                disabled={selectedAthletes.length === 0 || transferAthletesMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-upload mr-2"></i>
                Transfer {selectedAthletes.length} Atlet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Selection Summary */}
      {selectedCompetition && (
        <Card>
          <CardHeader>
            <CardTitle>Kejuaraan Terpilih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedCompetition.nama}</h3>
                <p className="text-sm text-muted-foreground">{selectedCompetition.deskripsi}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAthleteDialog(true)}
                disabled={!competitionAthletes}
              >
                <i className="fas fa-users mr-2"></i>
                Lihat Atlet ({competitionAthletes?.length || 0})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}