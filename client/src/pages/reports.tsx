import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();
  useRealtime();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats
  });

  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ['/api/athletes'],
    queryFn: api.getAthletes
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: api.getCategories
  });

  const { data: results } = useQuery({
    queryKey: ['/api/results'],
    queryFn: api.exportResults
  });

  const isLoading = statsLoading || athletesLoading;

  const handleExport = async (type: 'athletes' | 'results', format: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      if (type === 'athletes') {
        await api.exportAthletes(format);
      } else {
        await api.exportResults(format);
      }
      
      toast({
        title: "Export Started",
        description: `${type} export in ${format.toUpperCase()} format has been initiated`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateCertificates = () => {
    toast({
      title: "Certificates Generation",
      description: "Certificate generation feature will be implemented",
    });
  };

  // Calculate tournament progress
  const tournamentProgress = {
    kyorugi: stats?.completedMatches && stats?.activeMatches ? 
      Math.round((stats.completedMatches / (stats.completedMatches + stats.activeMatches)) * 100) : 0,
    poomsae: 60, // This would be calculated based on actual poomsae results
    overall: stats?.totalAthletes ? 
      Math.round(((stats?.completedMatches || 0) / stats.totalAthletes) * 100) : 0
  };

  // Get participation statistics
  const participationStats = {
    totalParticipants: stats?.totalAthletes || 0,
    maleParticipants: athletes?.filter(a => a.gender === 'Laki-laki').length || 0,
    femaleParticipants: athletes?.filter(a => a.gender === 'Perempuan').length || 0,
    totalDojos: new Set(athletes?.map(a => a.dojang)).size || 0,
    presentAthletes: stats?.presentAthletes || 0
  };

  // Mock export history data (in real app, this would come from API)
  const exportHistory = [
    {
      id: 1,
      type: "Data Atlet Lengkap",
      format: "Excel",
      createdBy: "Admin User",
      createdAt: new Date(),
      downloadUrl: "#"
    }
  ];

  return (
    <>
      <Header 
        title="Export & Laporan" 
        subtitle="Generate laporan dan export data"
      />
      
      <LoadingOverlay isVisible={isLoading || isExporting} />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Export Options */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Athletes Export */}
              <div className="p-4 border border-tkd-gray-200 rounded-lg">
                <h4 className="font-medium text-tkd-gray-900 mb-2">Data Atlet</h4>
                <p className="text-sm text-tkd-gray-500 mb-4">
                  Export semua data atlet yang terdaftar ({participationStats.totalParticipants} atlet)
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleExport('athletes', 'excel')}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isExporting}
                  >
                    <i className="fas fa-file-excel mr-2"></i>
                    Excel
                  </Button>
                  <Button 
                    onClick={() => handleExport('athletes', 'pdf')}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isExporting}
                  >
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                </div>
              </div>
              
              {/* Match Results Export */}
              <div className="p-4 border border-tkd-gray-200 rounded-lg">
                <h4 className="font-medium text-tkd-gray-900 mb-2">Hasil Pertandingan</h4>
                <p className="text-sm text-tkd-gray-500 mb-4">
                  Export hasil dan juara setiap kategori ({stats?.completedMatches || 0} pertandingan selesai)
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleExport('results', 'excel')}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isExporting}
                  >
                    <i className="fas fa-file-excel mr-2"></i>
                    Excel
                  </Button>
                  <Button 
                    onClick={() => handleExport('results', 'pdf')}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isExporting}
                  >
                    <i className="fas fa-file-pdf mr-2"></i>
                    PDF
                  </Button>
                </div>
              </div>
              
              {/* Certificates Export */}
              <div className="p-4 border border-tkd-gray-200 rounded-lg">
                <h4 className="font-medium text-tkd-gray-900 mb-2">Sertifikat Juara</h4>
                <p className="text-sm text-tkd-gray-500 mb-4">
                  Generate sertifikat untuk para juara
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleGenerateCertificates}
                    className="bg-tkd-blue text-white hover:bg-blue-700"
                    disabled={isExporting}
                  >
                    <i className="fas fa-certificate mr-2"></i>
                    Generate PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tournament Summary */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                Ringkasan Kejuaraan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Tournament Info */}
                <div>
                  <h4 className="font-medium text-tkd-gray-900 mb-3">Informasi Kejuaraan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Nama Kejuaraan:</span>
                      <span className="font-medium text-tkd-gray-900">Kejuaraan Taekwondo Regional 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Tanggal:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {new Date().toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Tempat:</span>
                      <span className="font-medium text-tkd-gray-900">GOR Cendrawasih</span>
                    </div>
                  </div>
                </div>
                
                {/* Statistics */}
                <div>
                  <h4 className="font-medium text-tkd-gray-900 mb-3">Statistik Partisipasi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Total Peserta:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {participationStats.totalParticipants} atlet
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Peserta Pria:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {participationStats.maleParticipants} atlet
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Peserta Wanita:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {participationStats.femaleParticipants} atlet
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Jumlah Dojang:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {participationStats.totalDojos} dojang
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tkd-gray-500">Tingkat Kehadiran:</span>
                      <span className="font-medium text-tkd-gray-900">
                        {participationStats.totalParticipants > 0 ? 
                          Math.round((participationStats.presentAthletes / participationStats.totalParticipants) * 100) : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress */}
                <div>
                  <h4 className="font-medium text-tkd-gray-900 mb-3">Progress Kejuaraan</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-tkd-gray-500">Kyorugi</span>
                        <span className="font-medium text-tkd-gray-900">{tournamentProgress.kyorugi}%</span>
                      </div>
                      <Progress value={tournamentProgress.kyorugi} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-tkd-gray-500">Poomsae</span>
                        <span className="font-medium text-tkd-gray-900">{tournamentProgress.poomsae}%</span>
                      </div>
                      <Progress value={tournamentProgress.poomsae} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-tkd-gray-500">Keseluruhan</span>
                        <span className="font-medium text-tkd-gray-900">{tournamentProgress.overall}%</span>
                      </div>
                      <Progress value={tournamentProgress.overall} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-tkd-gray-200">
                  <p className="text-sm text-tkd-gray-600 mb-2">Estimasi selesai:</p>
                  <p className="text-lg font-semibold text-tkd-gray-900">
                    {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} WIB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Reports History */}
        <Card>
          <CardHeader className="border-b border-tkd-gray-200">
            <CardTitle className="text-lg font-semibold text-tkd-gray-900">
              Riwayat Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tkd-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Jenis Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Dibuat Oleh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tkd-gray-500 uppercase tracking-wider">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-tkd-gray-200">
                  {exportHistory.length > 0 ? (
                    exportHistory.map((exportItem) => (
                      <tr key={exportItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                          {exportItem.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={exportItem.format === 'Excel' ? 
                            "bg-green-100 text-green-800" : 
                            "bg-red-100 text-red-800"
                          }>
                            {exportItem.format}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-900">
                          {exportItem.createdBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tkd-gray-500">
                          {exportItem.createdAt.toLocaleTimeString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-tkd-blue hover:text-blue-700"
                            onClick={() => {
                              toast({
                                title: "Download",
                                description: "File download will be implemented",
                              });
                            }}
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-tkd-gray-500">
                        <div>
                          <i className="fas fa-file-export text-4xl text-tkd-gray-300 mb-4"></i>
                          <p className="text-lg font-medium mb-2">Belum ada riwayat export</p>
                          <p className="text-sm">Export pertama Anda akan muncul di sini</p>
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
