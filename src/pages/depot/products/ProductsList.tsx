import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  supplier: string;
  lastDelivery: string;
  dateAdded: string;
  addedBy: string;
  status: 'normal' | 'low' | 'critical';
  price: number;
  location: string;
}

interface HistoryEntry {
  id: number;
  productId: number;
  productName: string;
  action: 'added' | 'restocked' | 'updated' | 'deleted';
  previousQuantity?: number;
  newQuantity?: number;
  changeAmount?: number;
  user: string;
  timestamp: string;
  details: string;
}

const ProductsList: React.FC = () => {
  // États principaux
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Cahier 96 pages',
      category: 'Fournitures',
      quantity: 45,
      minStock: 20,
      supplier: 'Papeterie Plus',
      lastDelivery: '2025-01-02',
      dateAdded: '2025-01-02',
      addedBy: 'Modou Ndiaye',
      status: 'normal',
      price: 1200,
      location: 'Zone A'
    },
    {
      id: 2,
      name: 'Stylo bleu',
      category: 'Fournitures',
      quantity: 12,
      minStock: 25,
      supplier: 'Stylo Import',
      lastDelivery: '2025-01-01',
      dateAdded: '2025-01-01',
      addedBy: 'Modou Ndiaye',
      status: 'low',
      price: 500,
      location: 'Zone B'
    },
    {
      id: 3,
      name: 'Classeur A4',
      category: 'Classement',
      quantity: 5,
      minStock: 15,
      supplier: 'Bureau Pro',
      lastDelivery: '2024-12-28',
      dateAdded: '2024-12-28',
      addedBy: 'Modou Ndiaye',
      status: 'critical',
      price: 2500,
      location: 'Zone A'
    },
    {
      id: 4,
      name: 'Ramette papier A4',
      category: 'Papeterie',
      quantity: 80,
      minStock: 30,
      supplier: 'Papeterie Plus',
      lastDelivery: '2025-01-02',
      dateAdded: '2025-01-02',
      addedBy: 'Modou Ndiaye',
      status: 'normal',
      price: 4500,
      location: 'Zone C'
    },
    {
      id: 5,
      name: 'Crayon HB',
      category: 'Fournitures',
      quantity: 8,
      minStock: 20,
      supplier: 'Stylo Import',
      lastDelivery: '2024-12-30',
      dateAdded: '2024-12-30',
      addedBy: 'Modou Ndiaye',
      status: 'critical',
      price: 300,
      location: 'Zone B'
    }
  ]);

  // États pour toutes les fonctionnalités
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [newProduct, setNewProduct] = useState({
    name: '', category: '', quantity: 0, minStock: 10, supplier: '', price: 0, location: 'Zone A', lastDelivery: ''
  });
  const [restockProduct, setRestockProduct] = useState<{id: number, name: string, currentQuantity: number} | null>(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Historique des modifications
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 1,
      productId: 1,
      productName: 'Cahier 96 pages',
      action: 'added',
      user: 'Modou Ndiaye',
      timestamp: '2025-01-02 14:30:25',
      details: 'Nouveau produit ajouté au système - Livraison: 2025-01-02'
    },
    {
      id: 2,
      productId: 2,
      productName: 'Stylo bleu',
      action: 'restocked',
      previousQuantity: 5,
      newQuantity: 17,
      changeAmount: 12,
      user: 'Modou Ndiaye',
      timestamp: '2025-01-03 09:15:10',
      details: 'Réapprovisionnement de 12 unités - Livraison: 2025-01-02'
    },
    {
      id: 3,
      productId: 3,
      productName: 'Classeur A4',
      action: 'added',
      user: 'Modou Ndiaye',
      timestamp: '2024-12-28 16:45:30',
      details: 'Nouveau produit ajouté au système - Livraison: 2024-12-27'
    }
  ]);

  // Données statiques
  const categories = ['Fournitures', 'Papeterie', 'Classement', 'Écriture', 'Scolaire'];
  const suppliers = ['Papeterie Plus', 'Stylo Import', 'Bureau Pro', 'Fournitures Express'];
  const locations = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

  // 🔍 1. FONCTIONNALITÉS DE RECHERCHE ET FILTRES
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'all' || product.supplier === selectedSupplier;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortField as keyof Product];
    const bValue = b[sortField as keyof Product];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 📊 2. ANALYTIQUES ET STATISTIQUES
  const stockValue = products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
  const lowStockCount = products.filter(p => p.status === 'low').length;
  const criticalStockCount = products.filter(p => p.status === 'critical').length;
  const needReorderCount = products.filter(p => p.quantity <= p.minStock).length;

  const categoryStats = categories.map(category => ({
    name: category,
    count: products.filter(p => p.category === category).length,
    value: products.filter(p => p.category === category)
                 .reduce((sum, p) => sum + (p.quantity * p.price), 0)
  }));

  // 📦 3. GESTION MULTI-ENTREPÔTS
  const locationStats = locations.map(location => ({
    name: location,
    count: products.filter(p => p.location === location).length,
    quantity: products.filter(p => p.location === location)
                     .reduce((sum, p) => sum + p.quantity, 0)
  }));

  // 📈 4. PRÉVISIONS ET OPTIMISATION
  const forecastData = products.map(product => ({
    name: product.name,
    current: product.quantity,
    recommended: Math.max(product.minStock * 2, product.quantity * 1.5),
    trend: product.quantity > product.minStock ? 'stable' : 'declining'
  }));

  // 📄 5. EXPORT PDF
  const exportToPDF = () => {
    addNotification('🔄 Génération du rapport PDF...');
    // Simulation de génération PDF
    setTimeout(() => {
      addNotification('✅ Rapport PDF généré avec succès !');
    }, 2000);
  };

  // 🔔 6. NOTIFICATIONS INTELLIGENTES
  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(msg => msg !== message));
    }, 5000);
  };

  // Fonction pour ajouter à l'historique
  const addToHistory = (entry: Omit<HistoryEntry, 'id'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: history.length + 1
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  useEffect(() => {
    // Alertes automatiques
    products.forEach(product => {
      if (product.status === 'critical') {
        addNotification(`🔴 Stock critique: ${product.name} (reste ${product.quantity})`);
      } else if (product.status === 'low') {
        addNotification(`🟡 Stock faible: ${product.name} (reste ${product.quantity})`);
      }
    });
  }, [products]);

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critique';
      case 'low': return 'Faible';
      default: return 'Normal';
    }
  };

  const calculateStatus = (quantity: number, minStock: number) => {
    return quantity <= 5 ? 'critical' : quantity <= 15 ? 'low' : 'normal';
  };

  // FONCTIONS PRINCIPALES - CORRIGÉES
  const handleAddProduct = () => {
    const product: Product = {
      id: products.length + 1,
      name: newProduct.name,
      category: newProduct.category,
      quantity: newProduct.quantity,
      minStock: newProduct.minStock,
      supplier: newProduct.supplier,
      lastDelivery: newProduct.lastDelivery || new Date().toISOString().split('T')[0],
      dateAdded: new Date().toISOString().split('T')[0],
      addedBy: 'Modou Ndiaye',
      status: calculateStatus(newProduct.quantity, newProduct.minStock),
      price: newProduct.price,
      location: newProduct.location
    };

    // CORRECTION : forme fonctionnelle
    setProducts(prevProducts => [...prevProducts, product]);
    
    // Ajouter à l'historique
    addToHistory({
      productId: product.id,
      productName: product.name,
      action: 'added',
      user: 'Modou Ndiaye',
      timestamp: new Date().toISOString(),
      details: `Nouveau produit ajouté - Quantité: ${product.quantity} - Livraison: ${product.lastDelivery}`
    });

    setShowAddModal(false);
    setNewProduct({ 
      name: '', category: '', quantity: 0, minStock: 10, supplier: '', 
      price: 0, location: 'Zone A', lastDelivery: '' 
    });
    addNotification(`Produit "${newProduct.name}" ajouté avec succès`);
  };

  const handleRestock = (product: Product) => {
    setRestockProduct({ id: product.id, name: product.name, currentQuantity: product.quantity });
    setShowRestockModal(true);
  };

  const confirmRestock = () => {
    if (restockProduct && restockAmount > 0) {
      // CORRECTION : forme fonctionnelle
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === restockProduct.id 
            ? {
                ...product,
                quantity: product.quantity + restockAmount,
                lastDelivery: deliveryDate || new Date().toISOString().split('T')[0],
                status: calculateStatus(product.quantity + restockAmount, product.minStock)
              }
            : product
        )
      );
      
      // Ajouter à l'historique
      addToHistory({
        productId: restockProduct.id,
        productName: restockProduct.name,
        action: 'restocked',
        previousQuantity: restockProduct.currentQuantity,
        newQuantity: restockProduct.currentQuantity + restockAmount,
        changeAmount: restockAmount,
        user: 'Modou Ndiaye',
        timestamp: new Date().toISOString(),
        details: `Réapprovisionnement de ${restockAmount} unités - Livraison: ${deliveryDate || 'Aujourd\'hui'}`
      });
      
      setShowRestockModal(false);
      setRestockProduct(null);
      setRestockAmount(0);
      setDeliveryDate('');
      
      addNotification(`✅ ${restockAmount} ${restockProduct.name} réapprovisionnés`);
    }
  };

  const handleDeleteProduct = (id: number) => {
    const product = products.find(p => p.id === id);
    
    // CORRECTION : forme fonctionnelle
    setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
    
    // Ajouter à l'historique
    addToHistory({
      productId: id,
      productName: product?.name || 'Produit inconnu',
      action: 'deleted',
      user: 'Modou Ndiaye',
      timestamp: new Date().toISOString(),
      details: `Produit supprimé du système`
    });
    
    addNotification(`Produit "${product?.name}" supprimé`);
  };

  return (
    <div className="space-y-6 p-6 bg-[#F3FAF6] min-h-screen">
      {/* 🔔 NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div key={index} className="bg-white border-l-4 border-[#472EAD] shadow-lg rounded-r-lg p-4 min-w-80">
            <p className="text-sm text-[#111827]">{notification}</p>
          </div>
        ))}
      </div>

      {/* EN-TÊTE AVEC ONGLETS */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Gestion Avancée des Produits</h1>
            <p className="text-[#111827] mt-1 opacity-80">
              {products.length} produits • {needReorderCount} à réapprovisionner
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              className="bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:bg-[#5A3BC0] transition-colors font-medium"
            >
              📄 Exporter PDF
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#472EAD] text-white px-6 py-2 rounded-lg hover:bg-[#5A3BC0] transition-colors font-medium"
            >
              + Nouveau Produit
            </button>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'list', label: '📋 Liste des Produits' },
            { id: 'analytics', label: '📊 Analytics' },
            { id: 'forecast', label: '📈 Prévisions' },
            { id: 'history', label: '📝 Historique' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#472EAD] text-[#472EAD]'
                  : 'border-transparent text-[#111827] opacity-70 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔍 BARRE DE RECHERCHE ET FILTRES */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Recherche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
              placeholder="Nom, catégorie..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
            >
              <option value="all">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="normal">Normal</option>
              <option value="low">Faible</option>
              <option value="critical">Critique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Fournisseur</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
            >
              <option value="all">Tous</option>
              {suppliers.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Trier par</label>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field);
                setSortDirection(direction);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
            >
              <option value="name-asc">Nom (A-Z)</option>
              <option value="name-desc">Nom (Z-A)</option>
              <option value="quantity-asc">Quantité (Croissant)</option>
              <option value="quantity-desc">Quantité (Décroissant)</option>
              <option value="price-asc">Prix (Croissant)</option>
              <option value="price-desc">Prix (Décroissant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CARTES DE RÉSUMÉ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111827] opacity-80">Valeur Stock</p>
              <p className="text-2xl font-bold text-[#111827]">
                {new Intl.NumberFormat('fr-FR').format(stockValue)} F
              </p>
            </div>
            <div className="text-2xl text-[#472EAD]">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111827] opacity-80">Stock Faible</p>
              <p className="text-2xl font-bold text-[#111827]">{lowStockCount}</p>
            </div>
            <div className="text-2xl text-[#F58020]">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111827] opacity-80">Stock Critique</p>
              <p className="text-2xl font-bold text-[#111827]">{criticalStockCount}</p>
            </div>
            <div className="text-2xl text-red-600">🔴</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#111827] opacity-80">À Réapprovisionner</p>
              <p className="text-2xl font-bold text-[#111827]">{needReorderCount}</p>
            </div>
            <div className="text-2xl text-blue-600">📦</div>
          </div>
        </div>
      </div>

      {/* CONTENU DES ONGLETS */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#111827]">
              Liste des Produits ({sortedProducts.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { field: 'name', label: 'Produit' },
                    { field: 'category', label: 'Catégorie' },
                    { field: 'quantity', label: 'Quantité' },
                    { field: 'minStock', label: 'Stock Min.' },
                    { field: 'price', label: 'Prix' },
                    { field: 'supplier', label: 'Fournisseur' },
                    { field: 'location', label: 'Emplacement' },
                    { field: 'lastDelivery', label: 'Dernière Liv.' },
                    { field: 'status', label: 'Statut' }
                  ].map(column => (
                    <th 
                      key={column.field}
                      className="text-left py-4 px-6 text-sm font-medium text-[#111827] cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort(column.field)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {sortField === column.field && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#111827]">{product.name}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{product.category}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          product.quantity <= product.minStock ? 'text-red-600' : 'text-[#111827]'
                        }`}>
                          {product.quantity}
                        </span>
                        {product.quantity <= product.minStock && (
                          <span className="text-red-500 text-xs">⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{product.minStock}</td>
                    <td className="py-4 px-6 text-sm text-[#111827]">
                      {new Intl.NumberFormat('fr-FR').format(product.price)} F
                    </td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{product.supplier}</td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{product.location}</td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{product.lastDelivery}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRestock(product)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Réapprovisionner
                        </button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* STATISTIQUES PAR CATÉGORIE */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">📊 Répartition par Catégorie</h3>
            <div className="space-y-3">
              {categoryStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center">
                  <span className="text-sm text-[#111827]">{stat.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#111827] opacity-70">{stat.count} produits</span>
                    <span className="text-sm font-medium text-[#472EAD]">
                      {new Intl.NumberFormat('fr-FR').format(stat.value)} F
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STATISTIQUES PAR EMPLACEMENT */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">🏢 Stock par Emplacement</h3>
            <div className="space-y-3">
              {locationStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center">
                  <span className="text-sm text-[#111827]">{stat.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#111827] opacity-70">{stat.count} produits</span>
                    <span className="text-sm font-medium text-[#472EAD]">{stat.quantity} unités</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">📈 Prévisions de Réapprovisionnement</h3>
          <div className="space-y-4">
            {forecastData.map(item => (
              <div key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-[#111827]">{item.name}</p>
                  <p className="text-sm text-[#111827] opacity-70">
                    Stock actuel: {item.current} | Recommandé: {item.recommended}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.trend === 'stable' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {item.trend === 'stable' ? 'Stable' : 'À surveiller'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#111827]">
              Historique des Modifications ({history.length} entrées)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Action</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Produit</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Détails</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Utilisateur</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#111827]">Date/Heure</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.action === 'added' ? 'bg-green-100 text-green-800' :
                          entry.action === 'restocked' ? 'bg-blue-100 text-blue-800' :
                          entry.action === 'updated' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {entry.action === 'added' && '🆕 Ajouté'}
                          {entry.action === 'restocked' && '📦 Réapprovisionné'}
                          {entry.action === 'updated' && '✏️ Modifié'}
                          {entry.action === 'deleted' && '🗑️ Supprimé'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#111827]">{entry.productName}</div>
                      {entry.changeAmount && (
                        <div className="text-sm text-[#111827] opacity-70">
                          {entry.previousQuantity} → {entry.newQuantity} (+{entry.changeAmount})
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{entry.details}</td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{entry.user}</td>
                    <td className="py-4 px-6 text-sm text-[#111827]">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL D'AJOUT DE PRODUIT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-[#111827] mb-4">Nouveau Produit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                  placeholder="Ex: Cahier 96 pages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Catégorie</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Quantité</label>
                <input
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Stock Minimum</label>
                <input
                  type="number"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Prix (FCFA)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Emplacement</label>
                <select
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#111827] mb-1">Fournisseur</label>
                <select
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(sup => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Date de livraison
                </label>
                <input
                  type="date"
                  value={newProduct.lastDelivery}
                  onChange={(e) => setNewProduct({...newProduct, lastDelivery: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-300 text-[#111827] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.category || !newProduct.supplier}
                className="flex-1 py-3 bg-[#472EAD] text-white rounded-lg hover:bg-[#5A3BC0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RÉAPPROVISIONNEMENT */}
      {showRestockModal && restockProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#111827] mb-4">
              Réapprovisionner {restockProduct.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#111827] opacity-70 mb-2">
                  Stock actuel: <span className="font-medium">{restockProduct.currentQuantity}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Quantité à ajouter
                </label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Date de livraison
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockProduct(null);
                  setRestockAmount(0);
                  setDeliveryDate('');
                }}
                className="flex-1 py-3 border border-gray-300 text-[#111827] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmRestock}
                disabled={restockAmount <= 0}
                className="flex-1 py-3 bg-[#472EAD] text-white rounded-lg hover:bg-[#5A3BC0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsList;