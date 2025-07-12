import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { 
  MainCategory, 
  SubCategory, 
  AthleteGroup, 
  GroupAthlete, 
  Athlete,
  InsertMainCategory,
  InsertSubCategory,
  InsertAthleteGroup,
  InsertGroupAthlete
} from "@shared/schema";

type ViewMode = 'main-categories' | 'sub-categories' | 'athlete-groups' | 'group-athletes';

export default function Tournament() {
  const [viewMode, setViewMode] = useState<ViewMode>('main-categories');
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedAthleteGroup, setSelectedAthleteGroup] = useState<AthleteGroup | null>(null);
  
  // Dialog states
  const [showCreateMainCategory, setShowCreateMainCategory] = useState(false);
  const [showEditMainCategory, setShowEditMainCategory] = useState(false);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);
  const [showCreateAthleteGroup, setShowCreateAthleteGroup] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useRealtime();

  // Main Categories
  const { data: mainCategories = [], isLoading: loadingMainCategories } = useQuery({
    queryKey: ['main-categories'],
    queryFn: api.getMainCategories,
  });

  // Sub Categories
  const { data: subCategories = [], isLoading: loadingSubCategories } = useQuery({
    queryKey: ['sub-categories', selectedMainCategory?.id],
    queryFn: () => api.getSubCategories(selectedMainCategory!.id),
    enabled: !!selectedMainCategory,
  });

  // Athlete Groups
  const { data: athleteGroups = [], isLoading: loadingAthleteGroups } = useQuery({
    queryKey: ['athlete-groups', selectedSubCategory?.id],
    queryFn: () => api.getAthleteGroups(selectedSubCategory!.id),
    enabled: !!selectedSubCategory,
  });

  // Group Athletes
  const { data: groupAthletes = [], isLoading: loadingGroupAthletes } = useQuery({
    queryKey: ['group-athletes', selectedAthleteGroup?.id],
    queryFn: () => api.getGroupAthletes(selectedAthleteGroup!.id),
    enabled: !!selectedAthleteGroup,
  });

  // All Athletes for selection
  const { data: allAthletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: api.getAthletes,
  });

  // Mutations
  const createMainCategoryMutation = useMutation({
    mutationFn: api.createMainCategory,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kategori utama berhasil dibuat" });
      setShowCreateMainCategory(false);
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat kategori utama", variant: "destructive" });
    },
  });

  const updateMainCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMainCategory> }) => api.updateMainCategory(id, data),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kategori utama berhasil diperbarui" });
      setShowEditMainCategory(false);
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal memperbarui kategori utama", variant: "destructive" });
    },
  });

  const deleteMainCategoryMutation = useMutation({
    mutationFn: api.deleteMainCategory,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kategori utama berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus kategori utama", variant: "destructive" });
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: api.createSubCategory,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Sub kategori berhasil dibuat" });
      setShowCreateSubCategory(false);
      queryClient.invalidateQueries({ queryKey: ['sub-categories', selectedMainCategory?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat sub kategori", variant: "destructive" });
    },
  });

  const createAthleteGroupMutation = useMutation({
    mutationFn: api.createAthleteGroup,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kelompok atlet berhasil dibuat" });
      setShowCreateAthleteGroup(false);
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat kelompok atlet", variant: "destructive" });
    },
  });

  const addAthleteToGroupMutation = useMutation({
    mutationFn: api.addAthleteToGroup,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Atlet berhasil ditambahkan ke kelompok" });
      setShowAddAthlete(false);
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menambahkan atlet ke kelompok", variant: "destructive" });
    },
  });

  const declareWinnerMutation = useMutation({
    mutationFn: ({ athleteId, groupId }: { athleteId: number; groupId: number }) =>
      api.updateAthletePosition(groupId, athleteId, 'winner'),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Pemenang telah ditetapkan" });
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menetapkan pemenang", variant: "destructive" });
    },
  });

  // Handle form submissions
  const handleCreateMainCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertMainCategory = {
      name: formData.get('name') as string,
    };
    createMainCategoryMutation.mutate(data);
  };

  const handleEditMainCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const formData = new FormData(e.currentTarget);
    const data: Partial<InsertMainCategory> = {
      name: formData.get('name') as string,
    };
    updateMainCategoryMutation.mutate({ id: editingCategory.id, data });
  };

  const handleDeleteMainCategory = (category: MainCategory) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      deleteMainCategoryMutation.mutate(category.id);
    }
  };

  const openEditDialog = (category: MainCategory) => {
    setEditingCategory(category);
    setShowEditMainCategory(true);
  };

  const handleCreateSubCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertSubCategory = {
      mainCategoryId: selectedMainCategory!.id,
      name: formData.get('name') as string,
      order: parseInt(formData.get('order') as string) || 1,
    };
    createSubCategoryMutation.mutate(data);
  };

  const handleCreateAthleteGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertAthleteGroup = {
      subCategoryId: selectedSubCategory!.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };
    createAthleteGroupMutation.mutate(data);
  };

  const handleAddAthlete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertGroupAthlete = {
      athleteGroupId: selectedAthleteGroup!.id,
      athleteId: parseInt(formData.get('athleteId') as string),
      position: formData.get('position') as string,
      queueOrder: parseInt(formData.get('queueOrder') as string) || 1,
    };
    addAthleteToGroupMutation.mutate(data);
  };

  // Navigation functions
  const navigateToSubCategories = (mainCategory: MainCategory) => {
    setSelectedMainCategory(mainCategory);
    setSelectedSubCategory(null);
    setSelectedAthleteGroup(null);
    setViewMode('sub-categories');
  };

  const navigateToAthleteGroups = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setSelectedAthleteGroup(null);
    setViewMode('athlete-groups');
  };

  const navigateToGroupAthletes = (athleteGroup: AthleteGroup) => {
    setSelectedAthleteGroup(athleteGroup);
    setViewMode('group-athletes');
  };

  const navigateBack = () => {
    switch (viewMode) {
      case 'sub-categories':
        setViewMode('main-categories');
        setSelectedMainCategory(null);
        break;
      case 'athlete-groups':
        setViewMode('sub-categories');
        setSelectedSubCategory(null);
        break;
      case 'group-athletes':
        setViewMode('athlete-groups');
        setSelectedAthleteGroup(null);
        break;
    }
  };

  // Render functions
  const renderMainCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kategori Utama</h2>
          <p className="text-gray-600">Kelola jenis pertandingan seperti Poomsae, Kyorugi, dll.</p>
        </div>
        <Dialog open={showCreateMainCategory} onOpenChange={setShowCreateMainCategory}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kategori Utama</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMainCategory} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input id="name" name="name" placeholder="Contoh: Kyorugi, Poomsae" required />
              </div>
              <Button type="submit" className="w-full">
                Buat Kategori
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Main Category Dialog */}
        <Dialog open={showEditMainCategory} onOpenChange={setShowEditMainCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Kategori Utama</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditMainCategory} className="space-y-4">
              <div>
                <Label htmlFor="editName">Nama Kategori</Label>
                <Input 
                  id="editName" 
                  name="name" 
                  placeholder="Contoh: Kyorugi, Poomsae" 
                  defaultValue={editingCategory?.name || ''} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full">
                Perbarui Kategori
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {category.name}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMainCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigateToSubCategories(category)}
                className="w-full"
              >
                Lihat Sub Kategori
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sub Kategori - {selectedMainCategory?.name}</h2>
          <p className="text-gray-600">Kelola pengelompokan berdasarkan umur, sabuk, atau kriteria lainnya.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={showCreateSubCategory} onOpenChange={setShowCreateSubCategory}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Sub Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Sub Kategori</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubCategory} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Sub Kategori</Label>
                <Input id="name" name="name" placeholder="Contoh: Remaja, Dewasa" required />
              </div>
              <div>
                <Label htmlFor="order">Nomor Urut</Label>
                <Input id="order" name="order" type="number" placeholder="1" min="1" required />
              </div>
              <Button type="submit" className="w-full">
                Buat Sub Kategori
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subCategories.map((subCategory) => (
          <Card key={subCategory.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {subCategory.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Urutan #{subCategory.order}</Badge>
              </div>
              <Button 
                onClick={() => navigateToAthleteGroups(subCategory)}
                className="w-full"
              >
                Lihat Kelompok Atlet
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAthleteGroups = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelompok Atlet - {selectedSubCategory?.name}</h2>
          <p className="text-gray-600">Pertandingan antara dua atlet (merah vs biru) dengan sistem eliminasi.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={showCreateAthleteGroup} onOpenChange={setShowCreateAthleteGroup}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Kelompok
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kelompok Atlet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAthleteGroup} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Kelompok</Label>
                <Input id="name" name="name" placeholder="Contoh: Kelompok A, Final" required />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" name="description" placeholder="Deskripsi kelompok..." />
              </div>
              <Button type="submit" className="w-full">
                Buat Kelompok
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {athleteGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{group.description}</p>
              <Button 
                onClick={() => navigateToGroupAthletes(group)}
                className="w-full"
              >
                Kelola Pertandingan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGroupAthletes = () => {
    const redCorner = groupAthletes.find(ga => ga.position === 'red' && !ga.isEliminated);
    const blueCorner = groupAthletes.find(ga => ga.position === 'blue' && !ga.isEliminated);
    const queue = groupAthletes.filter(ga => ga.position === 'queue' && !ga.isEliminated);
    const eliminated = groupAthletes.filter(ga => ga.isEliminated);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manajemen Pertandingan - {selectedAthleteGroup?.name}</h2>
            <p className="text-gray-600">Kelola atlet dalam pertandingan, tentukan pemenang, dan atur antrian.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog open={showAddAthlete} onOpenChange={setShowAddAthlete}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Atlet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Atlet ke Kelompok</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAthlete} className="space-y-4">
                <div>
                  <Label htmlFor="athleteId">Pilih Atlet</Label>
                  <Select name="athleteId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih atlet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAthletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id.toString()}>
                          {athlete.name} - {athlete.dojang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Posisi</Label>
                  <Select name="position" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih posisi..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Sudut Merah</SelectItem>
                      <SelectItem value="blue">Sudut Biru</SelectItem>
                      <SelectItem value="queue">Antrian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="queueOrder">Urutan Antrian</Label>
                  <Input id="queueOrder" name="queueOrder" type="number" placeholder="1" min="1" />
                </div>
                <Button type="submit" className="w-full">
                  Tambah Atlet
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Match Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Red Corner */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Sudut Merah</CardTitle>
            </CardHeader>
            <CardContent>
              {redCorner ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{allAthletes.find(a => a.id === redCorner.athleteId)?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {allAthletes.find(a => a.id === redCorner.athleteId)?.dojang}
                    </p>
                  </div>
                  <Button
                    onClick={() => declareWinnerMutation.mutate({ 
                      athleteId: redCorner.athleteId, 
                      groupId: selectedAthleteGroup!.id 
                    })}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={declareWinnerMutation.isPending}
                  >
                    Menang
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Belum ada atlet</p>
              )}
            </CardContent>
          </Card>

          {/* Blue Corner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-600">Sudut Biru</CardTitle>
            </CardHeader>
            <CardContent>
              {blueCorner ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{allAthletes.find(a => a.id === blueCorner.athleteId)?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {allAthletes.find(a => a.id === blueCorner.athleteId)?.dojang}
                    </p>
                  </div>
                  <Button
                    onClick={() => declareWinnerMutation.mutate({ 
                      athleteId: blueCorner.athleteId, 
                      groupId: selectedAthleteGroup!.id 
                    })}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={declareWinnerMutation.isPending}
                  >
                    Menang
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Belum ada atlet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Antrian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queue.map((queueAthlete) => (
                  <div key={queueAthlete.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">
                        {allAthletes.find(a => a.id === queueAthlete.athleteId)?.name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        - {allAthletes.find(a => a.id === queueAthlete.athleteId)?.dojang}
                      </span>
                    </div>
                    <Badge variant="outline">#{queueAthlete.queueOrder}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eliminated */}
        {eliminated.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tersingkir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eliminated.map((eliminatedAthlete) => (
                  <div key={eliminatedAthlete.id} className="flex items-center justify-between p-3 bg-gray-100 rounded opacity-60">
                    <div>
                      <span className="font-medium">
                        {allAthletes.find(a => a.id === eliminatedAthlete.athleteId)?.name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        - {allAthletes.find(a => a.id === eliminatedAthlete.athleteId)?.dojang}
                      </span>
                    </div>
                    <Badge variant="destructive">Tersingkir</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <Header 
        title="Manajemen Pertandingan" 
        subtitle="Sistem manajemen turnamen hierarkis - Kategori Utama → Sub Kategori → Kelompok Atlet → Manajemen Pertandingan"
      />
      
      <LoadingOverlay 
        isLoading={
          loadingMainCategories || 
          loadingSubCategories || 
          loadingAthleteGroups || 
          loadingGroupAthletes
        } 
      />

      <div className="max-w-7xl mx-auto">
        {viewMode === 'main-categories' && renderMainCategories()}
        {viewMode === 'sub-categories' && renderSubCategories()}
        {viewMode === 'athlete-groups' && renderAthleteGroups()}
        {viewMode === 'group-athletes' && renderGroupAthletes()}
      </div>
    </div>
  );
}