import SimpleSidebar from '../components/SimpleSidebar';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerItem, updateItem, analyzeImage, saveItemPhoto } from '../services/items';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const ITEM_TYPES = {
  animal: {
    label: 'Animal',
    icon: 'pets',
    description: 'Cães, gatos, etc.',
    color: 'primary'
  },
  document: {
    label: 'Documento',
    icon: 'badge',
    description: 'RG, CNH, Passaporte, etc.',
    color: 'primary'
  },
  object: {
    label: 'Objeto',
    icon: 'backpack',
    description: 'Mochila, chaves, livros, etc.',
    color: 'primary'
  },
  electronics: {
    label: 'Eletrônico',
    icon: 'devices',
    description: 'Celular, notebook, fones, etc.',
    color: 'primary'
  },
  jewelry: {
    label: 'Joia/Acessório',
    icon: 'diamond',
    description: 'Anel, colar, relógio, etc.',
    color: 'secondary'
  },
  clothing: {
    label: 'Roupa',
    icon: 'apparel',
    description: 'Casaco, chapéu, cachecol, etc.',
    color: 'secondary'
  },
};

export default function RegisterItem() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editingItem = location.state?.item || null;

  // Form state
  const [itemType, setItemType] = useState(editingItem?.item_type || null);
  const [title, setTitle] = useState(editingItem?.title || '');
  const [brand, setBrand] = useState(editingItem?.extra_fields?.brand || '');
  const [color, setColor] = useState(editingItem?.extra_fields?.color || '');
  const [serialNumber, setSerialNumber] = useState(editingItem?.extra_fields?.serial_number || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [itemLocation, setItemLocation] = useState(editingItem?.location || '');
  const [date, setDate] = useState(editingItem?.date ? editingItem.date.split('T')[0] : '');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState(editingItem?.status || 'lost');
  const [category, setCategory] = useState(editingItem?.category || '');

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col">
        <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
        <div className={`p-10 flex items-center justify-center transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
          Faça login para registrar itens
        </div>
      </div>
    );
  }

  const handleTypeSelect = (type) => {
    setItemType(type);
    setCurrentStep(1);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, { file, preview: event.target?.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemType) {
      setError('Selecione um tipo de item');
      return;
    }
    if (!title) {
      setError('Preencha o nome do item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('recover_token');
      const itemData = {
        title,
        description,
        location: itemLocation,
        status,
        category,
        item_type: itemType,
        extra_fields: {
          brand,
          color,
          serial_number: serialNumber,
        },
      };

      if (date) {
        itemData.date = `${date}T${time || '00:00'}:00Z`;
      }

      let createdItemData;
      if (editingItem) {
        await updateItem(editingItem.id, itemData, token);
        setSuccess(true);
        setTimeout(() => navigate('/home'), 2000);
      } else {
        createdItemData = await registerItem(itemData, token);
        setCreatedItem(createdItemData);
        console.log('[RegisterItem] Item criado:', createdItemData);

        // Upload photos to Supabase Storage
        for (const photo of photos) {
          try {
            const fileExt = photo.file.name.split('.').pop();
            const fileName = `${createdItemData.id}/${Date.now()}.${fileExt}`;
            
            console.log('[RegisterItem] Fazendo upload:', fileName);
            
            // Upload para o Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('item-photos')
              .upload(fileName, photo.file);

            if (uploadError) {
              console.error('[RegisterItem] Erro ao fazer upload:', uploadError);
              continue;
            }

            console.log('[RegisterItem] Upload bem-sucedido:', uploadData);

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('item-photos')
              .getPublicUrl(fileName);

            console.log('[RegisterItem] URL pública:', publicUrl);

            // Salvar referência no banco
            const savedPhoto = await saveItemPhoto(createdItemData.id, publicUrl, token);
            console.log('[RegisterItem] Foto salva no banco:', savedPhoto);
          } catch (err) {
            console.error('[RegisterItem] Erro ao processar foto:', err);
          }
        }

        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Erro ao registrar item');
    } finally {
      setLoading(false);
    }
  };

  // Se não selecionou tipo ainda
  if (!itemType) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col">
        <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
        <main className={`flex flex-1 flex-col items-center justify-center gap-10 px-4 py-10 sm:px-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
          <div className="text-center">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl">Seleção de Tipo de Item</h1>
            <p className="text-[#9da6b9] text-lg font-normal leading-normal mt-3 max-w-2xl">Para começar, escolha a categoria que melhor descreve o item que você deseja reportar.</p>
          </div>
          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ITEM_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => handleTypeSelect(key)}
                className={`group flex flex-col items-center justify-center gap-4 rounded-xl border border-solid border-white/10 bg-[#1a1d23] p-8 text-center transition-all duration-300 hover:-translate-y-1 ${
                  type.color === 'secondary' 
                    ? 'hover:border-secondary hover:shadow-2xl hover:shadow-secondary/20' 
                    : 'hover:border-primary hover:shadow-2xl hover:shadow-primary/20'
                }`}
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  type.color === 'secondary' 
                    ? 'bg-secondary/10 text-secondary group-hover:bg-secondary' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary'
                } transition-colors group-hover:text-white`}>
                  <span className="material-symbols-outlined text-4xl">{type.icon}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white">{type.label}</h3>
                  <p className="text-sm text-[#9da6b9]">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col">
        <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
        <div className={`p-10 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-dark rounded-xl p-8 border border-white/10 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {editingItem ? 'Item Atualizado com Sucesso!' : 'Item Registrado com Sucesso!'}
              </h2>
              <p className="text-text-secondary-dark mb-8">
                {editingItem ? 'Suas alterações foram salvas.' : 'Compartilhe agora e maximize suas chances de encontrar!'}
              </p>

              {createdItem && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-8">
                  <div className="text-sm text-text-secondary-dark mb-1">Seu Item:</div>
                  <div className="text-2xl font-bold text-white">{createdItem.title}</div>
                </div>
              )}

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => navigate('/home')}
                  className="px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition"
                >
                  🏠 Ir para Home
                </button>
                {createdItem && !editingItem && (
                  <button
                    onClick={() => {
                      setItemType(null);
                      setTitle('');
                      setDescription('');
                      setItemLocation('');
                      setDate('');
                      setTime('');
                      setStatus('lost');
                      setCategory('');
                      setBrand('');
                      setColor('');
                      setSerialNumber('');
                      setPhotos([]);
                      setSuccess(false);
                    }}
                    className="px-8 py-3 rounded-lg bg-surface-dark border border-white/10 hover:bg-white/10 text-white font-semibold transition"
                  >
                    ➕ Registrar Outro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
      <div className={`p-10 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Publicar Novo Item</h1>
            <p className="text-text-secondary-dark">Siga os passos para cadastrar seu item. Quanto mais detalhes, maior a chance de recuperá-lo.</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex gap-4 justify-between items-center mb-3">
              <p className="text-white text-base font-medium">Passo {currentStep} de 3: {currentStep === 1 ? 'Detalhes do Item' : currentStep === 2 ? 'Fotos' : 'Localização e Status'}</p>
            </div>
            <div className="rounded-full bg-white/10 h-2">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="bg-surface-dark rounded-xl p-8 border border-white/10 space-y-6">
                <h2 className="text-2xl font-bold text-white">Detalhes do Item</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nome do Item</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Macbook Pro 14"
                    className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Marca</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="Ex: Apple"
                      className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Cor</label>
                    <input
                      type="text"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      placeholder="Ex: Cinza Espacial"
                      className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Número de Série (opcional)</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="Se aplicável"
                    className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Descrição</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreva detalhes importantes como adesivos, arranhões, etc."
                    rows="4"
                    className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3 resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setItemType(null)}
                    className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 text-white font-semibold transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Photos */}
            {currentStep === 2 && (
              <div className="bg-surface-dark rounded-xl p-8 border border-white/10 space-y-6">
                <h2 className="text-2xl font-bold text-white">Fotos do Item</h2>

                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                  <span className="material-symbols-outlined text-4xl text-text-secondary-dark">upload_file</span>
                  <p className="text-white mt-2">Arraste e solte as fotos aqui ou <span className="font-bold text-primary">clique para selecionar</span></p>
                  <p className="text-sm text-text-secondary-dark mt-1">PNG, JPG, GIF até 10MB</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Foto ${index + 1}`}
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                  <p className="text-text-secondary-dark text-sm">Nossa IA pode preencher os detalhes para você a partir das fotos.</p>
                </div>

                <div className="flex gap-3 justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 text-white font-semibold transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location and Status */}
            {currentStep === 3 && (
              <div className="bg-surface-dark rounded-xl p-8 border border-white/10 space-y-6">
                <h2 className="text-2xl font-bold text-white">Localização e Status</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Endereço ou Ponto de Referência</label>
                  <input
                    type="text"
                    value={itemLocation}
                    onChange={e => setItemLocation(e.target.value)}
                    placeholder="Onde o item foi perdido/achado?"
                    className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Horário Aproximado</label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status do Item</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-surface-dark/60 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary px-4 py-3"
                  >
                    <option value="lost">Perdido</option>
                    <option value="found">Achado</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 text-white font-semibold transition"
                  >
                    Voltar
                  </button>
                  <div className="flex-1 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        // Save draft
                      }}
                      className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 text-text-secondary-dark font-semibold transition"
                    >
                      Salvar Rascunho
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold transition"
                    >
                      {loading ? 'Publicando...' : 'Publicar Item'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

