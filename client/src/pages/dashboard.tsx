import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useRealtime } from "@/hooks/use-realtime";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(res => res.json()),
    staleTime: 10000,
    refetchInterval: 30000
  });

  const { data: activeMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/dashboard/active-matches'],
    queryFn: () => fetch('/api/dashboard/active-matches').then(res => res.json()),
    staleTime: 10000,
    refetchInterval: 30000
  });

  useRealtime();

  const isLoading = statsLoading || matchesLoading;

  const navigationCards = [
    {
      title: "Manajemen Atlet",
      description: "Kelola data atlet, sinkronisasi dengan Google Sheets, dan atur kehadiran",
      icon: "fas fa-users",
      href: "/athletes",
      color: "from-blue-500 to-blue-600",
      stats: `${stats?.totalAthletes || 0} Atlet Terdaftar`
    },
    {
      title: "Pertandingan",
      description: "Atur jadwal pertandingan, kelola bracket, dan catat hasil",
      icon: "fas fa-trophy",
      href: "/matches", 
      color: "from-red-500 to-red-600",
      stats: `${stats?.activeMatches || 0} Pertandingan Aktif`
    }
  ];

  return (
    <div className="p-6">
      <Header 
        title="Dashboard Turnamen" 
        subtitle="Sistem manajemen turnamen Taekwondo"
      />
      
      <LoadingOverlay isVisible={isLoading} />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atlet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAthletes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.presentAthletes || 0} hadir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCategories || 0}</div>
            <p className="text-xs text-muted-foreground">
              Siap bertanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pertandingan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sedang berlangsung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedMatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pertandingan selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {navigationCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-4`}>
                  <i className={`${card.icon} text-white text-xl`}></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{card.stats}</span>
                  <Button variant="ghost" size="sm">
                    Buka <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Matches */}
      {activeMatches && activeMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pertandingan Berlangsung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{match.category}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ring {match.ring} - Round {match.round}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-red-600">{match.redCorner.name}</p>
                      <p className="text-xs text-muted-foreground">{match.redCorner.dojang}</p>
                    </div>
                    <span className="text-lg font-bold">VS</span>
                    <div>
                      <p className="font-medium text-blue-600">{match.blueCorner.name}</p>
                      <p className="text-xs text-muted-foreground">{match.blueCorner.dojang}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}