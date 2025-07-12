import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { api } from "@/lib/api";
import { Search, Filter, Users, Calendar, Download, RefreshCw, ChevronDown, ChevronUp, Plus, Edit, Trash2, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAthleteSchema } from "@shared/schema";
import type { GoogleSheetsCompetition, GoogleSheetsAthlete, Athlete, InsertAthlete } from "@shared/schema";

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
  const [showAddAthleteDialog, setShowAddAthleteDialog] = useState(false);
  const [showEditAthleteDialog, setShowEditAthleteDialog] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  
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

  // Add athlete mutation
  const addAthleteMutation = useMutation({
    mutationFn: api.createAthlete,
    onSuccess: () => {
      toast({
        title: "Atlet Ditambahkan",
        description: "Data atlet berhasil ditambahkan",
      });
      setShowAddAthleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: () => {
      toast({
        title: "Gagal Menambahkan",
        description: "Terjadi kesalahan saat menambahkan atlet",
        variant: "destructive",
      });
    }
  });

  // Edit athlete mutation
  const editAthleteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAthlete> }) => api.updateAthlete(id, data),
    onSuccess: () => {
      toast({
        title: "Atlet Diperbarui",
        description: "Data atlet berhasil diperbarui",
      });
      setShowEditAthleteDialog(false);
      setEditingAthlete(null);
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: () => {
      toast({
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat memperbarui data atlet",
        variant: "destructive",
      });
    }
  });

  // Delete athlete mutation
  const deleteAthleteMutation = useMutation({
    mutationFn: api.deleteAthlete,
    onSuccess: () => {
      toast({
        title: "Atlet Dihapus",
        description: "Data atlet berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: () => {
      toast({
        title: "Gagal Menghapus",
        description: "Terjadi kesalahan saat menghapus atlet",
        variant: "destructive",
      });
    }
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, isPresent }: { id: number; isPresent: boolean }) => api.updateAthleteAttendance(id, isPresent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: () => {
      toast({
        title: "Gagal Update Kehadiran",
        description: "Terjadi kesalahan saat memperbarui kehadiran",
        variant: "destructive",
      });
    }
  });

  // Form for adding new athlete
  const addForm = useForm<InsertAthlete>({
    resolver: zodResolver(insertAthleteSchema),
    defaultValues: {
      name: '',
      gender: '',
      birthDate: '',
      dojang: '',
      belt: '',
      weight: 0,
      height: 0,
      category: '',
      class: '',
      isPresent: false,
      status: 'available'
    }
  });

  // Form for editing athlete
  const editForm = useForm<InsertAthlete>({
    resolver: zodResolver(insertAthleteSchema.partial()),
    defaultValues: {}
  });

  // Handler functions
  const handleAddAthlete = (data: InsertAthlete) => {
    addAthleteMutation.mutate(data);
  };

  const handleEditAthlete = (data: Partial<InsertAthlete>) => {
    if (editingAthlete) {
      editAthleteMutation.mutate({ id: editingAthlete.id, data });
    }
  };

  const handleDeleteAthlete = (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus atlet ${name}?`)) {
      deleteAthleteMutation.mutate(id);
    }
  };

  const handleEditClick = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    editForm.reset({
      name: athlete.name,
      gender: athlete.gender,
      birthDate: athlete.birthDate,
      dojang: athlete.dojang,
      belt: athlete.belt,
      weight: athlete.weight,
      height: athlete.height,
      category: athlete.category,
      class: athlete.class,
      isPresent: athlete.isPresent,
      status: athlete.status
    });
    setShowEditAthleteDialog(true);
  };

  const handleAttendanceToggle = (id: number, currentStatus: boolean) => {
    updateAttendanceMutation.mutate({ id, isPresent: !currentStatus });
  };

  // Fungsi untuk menghitung umur dari tanggal lahir
  const calculateAge = (birthDate: string): number => {
    try {
      if (!birthDate) return 0;
      
      // Parse format Indonesia "Jakarta, 03 November 2018" atau "03 November 2018"
      const dateStr = birthDate.includes(',') ? birthDate.split(',')[1].trim() : birthDate;
      
      // Handle different date formats
      let birth: Date;
      
      if (dateStr.includes(' ')) {
        // Format: "03 November 2018"
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const monthName = parts[1];
          const year = parseInt(parts[2]);
          
          // Map Indonesian month names to numbers
          const monthMap: { [key: string]: number } = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
            'january': 0, 'february': 1, 'march': 2, 'may': 4, 'june': 5,
            'july': 6, 'august': 7, 'october': 9, 'december': 11
          };
          
          const month = monthMap[monthName.toLowerCase()];
          if (month !== undefined) {
            birth = new Date(year, month, day);
          } else {
            return 0;
          }
        } else {
          return 0;
        }
      } else if (dateStr.includes('-')) {
        // Format: "01-01-2000"
        const [day, month, year] = dateStr.split('-').map(num => parseInt(num));
        birth = new Date(year, month - 1, day);
      } else {
        return 0;
      }
      
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
        title="Manajemen Atlet" 
        subtitle={`${filteredAthletes.length} atlet • Data dari Spreadsheet Management`}
        onRefresh={refetchManagementAthletes}
      />

      {/* Main Actions */}
      <div className="flex gap-4">
        <Button onClick={() => setShowAddAthleteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Atlet
        </Button>
        <Button variant="outline" onClick={() => setShowCompetitionDialog(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Pilih Kejuaraan untuk Import
        </Button>
        {selectedCompetition && (
          <Button onClick={() => setShowImportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Import Atlet Baru
          </Button>
        )}
      </div>

      {/* Always show athlete data */}
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
                        <th className="text-left p-3">Kehadiran</th>
                        <th className="text-left p-3">Aksi</th>
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
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={athlete.isPresent}
                                onCheckedChange={() => handleAttendanceToggle(athlete.id, athlete.isPresent)}
                              />
                              <span className={athlete.isPresent ? "text-green-600" : "text-gray-500"}>
                                {athlete.isPresent ? "Hadir" : "Belum Hadir"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(athlete)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAthlete(athlete.id, athlete.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* Dialog untuk tambah atlet */}
      <Dialog open={showAddAthleteDialog} onOpenChange={setShowAddAthleteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Atlet Baru</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddAthlete)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jakarta, 15 Januari 2010" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="dojang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dojang *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama dojang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
                  name="belt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sabuk *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. kuning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berat (kg) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tinggi (cm) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kyorugi, UKT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelas *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pemula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddAthleteDialog(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={addAthleteMutation.isPending}>
                  {addAthleteMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk edit atlet */}
      <Dialog open={showEditAthleteDialog} onOpenChange={setShowEditAthleteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Atlet: {editingAthlete?.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditAthlete)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jakarta, 15 Januari 2010" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="dojang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dojang *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama dojang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="belt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sabuk *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. kuning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berat (kg) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tinggi (cm) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kyorugi, UKT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelas *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pemula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditAthleteDialog(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={editAthleteMutation.isPending}>
                  {editAthleteMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}