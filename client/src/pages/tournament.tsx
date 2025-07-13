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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Users, Crown, X, MoreVertical, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showEditSubCategory, setShowEditSubCategory] = useState(false);
  const [showCreateAthleteGroup, setShowCreateAthleteGroup] = useState(false);
  const [showEditAthleteGroup, setShowEditAthleteGroup] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editingGroup, setEditingGroup] = useState<AthleteGroup | null>(null);
  
  // Enhanced create athlete group states
  const [createGroupStep, setCreateGroupStep] = useState<'info' | 'athletes'>('info');
  const [selectedRedCorner, setSelectedRedCorner] = useState<Athlete | null>(null);
  const [selectedBlueCorner, setSelectedBlueCorner] = useState<Athlete | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Athlete[]>([]);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');
  const [athleteFilter, setAthleteFilter] = useState({
    belt: 'all',
    gender: 'all',
    dojang: 'all'
  });
  const [groupGender, setGroupGender] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState<{name: string; matchNumber: string; description: string} | null>(null);
  const [activeSelection, setActiveSelection] = useState<'red' | 'blue' | 'queue' | null>(null);
  const [ageRange, setAgeRange] = useState<{min: string; max: string}>({min: '', max: ''});
  const [weightRange, setWeightRange] = useState<{min: string; max: string}>({min: '', max: ''});
  const [heightRange, setHeightRange] = useState<{min: string; max: string}>({min: '', max: ''});
  const [contextMenu, setContextMenu] = useState<{athlete: Athlete; x: number; y: number; currentPosition: 'red' | 'blue' | 'queue'} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Filter athletes based on search and filter criteria
  const filteredAthletes = allAthletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(athleteSearchQuery.toLowerCase()) ||
                         athlete.dojang.toLowerCase().includes(athleteSearchQuery.toLowerCase());
    const matchesBelt = !athleteFilter.belt || athleteFilter.belt === 'all' || athlete.belt === athleteFilter.belt;
    const matchesGender = !athleteFilter.gender || athleteFilter.gender === 'all' || athlete.gender === athleteFilter.gender;
    const matchesDojang = !athleteFilter.dojang || athleteFilter.dojang === 'all' || athlete.dojang === athleteFilter.dojang;
    
    // Age range filter
    const matchesAge = (!ageRange.min || athlete.age >= parseInt(ageRange.min)) && 
                      (!ageRange.max || athlete.age <= parseInt(ageRange.max));
    
    // Weight range filter
    const matchesWeight = (!weightRange.min || athlete.weight >= parseFloat(weightRange.min)) && 
                         (!weightRange.max || athlete.weight <= parseFloat(weightRange.max));
    
    // Height range filter
    const matchesHeight = (!heightRange.min || athlete.height >= parseFloat(heightRange.min)) && 
                         (!heightRange.max || athlete.height <= parseFloat(heightRange.max));
    
    // Exclude already selected athletes
    const isNotSelected = athlete.id !== selectedRedCorner?.id && 
                         athlete.id !== selectedBlueCorner?.id && 
                         !selectedQueue.find(qa => qa.id === athlete.id);
    
    return matchesSearch && matchesBelt && matchesGender && matchesDojang && 
           matchesAge && matchesWeight && matchesHeight && isNotSelected && athlete.isPresent;
  });

  // Get unique values for filters
  const uniqueBelts = [...new Set(allAthletes.map(a => a.belt))];
  const uniqueGenders = [...new Set(allAthletes.map(a => a.gender))];
  const uniqueDojangs = [...new Set(allAthletes.map(a => a.dojang))];

  // Reset dialog states when closing
  const resetCreateAthleteGroupDialog = () => {
    setCreateGroupStep('info');
    setSelectedRedCorner(null);
    setSelectedBlueCorner(null);
    setSelectedQueue([]);
    setAthleteSearchQuery('');
    setAthleteFilter({ belt: 'all', gender: 'all', dojang: 'all' });
    setGroupGender(null);
    setGroupFormData(null);
    setActiveSelection(null);
    setAgeRange({min: '', max: ''});
    setWeightRange({min: '', max: ''});
    setHeightRange({min: '', max: ''});
    setContextMenu(null);
    setShowFilters(false);
  };

  // Handle athlete card click with automatic position filling
  const handleAthleteCardClick = (athlete: Athlete) => {
    // Set gender filter on first athlete selection
    if (!groupGender) {
      setGroupGender(athlete.gender);
      setAthleteFilter(prev => ({ ...prev, gender: athlete.gender }));
    }

    // Auto-fill positions: red corner first, then blue corner, then queue
    if (!selectedRedCorner) {
      setSelectedRedCorner(athlete);
    } else if (!selectedBlueCorner) {
      setSelectedBlueCorner(athlete);
    } else {
      // Both corners filled, add to queue
      setSelectedQueue(prev => [...prev, athlete]);
    }
    
    // Clear active selection since we're using auto-fill
    setActiveSelection(null);
  };

  const removeAthleteFromQueue = (athleteId: number) => {
    setSelectedQueue(prev => prev.filter(a => a.id !== athleteId));
  };

  // Handle right-click context menu
  const handleAthleteRightClick = (e: React.MouseEvent, athlete: Athlete) => {
    e.preventDefault();
    
    let currentPosition: 'red' | 'blue' | 'queue' | null = null;
    if (selectedRedCorner?.id === athlete.id) currentPosition = 'red';
    else if (selectedBlueCorner?.id === athlete.id) currentPosition = 'blue';
    else if (selectedQueue.find(qa => qa.id === athlete.id)) currentPosition = 'queue';
    
    if (currentPosition) {
      setContextMenu({
        athlete,
        x: e.clientX,
        y: e.clientY,
        currentPosition
      });
    }
  };

  // Switch athlete position
  const switchAthletePosition = (athlete: Athlete, newPosition: 'red' | 'blue' | 'queue') => {
    const currentPosition = selectedRedCorner?.id === athlete.id ? 'red' :
                           selectedBlueCorner?.id === athlete.id ? 'blue' : 'queue';
    
    // Remove from current position
    if (currentPosition === 'red') setSelectedRedCorner(null);
    else if (currentPosition === 'blue') setSelectedBlueCorner(null);
    else if (currentPosition === 'queue') removeAthleteFromQueue(athlete.id);
    
    // Add to new position
    if (newPosition === 'red' && !selectedRedCorner) {
      setSelectedRedCorner(athlete);
    } else if (newPosition === 'blue' && !selectedBlueCorner) {
      setSelectedBlueCorner(athlete);
    } else if (newPosition === 'queue' && !selectedQueue.find(qa => qa.id === athlete.id)) {
      setSelectedQueue(prev => [...prev, athlete]);
    }
    
    setContextMenu(null);
  };

  // Switch red and blue corners
  const switchRedBlueCorners = () => {
    const tempRed = selectedRedCorner;
    setSelectedRedCorner(selectedBlueCorner);
    setSelectedBlueCorner(tempRed);
    setContextMenu(null);
  };

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
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat sub kategori", variant: "destructive" });
    },
  });

  const createAthleteGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Create the athlete group first
        const group = await api.createAthleteGroup(data.groupData);
        
        // Add red corner athlete if selected
        if (data.redCornerAthleteId && group.id) {
          await api.addAthleteToGroup({
            athleteGroupId: group.id,
            groupId: group.id,
            athleteId: data.redCornerAthleteId,
            position: 'red'
          });
        }
        
        // Add blue corner athlete if selected
        if (data.blueCornerAthleteId && group.id) {
          await api.addAthleteToGroup({
            athleteGroupId: group.id,
            groupId: group.id,
            athleteId: data.blueCornerAthleteId,
            position: 'blue'
          });
        }

        // Add queue athletes if any
        if (data.queueAthleteIds && data.queueAthleteIds.length > 0 && group.id) {
          for (let i = 0; i < data.queueAthleteIds.length; i++) {
            await api.addAthleteToGroup({
              athleteGroupId: group.id,
              groupId: group.id,
              athleteId: data.queueAthleteIds[i],
              position: 'queue',
              queueOrder: i + 1
            });
          }
        }
        
        return group;
      } catch (error) {
        console.error('Error creating athlete group:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kelompok atlet berhasil dibuat dengan atlet sudut dan antrian" });
      resetCreateAthleteGroupDialog();
      setShowCreateAthleteGroup(false);
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
      queryClient.invalidateQueries({ queryKey: ['group-athletes'] });
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

  const updateAthleteGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAthleteGroup> }) =>
      api.updateAthleteGroup(id, data),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Kelompok atlet berhasil diperbarui" });
      setShowEditAthleteGroup(false);
      setEditingGroup(null);
      queryClient.invalidateQueries({ queryKey: ['athlete-groups', selectedSubCategory?.id] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal memperbarui kelompok atlet", variant: "destructive" });
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertSubCategory> }) =>
      api.updateSubCategory(id, data),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Sub kategori berhasil diperbarui" });
      setShowEditSubCategory(false);
      setEditingSubCategory(null);
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal memperbarui sub kategori", variant: "destructive" });
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: api.deleteSubCategory,
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Sub kategori berhasil dihapus" });
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus sub kategori", variant: "destructive" });
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
    
    const groupData: InsertAthleteGroup = {
      subCategoryId: selectedSubCategory!.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      matchNumber: parseInt(formData.get('matchNumber') as string) || 1,
    };
    
    createAthleteGroupMutation.mutate({
      groupData,
      redCornerAthleteId: selectedRedCorner?.id,
      blueCornerAthleteId: selectedBlueCorner?.id,
    });
  };

  const handleEditAthleteGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGroup) return;
    const formData = new FormData(e.currentTarget);
    const data: Partial<InsertAthleteGroup> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      matchNumber: parseInt(formData.get('matchNumber') as string) || 1,
    };
    updateAthleteGroupMutation.mutate({ id: editingGroup.id, data });
  };

  const handleEditSubCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubCategory) return;
    const formData = new FormData(e.currentTarget);
    const data: Partial<InsertSubCategory> = {
      name: formData.get('name') as string,
      order: parseInt(formData.get('order') as string) || 1,
    };
    updateSubCategoryMutation.mutate({ id: editingSubCategory.id, data });
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

        {/* Edit Sub Category Dialog */}
        <Dialog open={showEditSubCategory} onOpenChange={setShowEditSubCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Sub Kategori</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubCategory} className="space-y-4">
              <div>
                <Label htmlFor="edit-sub-name">Nama Sub Kategori</Label>
                <Input 
                  id="edit-sub-name" 
                  name="name" 
                  placeholder="Contoh: Remaja, Dewasa" 
                  defaultValue={editingSubCategory?.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-sub-order">Nomor Urut</Label>
                <Input 
                  id="edit-sub-order" 
                  name="order" 
                  type="number" 
                  placeholder="1" 
                  min="1" 
                  defaultValue={editingSubCategory?.order}
                  required 
                />
              </div>
              <Button type="submit" className="w-full">
                Perbarui Sub Kategori
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subCategories.map((subCategory) => (
          <Card key={subCategory.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  {subCategory.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingSubCategory(subCategory);
                        setShowEditSubCategory(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Sub Kategori
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm(`Apakah Anda yakin ingin menghapus sub kategori "${subCategory.name}"?`)) {
                          deleteSubCategoryMutation.mutate(subCategory.id);
                        }
                      }}
                      disabled={deleteSubCategoryMutation.isPending}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Sub Kategori
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCreateAthleteGroup(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Kelompok
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Buat Kelompok Atlet
                <Badge variant={createGroupStep === 'info' ? 'default' : 'secondary'}>
                  {createGroupStep === 'info' ? 'Langkah 1: Informasi' : 'Langkah 2: Pilih Atlet'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            {createGroupStep === 'info' ? (
              // Step 1: Group Information
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                setGroupFormData({
                  name: formData.get('name') as string,
                  matchNumber: formData.get('matchNumber') as string,
                  description: formData.get('description') as string || ''
                });
                setCreateGroupStep('athletes');
              }} className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Informasi Kelompok</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Nama Kelompok</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Contoh: Kelompok A, Final" 
                        className="mt-1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="matchNumber" className="text-sm font-medium">Nomor Partai</Label>
                      <Input 
                        id="matchNumber" 
                        name="matchNumber" 
                        type="number" 
                        placeholder="1" 
                        min="1" 
                        className="mt-1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">Deskripsi</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Deskripsi kelompok (opsional)..." 
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetCreateAthleteGroupDialog();
                      setShowCreateAthleteGroup(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    Lanjut ke Pilih Atlet
                  </Button>
                </div>
              </form>
            ) : (
              // Step 2: Athlete Selection
              <div className="space-y-6">
                {/* Selected Athletes Display - Top Section */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Atlet Terpilih</CardTitle>
                    {groupGender && (
                      <Badge variant="outline" className="w-fit">
                        Kelompok: {groupGender}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Red Corner */}
                      <div 
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all duration-300",
                          activeSelection === 'red' 
                            ? "border-red-500 bg-red-100 shadow-lg ring-2 ring-red-200 scale-105" 
                            : "border-red-200 bg-red-50/50 hover:bg-red-100/50",
                          selectedRedCorner && "bg-red-100 scale-105 border-red-400 shadow-md ring-2 ring-red-300"
                        )}
                        onClick={() => setActiveSelection(activeSelection === 'red' ? null : 'red')}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (selectedRedCorner && selectedBlueCorner) {
                            setContextMenu({
                              athlete: selectedRedCorner,
                              x: e.clientX,
                              y: e.clientY,
                              currentPosition: 'red'
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={cn(
                            "font-medium",
                            activeSelection === 'red' ? "text-red-800" : "text-red-700"
                          )}>
                            Sudut Merah {activeSelection === 'red' && '(Klik atlet untuk memilih)'}
                          </h4>
                          {selectedRedCorner && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRedCorner(null);
                                if (!selectedBlueCorner && selectedQueue.length === 0) {
                                  setGroupGender(null);
                                  setAthleteFilter(prev => ({ ...prev, gender: 'all' }));
                                }
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {selectedRedCorner ? (
                          <div 
                            className="space-y-1"
                            onContextMenu={(e) => handleAthleteRightClick(e, selectedRedCorner)}
                          >
                            <p className="font-medium text-sm">{selectedRedCorner.name}</p>
                            <p className="text-xs text-gray-600">{selectedRedCorner.dojang}</p>
                            <p className="text-xs text-gray-600">{selectedRedCorner.belt} • {selectedRedCorner.weight}kg • {selectedRedCorner.gender}</p>
                            <p className="text-xs text-gray-400">Klik kanan untuk pindah posisi</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum dipilih</p>
                        )}
                      </div>

                      {/* Blue Corner */}
                      <div 
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all duration-300",
                          activeSelection === 'blue' 
                            ? "border-blue-500 bg-blue-100 shadow-lg ring-2 ring-blue-200 scale-105" 
                            : "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50",
                          selectedBlueCorner && "bg-blue-100 scale-105 border-blue-400 shadow-md ring-2 ring-blue-300"
                        )}
                        onClick={() => setActiveSelection(activeSelection === 'blue' ? null : 'blue')}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (selectedRedCorner && selectedBlueCorner) {
                            setContextMenu({
                              athlete: selectedBlueCorner,
                              x: e.clientX,
                              y: e.clientY,
                              currentPosition: 'blue'
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={cn(
                            "font-medium",
                            activeSelection === 'blue' ? "text-blue-800" : "text-blue-700"
                          )}>
                            Sudut Biru {activeSelection === 'blue' && '(Klik atlet untuk memilih)'}
                          </h4>
                          {selectedBlueCorner && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlueCorner(null);
                                if (!selectedRedCorner && selectedQueue.length === 0) {
                                  setGroupGender(null);
                                  setAthleteFilter(prev => ({ ...prev, gender: 'all' }));
                                }
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {selectedBlueCorner ? (
                          <div 
                            className="space-y-1"
                            onContextMenu={(e) => handleAthleteRightClick(e, selectedBlueCorner)}
                          >
                            <p className="font-medium text-sm">{selectedBlueCorner.name}</p>
                            <p className="text-xs text-gray-600">{selectedBlueCorner.dojang}</p>
                            <p className="text-xs text-gray-600">{selectedBlueCorner.belt} • {selectedBlueCorner.weight}kg • {selectedBlueCorner.gender}</p>
                            <p className="text-xs text-gray-400">Klik kanan untuk pindah posisi</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum dipilih</p>
                        )}
                      </div>

                      {/* Queue */}
                      <div 
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all duration-300",
                          activeSelection === 'queue' 
                            ? "border-gray-500 bg-gray-100 shadow-lg ring-2 ring-gray-200 scale-105" 
                            : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50",
                          selectedQueue.length > 0 && "bg-gray-100 scale-105 border-gray-400 shadow-md ring-2 ring-gray-300"
                        )}
                        onClick={() => setActiveSelection(activeSelection === 'queue' ? null : 'queue')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={cn(
                            "font-medium",
                            activeSelection === 'queue' ? "text-gray-800" : "text-gray-700"
                          )}>
                            Antrian ({selectedQueue.length}) {activeSelection === 'queue' && '(Klik atlet untuk menambah)'}
                          </h4>
                        </div>
                        {selectedQueue.length > 0 ? (
                          <div className="space-y-2">
                            {selectedQueue.map((athlete, index) => (
                              <div 
                                key={athlete.id} 
                                className="flex items-center justify-between bg-white p-2 rounded border"
                                onContextMenu={(e) => handleAthleteRightClick(e, athlete)}
                              >
                                <div>
                                  <p className="font-medium text-sm">#{index + 1} {athlete.name}</p>
                                  <p className="text-xs text-gray-600">{athlete.dojang} • {athlete.belt}</p>
                                  <p className="text-xs text-gray-400">Klik kanan untuk pindah posisi</p>
                                </div>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAthleteFromQueue(athlete.id);
                                    if (!selectedRedCorner && !selectedBlueCorner && selectedQueue.length === 1) {
                                      setGroupGender(null);
                                      setAthleteFilter(prev => ({ ...prev, gender: 'all' }));
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum ada atlet di antrian</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Section - Filter and Athlete List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel - Filters */}
                  <div className="lg:col-span-1">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Filter Pencarian</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="h-8"
                          >
                            {showFilters ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Sembunyikan
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Tampilkan Filter
                              </>
                            )}
                          </Button>
                        </div>
                        {groupGender && (
                          <p className="text-sm text-gray-600">
                            Filter otomatis untuk {groupGender}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Cari atlet berdasarkan nama atau dojang..."
                            value={athleteSearchQuery}
                            onChange={(e) => setAthleteSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {/* Filter Options - Collapsible */}
                        {showFilters && (
                          <div className="space-y-3 border-t pt-3">
                            <Select value={athleteFilter.belt} onValueChange={(value) => setAthleteFilter(prev => ({ ...prev, belt: value }))}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Semua Sabuk" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Sabuk</SelectItem>
                                {uniqueBelts.map(belt => (
                                  <SelectItem key={belt} value={belt}>{belt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Select 
                              value={athleteFilter.gender} 
                              onValueChange={(value) => {
                                if (!groupGender) {
                                  setAthleteFilter(prev => ({ ...prev, gender: value }));
                                }
                              }}
                              disabled={!!groupGender}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={groupGender || "Semua Gender"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Gender</SelectItem>
                                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                <SelectItem value="Perempuan">Perempuan</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select value={athleteFilter.dojang} onValueChange={(value) => setAthleteFilter(prev => ({ ...prev, dojang: value }))}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Semua Dojang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Dojang</SelectItem>
                                {uniqueDojangs.map(dojang => (
                                  <SelectItem key={dojang} value={dojang}>{dojang}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Age Range Filter */}
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Rentang Umur</Label>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  placeholder="Min"
                                  type="number"
                                  value={ageRange.min}
                                  onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="Max"
                                  type="number"
                                  value={ageRange.max}
                                  onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            {/* Weight Range Filter */}
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Rentang Berat (kg)</Label>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  placeholder="Min"
                                  type="number"
                                  step="0.1"
                                  value={weightRange.min}
                                  onChange={(e) => setWeightRange(prev => ({ ...prev, min: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="Max"
                                  type="number"
                                  step="0.1"
                                  value={weightRange.max}
                                  onChange={(e) => setWeightRange(prev => ({ ...prev, max: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            {/* Height Range Filter */}
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Rentang Tinggi (cm)</Label>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  placeholder="Min"
                                  type="number"
                                  step="0.1"
                                  value={heightRange.min}
                                  onChange={(e) => setHeightRange(prev => ({ ...prev, min: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="Max"
                                  type="number"
                                  step="0.1"
                                  value={heightRange.max}
                                  onChange={(e) => setHeightRange(prev => ({ ...prev, max: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            {/* Reset Filter Button */}
                            {(athleteFilter.belt !== 'all' || athleteFilter.dojang !== 'all' || athleteSearchQuery || 
                              ageRange.min || ageRange.max || weightRange.min || weightRange.max || 
                              heightRange.min || heightRange.max) && !groupGender && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAthleteSearchQuery('');
                                  setAthleteFilter({ belt: 'all', gender: groupGender || 'all', dojang: 'all' });
                                  setAgeRange({min: '', max: ''});
                                  setWeightRange({min: '', max: ''});
                                  setHeightRange({min: '', max: ''});
                                }}
                                className="w-full h-8 text-xs"
                              >
                                Reset Semua Filter
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Filter Summary */}
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <span>Menampilkan {filteredAthletes.length} dari {allAthletes.length} atlet</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Panel - Athlete List */}
                  <div className="lg:col-span-2">
                    <Card className="shadow-sm h-full">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Daftar Atlet</CardTitle>
                        <p className="text-sm text-gray-600">
                          {!selectedRedCorner && !selectedBlueCorner 
                            ? "Klik atlet untuk mengisi sudut merah terlebih dahulu" 
                            : !selectedBlueCorner
                            ? "Klik atlet untuk mengisi sudut biru"
                            : "Klik atlet untuk menambah ke antrian"}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {/* Athletes List */}
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                          {filteredAthletes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Tidak ada atlet yang sesuai dengan kriteria pencarian</p>
                            </div>
                          ) : (
                            <div className="space-y-2 p-3">
                            {filteredAthletes.map(athlete => (
                              <div 
                                key={athlete.id} 
                                className={cn(
                                  "border rounded-lg p-3 transition-all duration-200 cursor-pointer",
                                  "hover:bg-gray-50 hover:shadow-md hover:border-gray-400",
                                  !selectedRedCorner && "hover:bg-red-50 hover:border-red-300",
                                  selectedRedCorner && !selectedBlueCorner && "hover:bg-blue-50 hover:border-blue-300",
                                  selectedRedCorner && selectedBlueCorner && "hover:bg-gray-100 hover:border-gray-400"
                                )}
                                onClick={() => handleAthleteCardClick(athlete)}
                              >
                                <div className="space-y-2">
                                  <div>
                                    <p className="font-medium text-sm">{athlete.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {athlete.dojang} • {athlete.belt} • {athlete.gender} • {athlete.weight}kg
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Umur: {athlete.age} • Tinggi: {athlete.height}cm
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Klik untuk {!selectedRedCorner ? 'sudut merah' : !selectedBlueCorner ? 'sudut biru' : 'antrian'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateGroupStep('info')}
                >
                  Kembali
                </Button>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetCreateAthleteGroupDialog();
                      setShowCreateAthleteGroup(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!groupFormData) return;
                      
                      const athleteGroupData = {
                        subCategoryId: selectedSubCategory!.id,
                        name: groupFormData.name,
                        description: groupFormData.description,
                        matchNumber: parseInt(groupFormData.matchNumber),
                        isActive: true
                      };

                      createAthleteGroupMutation.mutate({
                        groupData: athleteGroupData,
                        redCornerAthleteId: selectedRedCorner?.id || null,
                        blueCornerAthleteId: selectedBlueCorner?.id || null,
                        queueAthleteIds: selectedQueue.map(a => a.id)
                      });
                    }}
                    disabled={createAthleteGroupMutation.isPending || (!selectedRedCorner && !selectedBlueCorner)}
                  >
                    {createAthleteGroupMutation.isPending ? 'Membuat...' : 'Buat Kelompok'}
                  </Button>
                </div>
              </div>
            </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
              <div 
                className="fixed bg-white border shadow-lg rounded-lg py-2 z-50"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onMouseLeave={() => setContextMenu(null)}
              >
                <div className="px-3 py-1 text-xs text-gray-500 border-b mb-1">
                  {contextMenu.athlete.name}
                </div>
                {/* Switch red and blue corners */}
                {(contextMenu.currentPosition === 'red' || contextMenu.currentPosition === 'blue') && selectedRedCorner && selectedBlueCorner && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 text-purple-600"
                    onClick={switchRedBlueCorners}
                  >
                    Tukar Sudut Merah & Biru
                  </button>
                )}
                {contextMenu.currentPosition !== 'red' && !selectedRedCorner && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                    onClick={() => switchAthletePosition(contextMenu.athlete, 'red')}
                  >
                    Pindah ke Sudut Merah
                  </button>
                )}
                {contextMenu.currentPosition !== 'blue' && !selectedBlueCorner && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-600"
                    onClick={() => switchAthletePosition(contextMenu.athlete, 'blue')}
                  >
                    Pindah ke Sudut Biru
                  </button>
                )}
                {contextMenu.currentPosition !== 'queue' && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-600"
                    onClick={() => switchAthletePosition(contextMenu.athlete, 'queue')}
                  >
                    Pindah ke Antrian
                  </button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Overlay to close context menu */}
        {contextMenu && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
        )}
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

  // Get unique values for filter options (removing duplicate declaration)
  const uniqueBeltsFromAll = [...new Set(allAthletes.map(a => a.belt))].filter(belt => belt && belt.trim());
  const uniqueGendersFromAll = [...new Set(allAthletes.map(a => a.gender))].filter(gender => gender && gender.trim());
  const uniqueDojangsFromAll = [...new Set(allAthletes.map(a => a.dojang))].filter(dojang => dojang && dojang.trim());

  const handleAthleteSelect = (athleteId: number) => {
    if (!selectedCorner || !selectedAthleteGroup) return;
    
    const position = selectedCorner;
    addAthleteMutation.mutate({
      athleteGroupId: selectedAthleteGroup.id,
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

          {/* Edit Athlete Group Dialog */}
          <Dialog open={showEditAthleteGroup} onOpenChange={setShowEditAthleteGroup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Kelompok Atlet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditAthleteGroup} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nama Kelompok</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    placeholder="Contoh: Grup A" 
                    defaultValue={editingGroup?.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    placeholder="Deskripsi kelompok (opsional)"
                    defaultValue={editingGroup?.description || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-matchNumber">Nomor Partai</Label>
                  <Input 
                    id="edit-matchNumber" 
                    name="matchNumber" 
                    type="number" 
                    placeholder="1" 
                    min="1" 
                    defaultValue={editingGroup?.matchNumber}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full">
                  Perbarui Kelompok
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAthleteGroup(group);
                            setEditingGroup(group);
                            setShowEditAthleteGroup(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Kelompok
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (window.confirm(`Apakah Anda yakin ingin menghapus kelompok "${group.name}"?`)) {
                              deleteAthleteGroupMutation.mutate(group.id);
                            }
                          }}
                          disabled={deleteAthleteGroupMutation.isPending}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Kelompok
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Match Interface for this specific group */}
                  <div className="space-y-6">
                    {/* Red and Blue Corners on top */}
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
                    
                    {/* Queue Section - Below the red and blue corners */}
                    {groupAthletes.filter(ga => ga.groupId === group.id && ga.position === 'queue' && !ga.isEliminated).length > 0 && (
                      <Card className="border-2 border-gray-200 bg-gray-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-700">
                            <Users className="h-5 w-5" />
                            Antrian ({groupAthletes.filter(ga => ga.groupId === group.id && ga.position === 'queue' && !ga.isEliminated).length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupAthletes
                              .filter(ga => ga.groupId === group.id && ga.position === 'queue' && !ga.isEliminated)
                              .sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0))
                              .map((queueAthlete) => {
                                const athlete = allAthletes.find(a => a.id === queueAthlete.athleteId);
                                return (
                                  <Card key={queueAthlete.id} className="p-4 bg-white border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-semibold">{athlete?.name}</h4>
                                        <p className="text-sm text-gray-600">
                                          {athlete?.dojang} • {athlete?.belt} • {athlete?.weight}kg
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">#{queueAthlete.queueOrder}</Badge>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeAthleteMutation.mutate({ 
                                              groupId: group.id, 
                                              athleteId: queueAthlete.athleteId 
                                            });
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
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