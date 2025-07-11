import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import type { Category, InsertCategory } from "@shared/schema";

export default function Categories() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("8");
  const [minParticipants, setMinParticipants] = useState("4");
  const [autoAssignByAttendance, setAutoAssignByAttendance] = useState(true);
  const [randomizeGroups, setRandomizeGroups] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useRealtime();

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: api.getCategories
  });

  const createCategoryMutation = useMutation({
    mutationFn: (category: InsertCategory) => api.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowAddForm(false);
      toast({
        title: "Category Created",
        description: "New category has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  });

  const handleCreateCategory = (formData: FormData) => {
    const category: InsertCategory = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'kyorugi' | 'poomsae',
      gender: formData.get('gender') as string,
      weightMin: parseInt(formData.get('weightMin') as string) || undefined,
      weightMax: parseInt(formData.get('weightMax') as string) || undefined,
      beltLevel: formData.get('beltLevel') as string,
      maxParticipants: parseInt(maxParticipants),
      minParticipants: parseInt(minParticipants),
      isActive: true
    };

    createCategoryMutation.mutate(category);
  };

  const handleRefresh = () => {
    refetch();
  };

  const kyorugiCategories = categories?.filter(c => c.type === 'kyorugi') || [];
  const poomsaeCategories = categories?.filter(c => c.type === 'poomsae') || [];

  const getCategoryTypeIcon = (type: string) => {
    return type === 'kyorugi' ? 'fas fa-fist-raised' : 'fas fa-user-ninja';
  };

  const getCategoryTypeColor = (type: string) => {
    return type === 'kyorugi' ? 'text-tkd-red' : 'text-tkd-blue';
  };

  return (
    <>
      <Header 
        title="Kategori Pertandingan" 
        subtitle="Kelola kategori dan pembagian kelompok"
        onRefresh={handleRefresh}
      />
      
      <LoadingOverlay isVisible={isLoading || createCategoryMutation.isPending} />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-tkd-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                    Kategori Pertandingan
                  </CardTitle>
                  <Button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-tkd-blue hover:bg-blue-700"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Tambah Kategori
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Add Category Form */}
                {showAddForm && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleCreateCategory(formData);
                    }}
                    className="mb-6 p-4 border border-tkd-gray-200 rounded-lg bg-tkd-gray-50"
                  >
                    <h4 className="font-medium text-tkd-gray-900 mb-4">Tambah Kategori Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Nama Kategori
                        </label>
                        <Input name="name" required placeholder="e.g., Kyorugi Pria 50-55kg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Tipe
                        </label>
                        <Select name="type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kyorugi">Kyorugi</SelectItem>
                            <SelectItem value="poomsae">Poomsae</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Gender
                        </label>
                        <Select name="gender">
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                            <SelectItem value="Campuran">Campuran</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Tingkat Sabuk
                        </label>
                        <Input name="beltLevel" placeholder="e.g., Kuning, Hijau" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Berat Minimum (kg)
                        </label>
                        <Input name="weightMin" type="number" placeholder="45" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-tkd-gray-700 mb-1">
                          Berat Maximum (kg)
                        </label>
                        <Input name="weightMax" type="number" placeholder="50" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit" className="bg-tkd-blue hover:bg-blue-700">
                        Simpan Kategori
                      </Button>
                    </div>
                  </form>
                )}

                {/* Kyorugi Category */}
                {kyorugiCategories.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg mb-4">
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-fist-raised text-tkd-red text-xl"></i>
                        <div>
                          <h4 className="font-semibold text-tkd-gray-900">Kyorugi (Fighting)</h4>
                          <p className="text-sm text-tkd-gray-500">Pertandingan 1 vs 1</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-tkd-red text-white">
                          {kyorugiCategories.length} Sub-kategori
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="ml-8 space-y-3">
                      {kyorugiCategories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border border-tkd-gray-200 rounded-lg">
                          <div>
                            <h5 className="font-medium text-tkd-gray-900">{category.name}</h5>
                            <p className="text-sm text-tkd-gray-500">
                              {category.gender} | {category.weightMin}-{category.weightMax}kg | {category.beltLevel}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {category.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-tkd-blue hover:text-blue-700">
                              <i className="fas fa-users"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Poomsae Category */}
                {poomsaeCategories.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-user-ninja text-tkd-blue text-xl"></i>
                        <div>
                          <h4 className="font-semibold text-tkd-gray-900">Poomsae (Forms)</h4>
                          <p className="text-sm text-tkd-gray-500">Pertunjukan jurus</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-tkd-blue text-white">
                          {poomsaeCategories.length} Sub-kategori
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="ml-8 space-y-3">
                      {poomsaeCategories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border border-tkd-gray-200 rounded-lg">
                          <div>
                            <h5 className="font-medium text-tkd-gray-900">{category.name}</h5>
                            <p className="text-sm text-tkd-gray-500">
                              {category.gender} | {category.beltLevel}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {category.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-tkd-blue hover:text-blue-700">
                              <i className="fas fa-users"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categories?.length === 0 && (
                  <div className="text-center py-12">
                    <i className="fas fa-layer-group text-4xl text-tkd-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-tkd-gray-900 mb-2">Belum ada kategori</h3>
                    <p className="text-tkd-gray-500 mb-4">Tambah kategori pertandingan untuk memulai</p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-tkd-blue hover:bg-blue-700"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Tambah Kategori Pertama
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Auto Grouping Settings */}
          <div>
            <Card>
              <CardHeader className="border-b border-tkd-gray-200">
                <CardTitle className="text-lg font-semibold text-tkd-gray-900">
                  Pengaturan Kelompok
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-tkd-gray-700 mb-2">
                    Maksimal atlet per kelompok
                  </label>
                  <Input 
                    type="number" 
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-tkd-gray-700 mb-2">
                    Minimal atlet per kelompok
                  </label>
                  <Input 
                    type="number" 
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={autoAssignByAttendance}
                      onCheckedChange={setAutoAssignByAttendance}
                    />
                    <label className="text-sm text-tkd-gray-700">
                      Pembagian otomatis berdasarkan kehadiran
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={randomizeGroups}
                      onCheckedChange={setRandomizeGroups}
                    />
                    <label className="text-sm text-tkd-gray-700">
                      Acak susunan kelompok
                    </label>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-tkd-blue hover:bg-blue-700"
                  onClick={() => {
                    toast({
                      title: "Generate Groups",
                      description: "Auto group generation will be implemented",
                    });
                  }}
                >
                  <i className="fas fa-magic mr-2"></i>
                  Generate Kelompok Otomatis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
