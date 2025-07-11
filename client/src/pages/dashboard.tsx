import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";

export default function Dashboard() {
  useRealtime(); // Enable real-time updates

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: activeMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/dashboard/active-matches'],
    queryFn: api.getActiveMatches,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const isLoading = statsLoading || matchesLoading;

  const handleRefresh = () => {
    refetchStats();
  };

  const handleSyncAthletes = async () => {
    try {
      await api.syncAthletes();
    } catch (error) {
      console.error('Failed to sync athletes:', error);
    }
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Ringkasan kejuaraan dan statistik atlet"
        onRefresh={handleRefresh}
      />
      
      <LoadingOverlay isVisible={isLoading} />
      
      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tkd-gray-500 text-sm font-medium">Total Atlet</p>
                  <p className="text-3xl font-bold text-tkd-gray-900">
                    {stats?.totalAthletes || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-tkd-blue text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {stats?.presentAthletes || 0}
                </span>
                <span className="text-tkd-gray-500 ml-1">hadir</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tkd-gray-500 text-sm font-medium">Kategori Aktif</p>
                  <p className="text-3xl font-bold text-tkd-gray-900">
                    {stats?.activeCategories || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-layer-group text-tkd-red text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-tkd-gray-500">Kyorugi & Poomsae</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tkd-gray-500 text-sm font-medium">Sedang Bertanding</p>
                  <p className="text-3xl font-bold text-tkd-gray-900">
                    {stats?.activeMatches || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-fist-raised text-orange-500 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-orange-600 font-medium animate-pulse">● Live</span>
                <span className="text-tkd-gray-500 ml-1">update real-time</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tkd-gray-500 text-sm font-medium">Pertandingan Selesai</p>
                  <p className="text-3xl font-bold text-tkd-gray-900">
                    {stats?.completedMatches || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-green-500 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {stats?.totalAthletes ? Math.round((stats.completedMatches / stats.totalAthletes) * 100) : 0}%
                </span>
                <span className="text-tkd-gray-500 ml-1">progress</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Active Matches and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Matches */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                  Pertandingan Aktif
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {activeMatches?.length || 0} Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activeMatches && activeMatches.length > 0 ? (
                  activeMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-tkd-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-tkd-red rounded-full"></div>
                          <span className="font-medium text-tkd-gray-900">
                            {match.redCorner.name}
                          </span>
                        </div>
                        <span className="text-tkd-gray-500">vs</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-tkd-blue rounded-full"></div>
                          <span className="font-medium text-tkd-gray-900">
                            {match.blueCorner.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-tkd-gray-900">{match.category}</p>
                        <p className="text-xs text-tkd-gray-500">
                          Ring {match.ring} - Round {match.round}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-tkd-gray-500">
                    Tidak ada pertandingan aktif saat ini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b border-tkd-gray-200">
              <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleSyncAthletes}
                  className="p-4 bg-tkd-blue text-white hover:bg-blue-700 h-auto flex-col"
                >
                  <i className="fas fa-sync text-xl mb-2"></i>
                  <span className="font-medium">Sync Atlet</span>
                </Button>
                <Button 
                  variant="destructive"
                  className="p-4 h-auto flex-col bg-tkd-red hover:bg-red-700"
                >
                  <i className="fas fa-play text-xl mb-2"></i>
                  <span className="font-medium">Mulai Pertandingan</span>
                </Button>
                <Button 
                  variant="default"
                  className="p-4 h-auto flex-col bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-check-circle text-xl mb-2"></i>
                  <span className="font-medium">Cek Kehadiran</span>
                </Button>
                <Button 
                  variant="default"
                  className="p-4 h-auto flex-col bg-purple-600 hover:bg-purple-700"
                >
                  <i className="fas fa-download text-xl mb-2"></i>
                  <span className="font-medium">Export Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b border-tkd-gray-200">
            <CardTitle className="text-lg font-semibold text-tkd-gray-900">
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-tkd-gray-900">
                    Sistem real-time aktif dan siap menerima update
                  </p>
                  <p className="text-xs text-tkd-gray-500">Baru saja</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
