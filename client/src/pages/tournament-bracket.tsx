import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ChevronRight, Plus, Edit2, Trash2, Users, Trophy, Target } from "lucide-react";
import type { MainCategory, SubCategory, AthleteGroup, GroupAthlete, Athlete } from "@shared/schema";

export default function TournamentBracket() {
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedAthleteGroup, setSelectedAthleteGroup] = useState<AthleteGroup | null>(null);
  const [showCreateMainCategory, setShowCreateMainCategory] = useState(false);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);
  const [showCreateAthleteGroup, setShowCreateAthleteGroup] = useState(false);
  const [showAddAthleteToGroup, setShowAddAthleteToGroup] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch main categories
  const { data: mainCategories = [], isLoading: loadingMainCategories } = useQuery({
    queryKey: ['main-categories'],
    queryFn: api.getMainCategories,
  });

  // Fetch sub categories for selected main category
  const { data: subCategories = [], isLoading: loadingSubCategories } = useQuery({
    queryKey: ['sub-categories', selectedMainCategory?.id],
    queryFn: () => api.getSubCategories(selectedMainCategory!.id),
    enabled: !!selectedMainCategory,
  });

  // Fetch athlete groups for selected sub category
  const { data: athleteGroups = [], isLoading: loadingAthleteGroups } = useQuery({
    queryKey: ['athlete-groups', selectedSubCategory?.id],
    queryFn: () => api.getAthleteGroups(selectedSubCategory!.id),
    enabled: !!selectedSubCategory,
  });

  // Fetch group athletes for selected athlete group
  const { data: groupAthletes = [], isLoading: loadingGroupAthletes } = useQuery({
    queryKey: ['group-athletes', selectedAthleteGroup?.id],
    queryFn: () => api.getGroupAthletes(selectedAthleteGroup!.id),
    enabled: !!selectedAthleteGroup,
  });

  // Fetch all athletes for selection
  const { data: allAthletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: api.getAthletes,
  });

  // Main category mutations
  const createMainCategoryMutation = useMutation({
    mutationFn: api.createMainCategory,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kategori utama berhasil dibuat",
      });
      setShowCreateMainCategory(false);
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal membuat kategori utama",
        variant: "destructive",
      });
    },
  });

  const deleteMainCategoryMutation = useMutation({
    mutationFn: api.deleteMainCategory,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kategori utama berhasil dihapus",
      });
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
      setSelectedAthleteGroup(null);
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus kategori utama",
        variant: "destructive",
      });
    },
  });

  // Sub category mutations
  const createSubCategoryMutation = useMutation({
    mutationFn: api.createSubCategory,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Sub kategori berhasil dibuat",
      });
      setShowCreateSubCategory(false);
      queryClient.invalidateQueries({ queryKey: ['sub-categories', selectedMainCategory?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal membuat sub kategori",
        variant: "destructive",
      });
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: api.deleteSubCategory,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Sub kategori berhasil dihapus",
      });
      setSelectedSubCategory(null);
      setSelectedAthleteGroup(null);
      queryClient.invalidateQueries({ queryKey: ['sub-categories', selectedMainCategory?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus sub kategori",
        variant: "destructive",
      });
    },
  });

  // Athlete group mutations
  const createAthleteGroupMutation = useMutation({
    mutationFn: api.createAthleteGroup,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kelompok atlet berhasil dibuat",
      });
      setShowCreateAthleteGroup(false);
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal membuat kelompok atlet",
        variant: "destructive",
      });
    },
  });

  const deleteAthleteGroupMutation = useMutation({
    mutationFn: api.deleteAthleteGroup,
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kelompok atlet berhasil dihapus",
      });
      setSelectedAthleteGroup(null);
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus kelompok atlet",
        variant: "destructive",
      });
    },
  });

  // Group athlete mutations
  const addAthleteToGroupMutation = useMutation({
    mutationFn: ({ groupId, athleteData }: { groupId: number; athleteData: any }) => 
      api.addAthleteToGroup(groupId, athleteData),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Atlet berhasil ditambahkan ke kelompok",
      });
      setShowAddAthleteToGroup(false);
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menambahkan atlet ke kelompok",
        variant: "destructive",
      });
    },
  });

  const removeAthleteFromGroupMutation = useMutation({
    mutationFn: ({ groupId, athleteId }: { groupId: number; athleteId: number }) => 
      api.removeAthleteFromGroup(groupId, athleteId),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Atlet berhasil dihapus dari kelompok",
      });
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus atlet dari kelompok",
        variant: "destructive",
      });
    },
  });

  const updateAthletePositionMutation = useMutation({
    mutationFn: ({ groupId, athleteId, position, queueOrder }: { groupId: number; athleteId: number; position: string; queueOrder?: number }) => 
      api.updateAthletePosition(groupId, athleteId, position, queueOrder),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Posisi atlet berhasil diperbarui",
      });
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memperbarui posisi atlet",
        variant: "destructive",
      });
    },
  });

  const eliminateAthleteMutation = useMutation({
    mutationFn: ({ groupId, athleteId }: { groupId: number; athleteId: number }) => 
      api.eliminateAthlete(groupId, athleteId),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Atlet berhasil dieliminasi",
      });
      queryClient.invalidateQueries({ queryKey: ['group-athletes', selectedAthleteGroup?.id] });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal mengeliminasi atlet",
        variant: "destructive",
      });
    },
  });

  // Create main category form
  const handleCreateMainCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (!name) return;
    
    createMainCategoryMutation.mutate({
      name,
      description: description || undefined,
    });
  };

  // Create sub category form
  const handleCreateSubCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const order = parseInt(formData.get('order') as string);
    
    if (!name || !selectedMainCategory) return;
    
    createSubCategoryMutation.mutate({
      mainCategoryId: selectedMainCategory.id,
      name,
      order,
    });
  };

  // Create athlete group form
  const handleCreateAthleteGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const minAthletes = parseInt(formData.get('minAthletes') as string) || 2;
    const maxAthletes = parseInt(formData.get('maxAthletes') as string) || 8;
    
    if (!name || !selectedSubCategory) return;
    
    createAthleteGroupMutation.mutate({
      subCategoryId: selectedSubCategory.id,
      name,
      minAthletes,
      maxAthletes,
    });
  };

  // Add athlete to group form
  const handleAddAthleteToGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const athleteId = parseInt(formData.get('athleteId') as string);
    const position = formData.get('position') as string;
    const queueOrder = parseInt(formData.get('queueOrder') as string) || undefined;
    
    if (!athleteId || !selectedAthleteGroup) return;
    
    addAthleteToGroupMutation.mutate({
      groupId: selectedAthleteGroup.id,
      athleteData: {
        athleteId,
        position,
        queueOrder,
      },
    });
  };

  // Get athlete info by ID
  const getAthleteById = (id: number): Athlete | undefined => {
    return allAthletes.find(athlete => athlete.id === id);
  };

  // Get position badge color
  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      case 'queue':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <Header 
        title="Bracket Turnamen" 
        subtitle="Sistem manajemen bracket turnamen hierarkis"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Kategori Utama
            </CardTitle>
            <Dialog open={showCreateMainCategory} onOpenChange={setShowCreateMainCategory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Kategori Utama</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMainCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Kategori</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Contoh: Kyorugi, Poomsae"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input 
                      id="description" 
                      name="description" 
                      placeholder="Deskripsi kategori (opsional)"
                    />
                  </div>
                  <Button type="submit" disabled={createMainCategoryMutation.isPending}>
                    {createMainCategoryMutation.isPending ? 'Membuat...' : 'Buat Kategori'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingMainCategories ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : mainCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada kategori utama</div>
            ) : (
              mainCategories.map(category => (
                <div 
                  key={category.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMainCategory?.id === category.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedMainCategory(category);
                    setSelectedSubCategory(null);
                    setSelectedAthleteGroup(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMainCategoryMutation.mutate(category.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sub Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Sub Kategori
            </CardTitle>
            {selectedMainCategory && (
              <Dialog open={showCreateSubCategory} onOpenChange={setShowCreateSubCategory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Sub Kategori</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Sub Kategori</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Contoh: Putra Junior, Putri Senior"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order">Urutan (Number)</Label>
                      <Input 
                        id="order" 
                        name="order" 
                        type="number"
                        placeholder="1"
                        min="1"
                        required 
                      />
                    </div>
                    <Button type="submit" disabled={createSubCategoryMutation.isPending}>
                      {createSubCategoryMutation.isPending ? 'Membuat...' : 'Buat Sub Kategori'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedMainCategory ? (
              <div className="text-sm text-muted-foreground">Pilih kategori utama terlebih dahulu</div>
            ) : loadingSubCategories ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : subCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada sub kategori</div>
            ) : (
              subCategories
                .sort((a, b) => a.order - b.order)
                .map(subCategory => (
                  <div 
                    key={subCategory.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubCategory?.id === subCategory.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedSubCategory(subCategory);
                      setSelectedAthleteGroup(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{subCategory.name}</div>
                        <div className="text-xs text-muted-foreground">Urutan: {subCategory.order}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubCategoryMutation.mutate(subCategory.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Athlete Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kelompok Atlet
            </CardTitle>
            {selectedSubCategory && (
              <Dialog open={showCreateAthleteGroup} onOpenChange={setShowCreateAthleteGroup}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Kelompok Atlet</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAthleteGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Kelompok</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Contoh: Grup A, Grup B"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minAthletes">Minimal Atlet</Label>
                      <Input 
                        id="minAthletes" 
                        name="minAthletes" 
                        type="number"
                        placeholder="2"
                        min="2"
                        defaultValue="2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAthletes">Maksimal Atlet</Label>
                      <Input 
                        id="maxAthletes" 
                        name="maxAthletes" 
                        type="number"
                        placeholder="8"
                        min="2"
                        defaultValue="8"
                      />
                    </div>
                    <Button type="submit" disabled={createAthleteGroupMutation.isPending}>
                      {createAthleteGroupMutation.isPending ? 'Membuat...' : 'Buat Kelompok'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedSubCategory ? (
              <div className="text-sm text-muted-foreground">Pilih sub kategori terlebih dahulu</div>
            ) : loadingAthleteGroups ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : athleteGroups.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada kelompok atlet</div>
            ) : (
              athleteGroups.map(group => (
                <div 
                  key={group.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAthleteGroup?.id === group.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAthleteGroup(group)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.currentCount || 0}/{group.maxAthletes || 8} atlet
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAthleteGroupMutation.mutate(group.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Group Athletes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Daftar Atlet</CardTitle>
            {selectedAthleteGroup && (
              <Dialog open={showAddAthleteToGroup} onOpenChange={setShowAddAthleteToGroup}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Atlet ke Kelompok</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAthleteToGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="athleteId">Pilih Atlet</Label>
                      <Select name="athleteId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih atlet" />
                        </SelectTrigger>
                        <SelectContent>
                          {allAthletes.map(athlete => (
                            <SelectItem key={athlete.id} value={athlete.id.toString()}>
                              {athlete.name} - {athlete.dojang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Posisi</Label>
                      <Select name="position" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih posisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">Sudut Merah</SelectItem>
                          <SelectItem value="blue">Sudut Biru</SelectItem>
                          <SelectItem value="queue">Antrian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="queueOrder">Urutan Antrian (jika posisi antrian)</Label>
                      <Input 
                        id="queueOrder" 
                        name="queueOrder" 
                        type="number"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <Button type="submit" disabled={addAthleteToGroupMutation.isPending}>
                      {addAthleteToGroupMutation.isPending ? 'Menambahkan...' : 'Tambah Atlet'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedAthleteGroup ? (
              <div className="text-sm text-muted-foreground">Pilih kelompok atlet terlebih dahulu</div>
            ) : loadingGroupAthletes ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : groupAthletes.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada atlet dalam kelompok</div>
            ) : (
              groupAthletes.map(groupAthlete => {
                const athlete = getAthleteById(groupAthlete.athleteId!);
                return (
                  <div 
                    key={groupAthlete.id} 
                    className={`p-3 rounded-lg border ${
                      groupAthlete.isEliminated 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{athlete?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">
                          {athlete?.dojang} - {athlete?.category}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPositionBadgeColor(groupAthlete.position!)}`}
                          >
                            {groupAthlete.position === 'red' ? 'Merah' : 
                             groupAthlete.position === 'blue' ? 'Biru' : 'Antrian'}
                          </Badge>
                          {groupAthlete.queueOrder && (
                            <Badge variant="outline" className="text-xs">
                              Antrian #{groupAthlete.queueOrder}
                            </Badge>
                          )}
                          {groupAthlete.isEliminated && (
                            <Badge variant="destructive" className="text-xs">
                              Gugur
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!groupAthlete.isEliminated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              eliminateAthleteMutation.mutate({
                                groupId: selectedAthleteGroup.id,
                                athleteId: groupAthlete.athleteId!,
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Gugur
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeAthleteFromGroupMutation.mutate({
                              groupId: selectedAthleteGroup.id,
                              athleteId: groupAthlete.athleteId!,
                            });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}