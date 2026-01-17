import React, { useState, useRef } from 'react';
import Ticket from "./Ticket";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart,
  faBarcode,
  faSearch,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faBox,
  faShoppingBag,
  faPallet,
  faPlus,
  faMinus,
  faEdit,
  faRedo,
  faTrash,
  faCheck,
  faTimes,
  faPaperPlane,
  faBan,
  faMoneyBillWave,
  faReceipt,
  faDatabase,
  faCartArrowDown,
  faCheckSquare,
  faPrint,
  faXmark,
  faSquare
} from '@fortawesome/free-solid-svg-icons';


const NouvelleCommande = ({ panier, setPanier, produits, onCommandeValidee, sellerName = null }) => {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [codeBarre, setCodeBarre] = useState('');
  const [client, setClient] = useState({ nom: '', telephone: '', adresse: '' });
  const [typeVenteGlobal, setTypeVenteGlobal] = useState('détail');
  const [editionPrix, setEditionPrix] = useState(null);
  const [editionQuantite, setEditionQuantite] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [tvaActive, setTvaActive] = useState(true);
  const inputCodeBarreRef = useRef(null);
  const inputNomClientRef = useRef(null);
  const [commandeValidee, setCommandeValidee] = useState(null);
  const ticketRef = useRef();


  const produitsFiltres = produits.filter(produit =>
    produit.nom.toLowerCase().includes(rechercheProduit.toLowerCase()) ||
    produit.reference.toLowerCase().includes(rechercheProduit.toLowerCase()) ||
    produit.code_barre.includes(rechercheProduit)
  );

  const obtenirPrixParType = (produit, typeVente) => {
    if (typeVente === 'gros') {
      return {
        prix: produit.prix_gros || produit.prix * 0.8,
        prix_seuil: produit.prix_seuil_gros || produit.prix_seuil * 0.8
      };
    }
    return {
      prix: produit.prix,
      prix_seuil: produit.prix_seuil
    };
  };

  const ajouterAuPanier = (produit, typeVenteSpecifique = null) => {
    const typeVente = typeVenteSpecifique || typeVenteGlobal;
    const { prix, prix_seuil } = obtenirPrixParType(produit, typeVente);

    const produitExistant = panier.find(item => 
      item.id === produit.id && item.type_vente === typeVente
    );
    
    if (produitExistant) {
      setPanier(panier.map(item =>
        item.id === produit.id && item.type_vente === typeVente
          ? { ...item, quantite: item.quantite + 1 }
          : item
      ));
    } else {
      setPanier([...panier, { 
        ...produit, 
        quantite: 1,
        type_vente: typeVente,
        prix_vente: prix,
        prix_base: prix,
        prix_seuil: prix_seuil,
        prix_original: prix
      }]);
    }
  };

  const ajouterParCodeBarre = () => {
    if (!codeBarre.trim()) {
      alert('❌ Veuillez saisir un code barre');
      return;
    }

    const produitTrouve = produits.find(p => p.code_barre === codeBarre);
    
    if (produitTrouve) {
      ajouterAuPanier(produitTrouve, typeVenteGlobal);
      setCodeBarre('');
      inputCodeBarreRef.current.focus();
    } else {
      alert('❌ Aucun produit trouvé avec ce code barre');
    }
  };

  const demarrerEditionQuantite = (produit) => {
    setEditionQuantite({
      produitId: produit.id,
      typeVente: produit.type_vente,
      nouvelleQuantite: produit.quantite
    });
  };

  const changerQuantiteEdition = (nouvelleQuantite) => {
    if (!editionQuantite) return;

    setEditionQuantite({
      ...editionQuantite,
      nouvelleQuantite: parseInt(nouvelleQuantite) || 0
    });
  };

  const validerModificationQuantite = () => {
    if (!editionQuantite) return;

    const { produitId, typeVente, nouvelleQuantite } = editionQuantite;

    if (nouvelleQuantite <= 0) {
      retirerDuPanier(produitId, typeVente);
    } else {
      setPanier(panier.map(item =>
        item.id === produitId && item.type_vente === typeVente
          ? { ...item, quantite: nouvelleQuantite }
          : item
      ));
    }

    setEditionQuantite(null);
  };

  const annulerEditionQuantite = () => {
    setEditionQuantite(null);
  };

  const modifierQuantite = (produitId, typeVente, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      retirerDuPanier(produitId, typeVente);
    } else {
      setPanier(panier.map(item =>
        item.id === produitId && item.type_vente === typeVente
          ? { ...item, quantite: nouvelleQuantite }
          : item
      ));
    }
  };

  const retirerDuPanier = (produitId, typeVente) => {
    setPanier(panier.filter(item => 
      !(item.id === produitId && item.type_vente === typeVente)
    ));
    if (editionPrix && editionPrix.produitId === produitId && editionPrix.typeVente === typeVente) {
      setEditionPrix(null);
    }
    if (editionQuantite && editionQuantite.produitId === produitId && editionQuantite.typeVente === typeVente) {
      setEditionQuantite(null);
    }
  };

  const demarrerEditionPrix = (produit) => {
    setEditionPrix({
      produitId: produit.id,
      typeVente: produit.type_vente,
      nouveauPrix: produit.prix_vente,
      prixBase: produit.prix_base,
      prixSeuil: produit.prix_seuil,
      prixOriginal: produit.prix_original
    });
  };

  const changerPrixEdition = (nouveauPrix) => {
    if (!editionPrix) return;

    setEditionPrix({
      ...editionPrix,
      nouveauPrix: parseFloat(nouveauPrix) || 0
    });
  };

  const validerModificationPrix = () => {
    if (!editionPrix) return;

    const { produitId, typeVente, nouveauPrix, prixSeuil } = editionPrix;

    if (nouveauPrix < prixSeuil) {
      alert(`❌ Prix trop bas ! Le prix ne peut pas être inférieur à ${prixSeuil.toLocaleString()} FCFA (prix de seuil)`);
      return;
    }

    if (nouveauPrix < 0) {
      alert('❌ Le prix ne peut pas être négatif !');
      return;
    }

    setPanier(panier.map(item =>
      item.id === produitId && item.type_vente === typeVente
        ? { ...item, prix_vente: nouveauPrix }
        : item
    ));

    setEditionPrix(null);
    
    alert(`✅ Prix modifié à ${nouveauPrix.toLocaleString()} FCFA`);
  };

  const annulerEditionPrix = () => {
    setEditionPrix(null);
  };

  const reinitialiserPrix = (produitId, typeVente) => {
    const produit = panier.find(item => 
      item.id === produitId && item.type_vente === typeVente
    );
    if (produit) {
      setPanier(panier.map(item =>
        item.id === produitId && item.type_vente === typeVente
          ? { ...item, prix_vente: produit.prix_original }
          : item
      ));
      alert(`🔄 Prix réinitialisé à ${produit.prix_original.toLocaleString()} FCFA`);
    }
  };

  const calculerTotaux = () => {
    const totalHT = panier.reduce((total, item) => total + (item.prix_vente * item.quantite), 0);
    
    let tva = 0;
    let totalTTC = totalHT;
    
    if (tvaActive) {
      tva = totalHT * 0.18;
      totalTTC = totalHT + tva;
    }

    return {
      totalHT: Math.round(totalHT),
      tva: Math.round(tva),
      totalTTC: Math.round(totalTTC),
      tvaActive: tvaActive
    };
  };

  const { totalHT, tva, totalTTC } = calculerTotaux();

  const validerCommande = async () => {
    if (panier.length === 0) {
      alert('❌ Le panier est vide !');
      return;
    }

    if (!client.nom.trim()) {
      alert('❌ Veuillez saisir le nom du client !');
      
      if (inputNomClientRef.current) {
        inputNomClientRef.current.focus();
        inputNomClientRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        inputNomClientRef.current.classList.add('border-red-500', 'ring-2', 'ring-red-200');
        
        setTimeout(() => {
          if (inputNomClientRef.current) {
            inputNomClientRef.current.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
          }
        }, 2000);
      }
      
      return;
    }

    if (editionPrix || editionQuantite) {
      alert('❌ Veuillez terminer les modifications en cours !');
      return;
    }

    setEnvoiEnCours(true);

    try {
      const typesVenteUniques = [...new Set(panier.map(item => item.type_vente))];

      const nouvelleCommande = {
        id: Date.now(),
        numero_commande: `CMD-${Date.now()}`,
        date: new Date().toISOString(),
        client: client,
        types_vente: typesVenteUniques,
        type_vente: typeVenteGlobal,
        produits: panier.map(item => ({
          produit_id: item.id,
          nom: item.nom,
          reference: item.reference,
          quantite: item.quantite,
          type_vente: item.type_vente,
          prix_unitaire: item.prix_vente,
          prix_base: item.prix_base,
          prix_seuil: item.prix_seuil,
          prix_original: item.prix_original,
          sous_total: item.prix_vente * item.quantite
        })),
        total_ht: totalHT,
        tva: tva,
        total_ttc: totalTTC,
        tva_appliquee: tvaActive,
        statut: 'en_attente_paiement',
        vendeur: sellerName || 'Vendeur Principal'
      };

      await onCommandeValidee(nouvelleCommande);
      setCommandeValidee(nouvelleCommande);


      setPanier([]);
      setClient({ nom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi de la commande');
    } finally {
      setEnvoiEnCours(false);
    }
  };
  const imprimerTicket = useReactToPrint({
  content: () => ticketRef.current,
});


  const annulerCommande = () => {
    if (panier.length === 0) {
      alert('ℹ️ Aucune commande en cours !');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir annuler la commande en cours ?')) {
      setPanier([]);
      setClient({ nom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
    }
  };

  const produitsParType = panier.reduce((acc, item) => {
    const type = item.type_vente;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <div className="p-5 min-h-screen bg-gray-50 box-border">
      <div className="mb-5">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
           
            <div className="flex flex-col gap-0">
             </div>
          </div>
          
          <div className="text-right text-sm text-gray-700">
            <div className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</div>
            <div className="text-xs text-gray-600">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <h2 className="text-2xl text-gray-800 mb-2 font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faShoppingCart} className="text-indigo-700 text-xl" />
          Nouvelle Commande
        </h2>
        <p className="text-gray-600 text-sm font-light">Créez une commande client - Gestion détail et gros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-180px)] box-border">
        {/* Section gauche : Produits */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm overflow-y-auto box-border">
          {/* Type de vente global */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingBag} className="text-[#472ead] text-sm" />
              Type de Vente Global
            </h3>
            <div className="flex gap-3 mb-3">
              <button
                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2 justify-center text-sm ${typeVenteGlobal === 'détail' ? 'border-[#472ead] bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white transform -translate-y-0.5 shadow-lg shadow-[#472ead]/30' : 'border-gray-200 bg-white hover:border-[#472ead] hover:bg-[#472ead]/5'}`}
                onClick={() => setTypeVenteGlobal('détail')}
              >
                <FontAwesomeIcon icon={faShoppingBag} className="text-sm" />
                Détail
              </button>
              <button
                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2 justify-center text-sm ${typeVenteGlobal === 'gros' ? 'border-[#f58020] bg-gradient-to-br from-[#f58020] to-[#ff9c4d] text-white transform -translate-y-0.5 shadow-lg shadow-[#f58020]/30' : 'border-gray-200 bg-white hover:border-[#f58020] hover:bg-[#f58020]/5'}`}
                onClick={() => setTypeVenteGlobal('gros')}
              >
                <FontAwesomeIcon icon={faPallet} className="text-sm" />
                Gros
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Type :</strong> {typeVenteGlobal === 'détail' ? 'Détail' : 'Gros'}
              </p>
              <small className="text-xs text-gray-500">
                {typeVenteGlobal === 'détail' 
                  ? 'Prix standard - Quantités unitaires' 
                  : 'Prix réduit - Quantités importantes'}
              </small>
            </div>
          </div>

          {/* Code barre */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faBarcode} className="text-[#472ead] text-sm" />
              Scanner Code Barre
            </h3>
            <div className="flex gap-3 items-center">
              <input
                ref={inputCodeBarreRef}
                type="text"
                placeholder={`Code barre (${typeVenteGlobal})...`}
                value={codeBarre}
                onChange={(e) => setCodeBarre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && ajouterParCodeBarre()}
                className="flex-1 py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
              />
              <button 
                onClick={ajouterParCodeBarre} 
                className="bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 border-none cursor-pointer text-sm hover:shadow-lg hover:-translate-y-0.5 shadow-md"
              >
                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                Scanner
              </button>
            </div>
          </div>

          {/* Recherche manuelle */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faSearch} className="text-[#472ead] text-sm" />
              Recherche Produits
            </h3>
            <input
              type="text"
              placeholder="Nom, référence ou code barre..."
              value={rechercheProduit}
              onChange={(e) => setRechercheProduit(e.target.value)}
              className="w-full py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
            />
          </div>

          {/* Liste des produits disponibles */}
          <div>
            <h3 className="text-base text-gray-800 mb-4 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faBox} className="text-[#472ead] text-sm" />
              Produits Disponibles ({produitsFiltres.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produitsFiltres.map(produit => {
                const prixDetail = obtenirPrixParType(produit, 'détail');
                const prixGros = obtenirPrixParType(produit, 'gros');
                
                return (
                  <div key={produit.id} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#472ead] flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">{produit.nom}</h4>
                      <p className="text-xs mb-1 text-gray-600 flex items-center gap-2">
                        <FontAwesomeIcon icon={faDatabase} className="text-xs" />
                        Ref: {produit.reference}
                      </p>
                      <p className="text-xs mb-3 text-gray-600 flex items-center gap-2">
                        <FontAwesomeIcon icon={faBarcode} className="text-xs" />
                        Code: {produit.code_barre}
                      </p>
                      
                      <div className="space-y-2 my-3">
                        <div className="bg-white p-2 rounded border border-gray-200 text-xs">
                          <div className="font-semibold text-gray-800 flex items-center gap-2 mb-1 text-xs">
                            <FontAwesomeIcon icon={faShoppingBag} className="text-xs text-[#472ead]" />
                            Détail:
                          </div>
                          <div className="font-bold text-green-600 text-sm">{prixDetail.prix.toLocaleString()} FCFA</div>
                          <small className="text-gray-500 flex items-center gap-1 text-xs">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500 text-xs" />
                            Seuil: {prixDetail.prix_seuil.toLocaleString()} FCFA
                          </small>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200 text-xs">
                          <div className="font-semibold text-gray-800 flex items-center gap-2 mb-1 text-xs">
                            <FontAwesomeIcon icon={faPallet} className="text-xs text-[#f58020]" />
                            Gros:
                          </div>
                          <div className="font-bold text-green-600 text-sm">{prixGros.prix.toLocaleString()} FCFA</div>
                          <small className="text-gray-500 flex items-center gap-1 text-xs">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500 text-xs" />
                            Seuil: {prixGros.prix_seuil.toLocaleString()} FCFA
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => ajouterAuPanier(produit, 'détail')}
                        className="flex-1 py-2 px-3 rounded text-xs font-semibold bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white flex items-center gap-2 justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        title="Ajouter en vente détail"
                      >
                        <FontAwesomeIcon icon={faShoppingBag} className="text-xs" />
                        Détail
                      </button>
                      <button
                        onClick={() => ajouterAuPanier(produit, 'gros')}
                        className="flex-1 py-2 px-3 rounded text-xs font-semibold bg-gradient-to-br from-[#f58020] to-[#ff9c4d] text-white flex items-center gap-2 justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        title="Ajouter en vente gros"
                      >
                        <FontAwesomeIcon icon={faPallet} className="text-xs" />
                        Gros
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section droite : Panier et Client */}
        <div className="space-y-5">
          {/* Informations client */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-base text-gray-800 mb-4 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-[#472ead] text-sm" />
              Informations Client
            </h3>
            <div className="space-y-3">
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 text-gray-500 text-sm z-10" />
                <input
                  ref={inputNomClientRef}
                  type="text"
                  placeholder="Nom complet *"
                  value={client.nom}
                  onChange={(e) => setClient({...client, nom: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
                  required
                />
              </div>
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3 text-gray-500 text-sm z-10" />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={client.telephone}
                  onChange={(e) => setClient({...client, telephone: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
                />
              </div>
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                <textarea
                  placeholder="Adresse"
                  value={client.adresse}
                  onChange={(e) => setClient({...client, adresse: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none resize-y min-h-[60px]"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Panier */}
          <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-base text-gray-800 font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingCart} className="text-[#472ead] text-sm" />
                Panier
              </h3>
              <div className="bg-[#472ead] text-white py-1 px-3 rounded-full text-xs font-semibold">
                {panier.length} art. - {totalTTC.toLocaleString()} FCFA
              </div>
            </div>

            {panier.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faCartArrowDown} className="text-4xl mb-3 text-gray-300" />
                <p className="font-medium">Panier vide</p>
                <small className="text-sm">Ajoutez des produits</small>
              </div>
            ) : (
              <>
                {/* Contrôle TVA */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <div className="mb-0">
                    <label className="flex items-center gap-3 cursor-pointer font-medium text-gray-800 text-sm">
                      <input
                        type="checkbox"
                        checked={tvaActive}
                        onChange={(e) => setTvaActive(e.target.checked)}
                        className="hidden"
                      />
                      <span className="flex items-center justify-center w-4 h-4">
                        <FontAwesomeIcon 
                          icon={tvaActive ? faCheckSquare : faSquare} 
                          className={`text-sm transition-all duration-300 ${tvaActive ? 'text-green-500' : 'text-gray-400'}`}
                        />
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <FontAwesomeIcon icon={faReceipt} className="text-[#472ead] text-sm" />
                        TVA (18%)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Affichage groupé par type de vente */}
                {Object.entries(produitsParType).map(([typeVente, produits]) => (
                  <div key={typeVente} className="mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 py-3 px-4 flex justify-between items-center border-b-2 border-gray-200">
                      <h4 className="m-0 text-gray-800 font-semibold flex items-center gap-2 text-sm">
                        {typeVente === 'détail' ? (
                          <>
                            <FontAwesomeIcon icon={faShoppingBag} className="text-[#472ead] text-sm" />
                            Détail
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPallet} className="text-[#f58020] text-sm" />
                            Gros
                          </>
                        )}
                      </h4>
                      <span className={`${typeVente === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white py-0.5 px-2 rounded-full text-xs font-semibold`}>
                        {produits.length} prod.
                      </span>
                    </div>
                    
                    <div className="p-3">
                      {produits.map(item => (
                        <div key={`${item.id}-${item.type_vente}`} className="bg-gray-50 rounded-lg p-3 mb-3 border-2 border-gray-200">
                          <div className="mb-3">
                            <div className="font-bold text-gray-800 mb-1 text-sm">{item.nom}</div>
                            <div className="text-xs text-gray-600 mb-3">
                              Ref: {item.reference}
                            </div>
                            
                            {/* ÉDITION DU PRIX */}
                            {editionPrix && editionPrix.produitId === item.id && editionPrix.typeVente === item.type_vente ? (
                              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 my-3 text-xs">
                                <div className="flex items-center gap-2 mb-2">
                                  <label className="font-semibold text-amber-700 text-xs">Nouveau prix:</label>
                                  <input
                                    type="number"
                                    value={editionPrix.nouveauPrix}
                                    onChange={(e) => changerPrixEdition(e.target.value)}
                                    className="w-20 py-1 px-2 border border-amber-300 rounded text-xs font-semibold text-center"
                                    min={item.prix_seuil}
                                    step="100"
                                  />
                                  <span className="text-xs">FCFA</span>
                                </div>
                                <div className="flex justify-between mb-3 flex-wrap gap-1 text-xs">
                                  <small className="text-amber-700 text-xs">Min: {item.prix_seuil.toLocaleString()} FCFA</small>
                                  <small className="text-amber-700 text-xs">Base: {item.prix_base.toLocaleString()} FCFA</small>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={validerModificationPrix} className="bg-green-500 text-white py-1 px-3 rounded text-xs font-semibold flex items-center gap-1 border-none cursor-pointer transition-all hover:shadow">
                                    <FontAwesomeIcon icon={faCheck} />
                                  </button>
                                  <button onClick={annulerEditionPrix} className="bg-red-500 text-white py-1 px-3 rounded text-xs font-semibold flex items-center gap-1 border-none cursor-pointer transition-all hover:shadow">
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="my-3">
                                <span className={`text-sm font-bold ${item.prix_vente !== item.prix_base ? 'text-amber-600' : 'text-gray-800'}`}>
                                  {item.prix_vente.toLocaleString()} × {item.quantite}
                                </span>
                                <div className="text-xs text-green-600 font-semibold mt-1">
                                  {(item.prix_vente * item.quantite).toLocaleString()} FCFA
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            {/* ÉDITION DE LA QUANTITÉ */}
                            {editionQuantite && editionQuantite.produitId === item.id && editionQuantite.typeVente === item.type_vente ? (
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editionQuantite.nouvelleQuantite}
                                    onChange={(e) => changerQuantiteEdition(e.target.value)}
                                    className="w-16 py-1 px-2 border border-gray-300 rounded text-sm text-center"
                                    min="1"
                                  />
                                  <div className="flex gap-1">
                                    <button onClick={validerModificationQuantite} className="bg-green-500 text-white w-7 h-7 rounded flex items-center justify-center">
                                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                    </button>
                                    <button onClick={annulerEditionQuantite} className="bg-red-500 text-white w-7 h-7 rounded flex items-center justify-center">
                                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-white py-1 px-2 rounded-lg border border-gray-200">
                                <button
                                  onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite - 1)}
                                  className={`${item.type_vente === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white w-6 h-6 rounded text-sm font-bold border-none cursor-pointer disabled:opacity-50`}
                                  disabled={!!editionPrix}
                                >
                                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                                </button>
                                <span 
                                  className="font-semibold text-gray-800 cursor-pointer px-2"
                                  onClick={() => demarrerEditionQuantite(item)}
                                  title="Modifier quantité"
                                >
                                  {item.quantite}
                                </span>
                                <button
                                  onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite + 1)}
                                  className={`${item.type_vente === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white w-6 h-6 rounded text-sm font-bold border-none cursor-pointer disabled:opacity-50`}
                                  disabled={!!editionPrix}
                                >
                                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                </button>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {!editionPrix && !editionQuantite && (
                                <button
                                  onClick={() => demarrerEditionPrix(item)}
                                  className="bg-blue-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow"
                                  title="Modifier prix"
                                >
                                  <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                </button>
                              )}
                              {!editionPrix && !editionQuantite && item.prix_vente !== item.prix_base && (
                                <button
                                  onClick={() => reinitialiserPrix(item.id, item.type_vente)}
                                  className="bg-amber-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow"
                                  title="Rétablir prix"
                                >
                                  <FontAwesomeIcon icon={faRedo} className="text-xs" />
                                </button>
                              )}
                              <button
                                onClick={() => retirerDuPanier(item.id, item.type_vente)}
                                className="bg-red-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow disabled:opacity-50"
                                disabled={!!editionPrix || !!editionQuantite}
                                title="Retirer"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Résumé */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                  <h4 className="text-sm text-gray-800 mb-3 font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-[#472ead] text-sm" />
                    Résumé
                  </h4>
                  <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                    <span>Total HT:</span>
                    <span>{totalHT.toLocaleString()} FCFA</span>
                  </div>
                  {tvaActive && (
                    <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                      <span>TVA (18%):</span>
                      <span>{tva.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-800">
                    <strong>Total TTC:</strong>
                    <strong>{totalTTC.toLocaleString()} FCFA</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    onClick={validerCommande}
                    className="py-3 rounded-lg text-sm font-bold border-none cursor-pointer flex items-center gap-2 justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                    {envoiEnCours ? 'Envoi...' : 'Envoyer au Caissier'}
                  </button>
                  <button
                    onClick={annulerCommande}
                    className="py-3 rounded-lg text-sm font-bold border-none cursor-pointer flex items-center gap-2 justify-center bg-gradient-to-br from-red-500 to-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    <FontAwesomeIcon icon={faBan} className="text-sm" />
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
{commandeValidee && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-2xl shadow-2xl w-[340px]">
      
      {/* TITRE */}
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faPrint} />
          Aperçu du ticket
        </h3>
        <button
          onClick={() => setCommandeValidee(null)}
          className="text-gray-500 hover:text-red-600"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* TICKET */}
      <div className="flex justify-center">
        <Ticket ref={ticketRef} commande={commandeValidee} />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={imprimerTicket}
          className="flex-1 flex items-center justify-center gap-2
                     bg-green-600 hover:bg-green-700
                     text-white py-2 rounded-lg font-bold transition"
        >
          <FontAwesomeIcon icon={faPrint} />
          Imprimer
        </button>

        <button
          onClick={() => setCommandeValidee(null)}
          className="flex-1 flex items-center justify-center gap-2
                     bg-gray-200 hover:bg-gray-300
                     py-2 rounded-lg font-bold transition"
        >
          <FontAwesomeIcon icon={faXmark} />
          Fermer
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default NouvelleCommande;