import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import type { Athlete } from "@shared/schema";

export default function Athletes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [competitionId, setCompetitionId] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useRealtime();

  const { data: athletes, isLoading, refetch } = useQuery({
    queryKey: ['/api/athletes'],
    queryFn: api.getAthletes
  });

  const syncMutation = useMutation({
    mutationFn: () => api.syncAthletes(competitionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      toast({
        title: "Sync Successful",
        description: `${data.count} athletes synchronized from Google Sheets`,
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync athletes from Google Sheets",
        variant: "destructive",
      });
    }
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id, isPresent }: { id: number; isPresent: boolean }) =>
      api.updateAthleteAttendance(id, isPresent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
    }
  });

  const handleAttendanceChange = (athlete: Athlete, isPresent: boolean) => {
    attendanceMutation.mutate({ id: athlete.id, isPresent });
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Filter athletes based on search and filters
  const filteredAthletes = athletes?.filter(athlete => {
    const matchesSearch = athlete.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.dojang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || athlete.kategori.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesAttendance = attendanceFilter === 'all' || 
                             (attendanceFilter === 'present' && athlete.isPresent) ||
                             (attendanceFilter === 'absent' && !athlete.isPresent);
    
    return matchesSearch && matchesCategory && matchesAttendance;
  }) || [];

  const getStatusBadge = (athlete: Athlete) => {
    if (!athlete.isPresent) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Tidak Hadir</Badge>;
    }
    
    switch (athlete.status) {
      case 'competing':
        return <Badge className="bg-orange-100 text-orange-800 animate-pulse">Sedang Bertanding</Badge>;
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Siap Bertanding</Badge>;
      case 'eliminated':
        return <Badge variant="destructive">Tersingkir</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getBeltColor = (belt: string) => {
    const colors = {
      'Putih': 'bg-gray-100 text-gray-800',
      'Kuning': 'bg-yellow-100 text-yellow-800',
      'Hijau': 'bg-green-100 text-green-800',
      'Biru': 'bg-blue-100 text-blue-800',
      'Merah': 'bg-red-100 text-red-800',
      'Hitam': 'bg-gray-900 text-white'
    };
    return colors[belt as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Header 
        title="Manajemen Atlet" 
        subtitle="Kelola kehadiran dan data atlet"
        onRefresh={handleRefresh}
      />
      
      <LoadingOverlay isVisible={isLoading || syncMutation.isPending} />
      
      <main className="p-6">
        <Card>
          {/* Header with Search and Filters */}
          <CardHeader className="border-b border-tkd-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-tkd-gray-900">Manajemen Atlet</h3>
                <p className="text-tkd-gray-500">
                  Total: {athletes?.length || 0} | Hadir: {filteredAthletes.filter(a => a.isPresent).length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Input
                  type="text"
                  placeholder="Cari atlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="kyorugi">Kyorugi</SelectItem>
                    <SelectItem value="poomsae">Poomsae</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="present">Hadir</SelectItem>
                    <SelectItem value="absent">Tidak Hadir</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Competition ID (optional)"
                    value={competitionId}
                    onChange={(e) => setCompetitionId(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleSync} disabled={syncMutation.isPending}>
                    <i className="fas fa-sync mr-2"></i>
                    Sync from Google Sheets
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          {/* Athletes Table */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tkd-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Atlet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Dojang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Sabuk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Berat/Tinggi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Kehadiran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-tkd-gray-200">
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map((athlete) => (
                      <tr key={athlete.id} className="hover:bg-tkd-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-tkd-gray-300 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-tkd-gray-600"></i>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-tkd-gray-900">
                                {athlete.nama_lengkap}
                              </div>
                              <div className="text-sm text-tkd-gray-500">
                                {athlete.gender}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                          {athlete.dojang}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getBeltColor(athlete.sabuk)}>
                            {athlete.sabuk}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                          {athlete.kategori}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                          {athlete.berat_badan}kg / {athlete.tinggi_badan}cm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={athlete.isPresent}
                              onCheckedChange={(checked) => 
                                handleAttendanceChange(athlete, !!checked)
                              }
                              disabled={attendanceMutation.isPending}
                            />
                            <span className={`text-sm font-medium ${
                              athlete.isPresent ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {athlete.isPresent ? 'Hadir' : 'Tidak Hadir'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(athlete)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-tkd-gray-500">
                        {athletes?.length === 0 ? (
                          <div>
                            <i className="fas fa-users text-4xl mb-4 text-tkd-gray-300"></i>
                            <p className="text-lg font-medium mb-2">Belum ada data atlet</p>
                            <p className="text-sm">Sync data dari Google Sheets untuk memulai</p>
                          </div>
                        ) : (
                          <div>
                            <i className="fas fa-search text-4xl mb-4 text-tkd-gray-300"></i>
                            <p className="text-lg font-medium mb-2">Tidak ada hasil</p>
                            <p className="text-sm">Coba ubah filter pencarian Anda</p>
                          </div>
                        )}
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
