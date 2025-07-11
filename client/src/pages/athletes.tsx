import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { api } from "@/lib/api";
import { Search, Filter, Users, Calendar, Download, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { GoogleSheetsCompetition, GoogleSheetsAthlete, Athlete } from "@shared/schema";

// Interface untuk filter
interface AthleteFilters {
  search: string;
  gender: string;
  beratMin: string;
  beratMax: string;
  tinggiMin: string;
  tinggiMax: string;
  sabuk: string;
  umurMin: string;
  umurMax: string;
  dojang: string;
  kategori: string;
  kelas: string;
}

export default function Athletes() {
  // State untuk kejuaraan dan data
  const [selectedCompetition, setSelectedCompetition] = useState<GoogleSheetsCompetition | null>(
    () => {
      const saved = localStorage.getItem('selectedCompetition');
      return saved ? JSON.parse(saved) : null;
    }
  );
  const [showCompetitionDialog, setShowCompetitionDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // State untuk filter
  const [filters, setFilters] = useState<AthleteFilters>({
    search: '',
    gender: 'all',
    beratMin: '',
    beratMax: '',
    tinggiMin: '',
    tinggiMax: '',
    sabuk: 'all',
    umurMin: '',
    umurMax: '',
    dojang: 'all',
    kategori: 'all',
    kelas: 'all'
  });
  
  // State untuk toggle filter visibility
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useRealtime();

  // Fetch data atlet yang sudah di-transfer ke sistem manajemen
  const { data: managementAthletes, isLoading: managementLoading, refetch: refetchManagementAthletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: api.getAllAthletes,
    staleTime: 10000,
    refetchInterval: 30000
  });

  // Fetch competitions from Google Sheets (hanya untuk import baru)
  const { data: competitions, isLoading: competitionsLoading } = useQuery({
    queryKey: ['google-sheets-competitions'],
    queryFn: api.getCompetitionsFromGoogleSheets,
    enabled: showCompetitionDialog,
    staleTime: 30000
  });

  // Fetch athletes from selected competition (hanya untuk import baru)
  const { data: competitionAthletes, isLoading: athletesLoading } = useQuery({
    queryKey: ['google-sheets-athletes', selectedCompetition?.id],
    queryFn: () => api.getAthletesFromCompetition(selectedCompetition!.id),
    enabled: !!selectedCompetition && showImportDialog,
    staleTime: 10000
  });

  // Transfer athletes mutation
  const transferAthletesMutation = useMutation({
    mutationFn: api.transferAthletesToManagement,
    onSuccess: (data) => {
      toast({
        title: "Transfer Berhasil",
        description: `${data.count} atlet telah dipindahkan ke sistem manajemen`,
      });
      setShowImportDialog(false);
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

  // Fungsi untuk menghitung umur dari tanggal lahir
  const calculateAge = (birthDate: string): number => {
    try {
      // Parse format Indonesia "Jakarta, 01-01-2000" atau "01-01-2000"
      const dateStr = birthDate.includes(',') ? birthDate.split(',')[1].trim() : birthDate;
      const [day, month, year] = dateStr.split('-').map(num => parseInt(num));
      const birth = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }
      return age;
    } catch {
      return 0;
    }
  };

  // Filter data atlet berdasarkan kriteria
  const filteredAthletes = useMemo(() => {
    if (!managementAthletes) return [];
    
    return managementAthletes.filter(athlete => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          athlete.name.toLowerCase().includes(searchLower) ||
          athlete.dojang.toLowerCase().includes(searchLower) ||
          athlete.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Gender filter
      if (filters.gender && filters.gender !== 'all' && athlete.gender !== filters.gender) return false;

      // Berat badan range
      if (filters.beratMin && athlete.weight < parseInt(filters.beratMin)) return false;
      if (filters.beratMax && athlete.weight > parseInt(filters.beratMax)) return false;

      // Tinggi badan range
      if (filters.tinggiMin && athlete.height < parseInt(filters.tinggiMin)) return false;
      if (filters.tinggiMax && athlete.height > parseInt(filters.tinggiMax)) return false;

      // Sabuk filter
      if (filters.sabuk && filters.sabuk !== 'all' && athlete.belt !== filters.sabuk) return false;

      // Umur range
      const age = calculateAge(athlete.birthDate);
      if (filters.umurMin && age < parseInt(filters.umurMin)) return false;
      if (filters.umurMax && age > parseInt(filters.umurMax)) return false;

      // Dojang filter
      if (filters.dojang && filters.dojang !== 'all' && !athlete.dojang.toLowerCase().includes(filters.dojang.toLowerCase())) return false;

      // Kategori filter
      if (filters.kategori && filters.kategori !== 'all' && athlete.category !== filters.kategori) return false;

      // Kelas filter
      if (filters.kelas && filters.kelas !== 'all' && athlete.class !== filters.kelas) return false;

      return true;
    });
  }, [managementAthletes, filters]);

  // Simpan kejuaraan yang dipilih ke localStorage
  useEffect(() => {
    if (selectedCompetition) {
      localStorage.setItem('selectedCompetition', JSON.stringify(selectedCompetition));
    }
  }, [selectedCompetition]);

  const handleSelectCompetition = (competition: GoogleSheetsCompetition) => {
    setSelectedCompetition(competition);
    setShowCompetitionDialog(false);
    setShowImportDialog(true);
  };

  const handleChangeCompetition = () => {
    setSelectedCompetition(null);
    localStorage.removeItem('selectedCompetition');
    setShowCompetitionDialog(true);
  };

  const handleTransferAllAthletes = () => {
    if (competitionAthletes) {
      transferAthletesMutation.mutate({ athletes: competitionAthletes });
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      gender: 'all',
      beratMin: '',
      beratMax: '',
      tinggiMin: '',
      tinggiMax: '',
      sabuk: 'all',
      umurMin: '',
      umurMax: '',
      dojang: 'all',
      kategori: 'all',
      kelas: 'all'
    });
  };

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!managementAthletes) return {};
    
    return {
      genders: [...new Set(managementAthletes.map(a => a.gender))],
      belts: [...new Set(managementAthletes.map(a => a.belt))],
      dojangs: [...new Set(managementAthletes.map(a => a.dojang))],
      categories: [...new Set(managementAthletes.map(a => a.category))],
      classes: [...new Set(managementAthletes.map(a => a.class))]
    };
  }, [managementAthletes]);

  return (
    <div className="space-y-6">
      <Header 
        title={selectedCompetition ? `${selectedCompetition.nama}` : "Manajemen Atlet"} 
        subtitle={selectedCompetition ? `${filteredAthletes.length} atlet • Sistem Manajemen Turnamen` : "Pilih kejuaraan untuk mengelola data atlet"}
        onRefresh={refetchManagementAthletes}
      />

      {/* Main Actions */}
      <div className="flex gap-4">
        {selectedCompetition ? (
          <>
            <Button variant="outline" onClick={handleChangeCompetition}>
              <Calendar className="w-4 h-4 mr-2" />
              Ganti Kejuaraan
            </Button>
            <Button onClick={() => setShowImportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Import Atlet Baru
            </Button>
          </>
        ) : (
          <Button onClick={() => setShowCompetitionDialog(true)} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Pilih Kejuaraan
          </Button>
        )}
      </div>

      {selectedCompetition && (
        <>
          {/* Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Pencarian
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="ml-auto"
                >
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atlet, dojang, atau kategori..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Gender</Label>
                  <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {filterOptions.genders?.map(gender => (
                        <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sabuk</Label>
                  <Select value={filters.sabuk} onValueChange={(value) => setFilters(prev => ({ ...prev, sabuk: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {filterOptions.belts?.map(belt => (
                        <SelectItem key={belt} value={belt}>{belt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Kategori</Label>
                  <Select value={filters.kategori} onValueChange={(value) => setFilters(prev => ({ ...prev, kategori: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {filterOptions.categories?.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Kelas</Label>
                  <Select value={filters.kelas} onValueChange={(value) => setFilters(prev => ({ ...prev, kelas: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {filterOptions.classes?.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Dojang</Label>
                  <Select value={filters.dojang} onValueChange={(value) => setFilters(prev => ({ ...prev, dojang: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {filterOptions.dojangs?.map(dojang => (
                        <SelectItem key={dojang} value={dojang}>{dojang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Berat Min (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.beratMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, beratMin: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Berat Max (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.beratMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, beratMax: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Tinggi Min (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.tinggiMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, tinggiMin: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Tinggi Max (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.tinggiMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, tinggiMax: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Umur Min</Label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.umurMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, umurMin: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Umur Max</Label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.umurMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, umurMax: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            )}
          </Card>

          {/* Athletes Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Data Atlet ({filteredAthletes.length})</span>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Real-time' : 'Offline'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {managementLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Memuat data atlet...</span>
                </div>
              ) : filteredAthletes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada atlet yang ditemukan</p>
                  <p className="text-sm text-gray-400 mt-1">Coba ubah filter atau import atlet baru</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Nama</th>
                        <th className="text-left p-3">Gender</th>
                        <th className="text-left p-3">Umur</th>
                        <th className="text-left p-3">Dojang</th>
                        <th className="text-left p-3">Sabuk</th>
                        <th className="text-left p-3">Berat/Tinggi</th>
                        <th className="text-left p-3">Kategori</th>
                        <th className="text-left p-3">Kelas</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.map((athlete) => (
                        <tr key={athlete.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{athlete.name}</td>
                          <td className="p-3">{athlete.gender}</td>
                          <td className="p-3">{calculateAge(athlete.birthDate)} tahun</td>
                          <td className="p-3">{athlete.dojang}</td>
                          <td className="p-3">
                            <Badge variant="outline">{athlete.belt}</Badge>
                          </td>
                          <td className="p-3">{athlete.weight}kg / {athlete.height}cm</td>
                          <td className="p-3">{athlete.category}</td>
                          <td className="p-3">{athlete.class}</td>
                          <td className="p-3">
                            <Badge variant={athlete.isPresent ? "default" : "secondary"}>
                              {athlete.isPresent ? "Hadir" : "Belum Hadir"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog untuk memilih kejuaraan */}
      <Dialog open={showCompetitionDialog} onOpenChange={setShowCompetitionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Kejuaraan</DialogTitle>
          </DialogHeader>
          
          {competitionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Memuat data kejuaraan...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {competitions?.map((competition) => (
                <Card 
                  key={competition.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectCompetition(competition)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={competition.poster} 
                        alt={competition.nama}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{competition.nama}</h3>
                        <p className="text-gray-600 text-sm mt-1">{competition.deskripsi}</p>
                        <Badge variant={competition.status === 1 ? "default" : "secondary"} className="mt-2">
                          {competition.status === 1 ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog untuk import atlet baru */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Import Atlet dari {selectedCompetition?.nama}
            </DialogTitle>
          </DialogHeader>
          
          {athletesLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Memuat data atlet...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {competitionAthletes?.length || 0} atlet tersedia untuk import
                </p>
                <Button
                  onClick={handleTransferAllAthletes}
                  disabled={!competitionAthletes || competitionAthletes.length === 0 || transferAthletesMutation.isPending}
                >
                  {transferAthletesMutation.isPending ? 'Memproses...' : `Import Semua Atlet (${competitionAthletes?.length || 0})`}
                </Button>
              </div>

              <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                {competitionAthletes?.map((athlete) => (
                  <Card key={athlete.registrationId} className="p-3">
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{athlete.nama}</span>
                        <div className="text-gray-500">{athlete.gender}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">{athlete.dojang}</span>
                        <div className="text-gray-500">{athlete.sabuk}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">{athlete.kategori}</span>
                        <div className="text-gray-500">{athlete.kelas}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">{athlete.berat}kg</span>
                        <div className="text-gray-500">{athlete.tinggi}cm</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}