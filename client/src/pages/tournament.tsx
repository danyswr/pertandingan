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
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Users, Crown, X } from "lucide-react";
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
  const [showEditAthleteGroup, setShowEditAthleteGroup] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
  const [editingGroup, setEditingGroup] = useState<AthleteGroup | null>(null);
  
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

  const addAthleteMutation = useMutation({
    mutationFn: api.addAthleteToGroup,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Atlet berhasil ditambahkan ke kelompok" });
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

  const deleteAthleteGroupMutation = useMutation({
    mutationFn: api.deleteAthleteGroup,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kelompok atlet berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus kelompok atlet", variant: "destructive" });
    },
  });

  const removeAthleteMutation = useMutation({
    mutationFn: ({ groupId, athleteId }: { groupId: number; athleteId: number }) =>
      api.removeAthleteFromGroup(groupId, athleteId),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Atlet berhasil dihapus dari kelompok" });
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus atlet dari kelompok", variant: "destructive" });
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
      matchNumber: parseInt(formData.get('matchNumber') as string) || 1,
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
                <Label htmlFor="matchNumber">Nomor Partai</Label>
                <Input id="matchNumber" name="matchNumber" type="number" placeholder="1" min="1" required />
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
              <div className="space-y-2 mb-4">
                <p className="text-gray-600">{group.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Partai #{group.matchNumber || 1}</Badge>
                </div>
              </div>
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

  const [selectedCorner, setSelectedCorner] = useState<'red' | 'blue' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterDojang, setFilterDojang] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'weight' | 'belt'>('name');

  const redCorner = groupAthletes.find(ga => ga.position === 'red' && !ga.isEliminated);
  const blueCorner = groupAthletes.find(ga => ga.position === 'blue' && !ga.isEliminated);
  const queue = groupAthletes.filter(ga => ga.position === 'queue' && !ga.isEliminated);
  const eliminated = groupAthletes.filter(ga => ga.isEliminated);

  // Filter athletes for selection
  const availableAthletes = allAthletes
    .filter(athlete => 
      !groupAthletes.find(ga => ga.athleteId === athlete.id) &&
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterBelt === 'all' || filterBelt === '' || filterBelt === 'unknown' || athlete.belt === filterBelt) &&
      (filterGender === 'all' || filterGender === '' || filterGender === 'unknown' || athlete.gender === filterGender) &&
      (filterDojang === 'all' || filterDojang === '' || filterDojang === 'unknown' || athlete.dojang === filterDojang) &&
      athlete.isPresent // Only show present athletes
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'weight':
          return a.weight - b.weight;
        case 'belt':
          return a.belt.localeCompare(b.belt);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Get unique values for filter options
  const uniqueBelts = [...new Set(allAthletes.map(a => a.belt))].filter(belt => belt && belt.trim());
  const uniqueGenders = [...new Set(allAthletes.map(a => a.gender))].filter(gender => gender && gender.trim());
  const uniqueDojangs = [...new Set(allAthletes.map(a => a.dojang))].filter(dojang => dojang && dojang.trim());

  const handleAthleteSelect = (athleteId: number) => {
    if (!selectedCorner || !selectedAthleteGroup) return;
    
    const position = selectedCorner;
    addAthleteMutation.mutate({
      groupId: selectedAthleteGroup.id,
      athleteId,
      position,
      queueOrder: 1
    });
    
    // Reset dialog state
    setSelectedCorner(null);
    setSearchTerm('');
    setFilterBelt('');
    setFilterGender('');
    setFilterDojang('');
    setSortBy('name');
  };

  const renderGroupAthletes = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Kelompok Atlet - {selectedSubCategory?.name} - {selectedAthleteGroup?.name}
            </h2>
            <p className="text-gray-600">Pertandingan antara dua atlet (merah vs biru) dengan sistem eliminasi.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog open={showAddAthlete} onOpenChange={setShowAddAthlete}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Kelompok
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kelompok Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAthleteGroup} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Kelompok</Label>
                  <Input id="name" name="name" placeholder="Contoh: Partai 1" required />
                </div>
                <div>
                  <Label htmlFor="matchNumber">Nomor Partai</Label>
                  <Input id="matchNumber" name="matchNumber" type="number" placeholder="1" min="1" required />
                </div>
                <Button type="submit" className="w-full">
                  Buat Kelompok
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vertical Layout of Match Groups */}
        <div className="space-y-8">
          {athleteGroups.map((group) => {
            const groupRedCorner = groupAthletes.find(ga => ga.groupId === group.id && ga.position === 'red' && !ga.isEliminated);
            const groupBlueCorner = groupAthletes.find(ga => ga.groupId === group.id && ga.position === 'blue' && !ga.isEliminated);
            
            return (
              <Card key={group.id} className="border-2 border-gray-200">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-500" />
                        {group.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Partai #{group.matchNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAthleteGroup(group);
                          setEditingGroup(group);
                          setShowEditAthleteGroup(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAthleteGroupMutation.mutate(group.id)}
                        disabled={deleteAthleteGroupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Match Interface for this specific group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Corner */}
                    <Card 
                      className={`border-2 transition-all cursor-pointer ${
                        selectedCorner === 'red' && selectedAthleteGroup?.id === group.id
                          ? 'border-red-500 bg-red-50 shadow-lg' 
                          : groupRedCorner 
                            ? 'border-red-200 bg-red-50' 
                            : 'border-red-200 bg-red-50 hover:border-red-300'
                      }`}
                      onClick={() => {
                        if (!groupRedCorner) {
                          setSelectedAthleteGroup(group);
                          setSelectedCorner('red');
                        }
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-red-600 flex items-center justify-between">
                          <span>Sudut Merah</span>
                          {groupRedCorner && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                declareWinnerMutation.mutate({ 
                                  athleteId: groupRedCorner.athleteId, 
                                  groupId: group.id 
                                });
                              }}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={declareWinnerMutation.isPending}
                            >
                              Menang
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {groupRedCorner ? (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {allAthletes.find(a => a.id === groupRedCorner.athleteId)?.name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Dojang:</strong> {allAthletes.find(a => a.id === groupRedCorner.athleteId)?.dojang}</p>
                              <p><strong>Sabuk:</strong> {allAthletes.find(a => a.id === groupRedCorner.athleteId)?.belt}</p>
                              <p><strong>BB:</strong> {allAthletes.find(a => a.id === groupRedCorner.athleteId)?.weight} kg</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAthleteMutation.mutate({ 
                                  groupId: group.id, 
                                  athleteId: groupRedCorner.athleteId 
                                });
                              }}
                              className="mt-2"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Plus className="h-12 w-12 text-red-400 mx-auto mb-2" />
                            <p className="text-red-600 font-medium">Klik untuk menambah atlet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Blue Corner */}
                    <Card 
                      className={`border-2 transition-all cursor-pointer ${
                        selectedCorner === 'blue' && selectedAthleteGroup?.id === group.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : groupBlueCorner 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        if (!groupBlueCorner) {
                          setSelectedAthleteGroup(group);
                          setSelectedCorner('blue');
                        }
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-blue-600 flex items-center justify-between">
                          <span>Sudut Biru</span>
                          {groupBlueCorner && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                declareWinnerMutation.mutate({ 
                                  athleteId: groupBlueCorner.athleteId, 
                                  groupId: group.id 
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={declareWinnerMutation.isPending}
                            >
                              Menang
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {groupBlueCorner ? (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {allAthletes.find(a => a.id === groupBlueCorner.athleteId)?.name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Dojang:</strong> {allAthletes.find(a => a.id === groupBlueCorner.athleteId)?.dojang}</p>
                              <p><strong>Sabuk:</strong> {allAthletes.find(a => a.id === groupBlueCorner.athleteId)?.belt}</p>
                              <p><strong>BB:</strong> {allAthletes.find(a => a.id === groupBlueCorner.athleteId)?.weight} kg</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAthleteMutation.mutate({ 
                                  groupId: group.id, 
                                  athleteId: groupBlueCorner.athleteId 
                                });
                              }}
                              className="mt-2"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Plus className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-600 font-medium">Klik untuk menambah atlet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Athlete Selection Modal */}
        <Dialog open={!!selectedCorner} onOpenChange={() => {
          setSelectedCorner(null);
          setSearchTerm('');
          setFilterBelt('all');
          setFilterGender('all');
          setFilterDojang('all');
          setSortBy('name');
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Pilih Atlet untuk Sudut {selectedCorner === 'red' ? 'Merah' : 'Biru'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Cari Atlet</Label>
                <Input
                  placeholder="Ketik nama atlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Filter Sabuk</Label>
                  <Select value={filterBelt} onValueChange={setFilterBelt}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Semua Sabuk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Sabuk</SelectItem>
                      {uniqueBelts.map(belt => (
                        <SelectItem key={belt} value={belt || 'unknown'}>{belt || 'Tidak diketahui'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Filter Gender</Label>
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Semua Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Gender</SelectItem>
                      {uniqueGenders.map(gender => (
                        <SelectItem key={gender} value={gender || 'unknown'}>{gender || 'Tidak diketahui'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Filter Dojang</Label>
                  <Select value={filterDojang} onValueChange={setFilterDojang}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Semua Dojang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Dojang</SelectItem>
                      {uniqueDojangs.map(dojang => (
                        <SelectItem key={dojang} value={dojang || 'unknown'}>{dojang || 'Tidak diketahui'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Urutkan</Label>
                  <Select value={sortBy} onValueChange={(value: 'name' | 'weight' | 'belt') => setSortBy(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nama</SelectItem>
                      <SelectItem value="weight">Berat Badan</SelectItem>
                      <SelectItem value="belt">Sabuk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBelt('all');
                    setFilterGender('all');
                    setFilterDojang('all');
                    setSortBy('name');
                  }}
                >
                  Reset Filter
                </Button>
                <Badge variant="secondary">
                  {availableAthletes.length} atlet tersedia
                </Badge>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableAthletes.length > 0 ? (
                  availableAthletes.map((athlete) => (
                    <Card 
                      key={athlete.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleAthleteSelect(athlete.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{athlete.name}</h4>
                            <p className="text-sm text-gray-600">
                              {athlete.dojang} • {athlete.belt} • {athlete.weight}kg
                            </p>
                          </div>
                          <Badge variant="outline">
                            {athlete.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    {searchTerm ? 'Tidak ada atlet yang cocok' : 'Tidak ada atlet tersedia'}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Queue Section */}
        {queue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Antrian Atlet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queue.map((queueAthlete) => {
                  const athlete = allAthletes.find(a => a.id === queueAthlete.athleteId);
                  return (
                    <Card key={queueAthlete.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{athlete?.name}</h4>
                          <p className="text-sm text-gray-600">
                            {athlete?.dojang} • {athlete?.belt} • {athlete?.weight}kg
                          </p>
                        </div>
                        <Badge variant="outline">#{queueAthlete.queueOrder}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eliminated Section */}
        {eliminated.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                Atlet Tersingkir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eliminated.map((eliminatedAthlete) => {
                  const athlete = allAthletes.find(a => a.id === eliminatedAthlete.athleteId);
                  return (
                    <Card key={eliminatedAthlete.id} className="p-4 opacity-60 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold line-through">{athlete?.name}</h4>
                          <p className="text-sm text-gray-600">
                            {athlete?.dojang} • {athlete?.belt} • {athlete?.weight}kg
                          </p>
                        </div>
                        <Badge variant="destructive">Tersingkir</Badge>
                      </div>
                    </Card>
                  );
                })}
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