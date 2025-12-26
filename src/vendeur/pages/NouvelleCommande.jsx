import React, { useState, useRef } from 'react';
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
  faSquare,
  faPrint   // 🔹 AJOUT POUR LE BOUTON IMPRIMER
} from '@fortawesome/free-solid-svg-icons';

import { QRCodeCanvas } from 'qrcode.react'; // 🔹 AJOUT POUR LE QR CODE
import '../css/NouvelleCommande.css';

// 🔹 sellerName ajouté pour récupérer le nom du vendeur réel
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

  // 🔹 NOUVEAU : commande utilisée pour le ticket QR
  const [commandePourTicket, setCommandePourTicket] = useState(null);

  /**
   * Filtrer les produits selon la recherche
   */
  const produitsFiltres = produits.filter(produit =>
    produit.nom.toLowerCase().includes(rechercheProduit.toLowerCase()) ||
    produit.reference.toLowerCase().includes(rechercheProduit.toLowerCase()) ||
    produit.code_barre.includes(rechercheProduit)
  );

  /**
   * Obtenir le prix et le prix seuil selon le type de vente
   */
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

  /**
   * Ajouter un produit au panier avec le type de vente sélectionné
   */
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

  /**
   * Ajouter par code barre
   */
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

  /**
   * Modifier la quantité avec saisie directe
   */
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

  /**
   * Modifier la quantité avec les boutons +/- 
   */
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

  /**
   * Retirer un produit du panier
   */
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

  /**
   * Démarrer l'édition du prix
   */
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

  /**
   * Réinitialiser le prix au prix original
   */
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

  /**
   * Calculer les totaux de la commande avec TVA optionnelle
   */
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

  /**
   * Valider la commande finale
   */
  const validerCommande = async () => {
    if (panier.length === 0) {
      alert('❌ Le panier est vide !');
      return;
    }

    // Vérification du nom du client avec redirection automatique
    if (!client.nom.trim()) {
      alert('❌ Veuillez saisir le nom du client !');
      
      if (inputNomClientRef.current) {
        inputNomClientRef.current.focus();
        inputNomClientRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        inputNomClientRef.current.style.borderColor = '#e74c3c';
        inputNomClientRef.current.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
        
        setTimeout(() => {
          if (inputNomClientRef.current) {
            inputNomClientRef.current.style.borderColor = '';
            inputNomClientRef.current.style.boxShadow = '';
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
        vendeur: sellerName || 'Vendeur Principal' // 🔹 utilise le vrai vendeur si dispo
      };

      // 🔹 On appelle le parent (pour sauvegarder / envoyer au backend)
      await onCommandeValidee(nouvelleCommande);

      // 🔹 On garde la commande pour générer le ticket QR
      setCommandePourTicket(nouvelleCommande);

      // 🔹 On vide le formulaire pour la prochaine commande
      setPanier([]);
      setClient({ nom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      
    } catch (error) {
      console.error('Erreur validation commande:', error);
      alert('❌ Erreur lors de l\'envoi de la commande');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  /**
   * Annuler la commande en cours
   */
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

  /**
   * Grouper les produits du panier par type de vente
   */
  const produitsParType = panier.reduce((acc, item) => {
    const type = item.type_vente;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});

  // 🔹 Impression du ticket : on utilise window.print()
  const imprimerTicket = () => {
    if (!commandePourTicket) return;
    window.print();
  };

  // 🔹 Contenu JSON encodé dans le QR :
  const getValeurQRCode = () => {
    if (!commandePourTicket) return '';
    // ici on met TOUTES les infos utiles dans le QR
    const data = {
      type: 'ticket_commande',
      numero_commande: commandePourTicket.numero_commande,
      date: commandePourTicket.date,
      vendeur: commandePourTicket.vendeur,
      client: commandePourTicket.client,
      total_ht: commandePourTicket.total_ht,
      tva: commandePourTicket.tva,
      total_ttc: commandePourTicket.total_ttc,
      produits: commandePourTicket.produits
    };
    return JSON.stringify(data);
  };

  return (
    <div className="nouvelle-commande">
      <div className="commande-entete">
        <h2>
          <FontAwesomeIcon icon={faShoppingCart} className="entete-icone" />
          Nouvelle Commande
        </h2>
        <p>Créez une commande client - Gestion détail et gros</p>
      </div>

      <div className="commande-conteneur">
        {/* Section gauche : Produits */}
        <div className="section-produits">
          {/* Configuration du type de vente global */}
          <div className="section-type-vente-global">
            <h3>
              <FontAwesomeIcon icon={faShoppingBag} className="section-icone" />
              Type de Vente Global
            </h3>
            <div className="selecteur-type-vente">
              <button
                className={`bouton-type-vente ${typeVenteGlobal === 'détail' ? 'actif' : ''}`}
                onClick={() => setTypeVenteGlobal('détail')}
              >
                <FontAwesomeIcon icon={faShoppingBag} className="bouton-icone" />
                Détail
              </button>
              <button
                className={`bouton-type-vente ${typeVenteGlobal === 'gros' ? 'actif' : ''}`}
                onClick={() => setTypeVenteGlobal('gros')}
              >
                <FontAwesomeIcon icon={faPallet} className="bouton-icone" />
                Gros
              </button>
            </div>
            <div className="info-type-vente-global">
              <p>
                <strong>Type :</strong> {typeVenteGlobal === 'détail' ? 'Détail' : 'Gros'}
              </p>
              <small>
                {typeVenteGlobal === 'détail' 
                  ? 'Prix standard - Quantités unitaires' 
                  : 'Prix réduit - Quantités importantes'}
              </small>
            </div>
          </div>

          {/* Code barre */}
          <div className="section-code-barre">
            <h3>
              <FontAwesomeIcon icon={faBarcode} className="section-icone" />
              Scanner Code Barre
            </h3>
            <div className="controle-code-barre">
              <input
                ref={inputCodeBarreRef}
                type="text"
                placeholder={`Code barre (${typeVenteGlobal})...`}
                value={codeBarre}
                onChange={(e) => setCodeBarre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && ajouterParCodeBarre()}
                className="input-code-barre"
              />
              <button onClick={ajouterParCodeBarre} className="bouton-scanner">
                <FontAwesomeIcon icon={faSearch} className="bouton-icone" />
                Scanner
              </button>
            </div>
          </div>

          {/* Recherche manuelle */}
          <div className="section-recherche">
            <h3>
              <FontAwesomeIcon icon={faSearch} className="section-icone" />
              Recherche Produits
            </h3>
            <input
              type="text"
              placeholder="Nom, référence ou code barre..."
              value={rechercheProduit}
              onChange={(e) => setRechercheProduit(e.target.value)}
              className="input-recherche"
            />
          </div>

          {/* Liste des produits disponibles */}
          <div className="liste-produits">
            <h3>
              <FontAwesomeIcon icon={faBox} className="section-icone" />
              Produits Disponibles ({produitsFiltres.length})
            </h3>
            <div className="grille-produits">
              {produitsFiltres.map(produit => {
                const prixDetail = obtenirPrixParType(produit, 'détail');
                const prixGros = obtenirPrixParType(produit, 'gros');
                
                return (
                  <div key={produit.id} className="carte-produit">
                    <div className="produit-info">
                      <h4>{produit.nom}</h4>
                      <p className="produit-reference">
                        <FontAwesomeIcon icon={faDatabase} className="info-icone" />
                        Ref: {produit.reference}
                      </p>
                      <p className="produit-code-barre">
                        <FontAwesomeIcon icon={faBarcode} className="info-icone" />
                        Code: {produit.code_barre}
                      </p>
                      
                      <div className="prix-par-type">
                        <div className="prix-type">
                          <span className="type-label">
                            <FontAwesomeIcon icon={faShoppingBag} className="type-icone" />
                            Détail:
                          </span>
                          <span className="prix-valeur">{prixDetail.prix.toLocaleString()} FCFA</span>
                          <small>
                            <FontAwesomeIcon icon={faMoneyBillWave} className="seuil-icone" />
                            Seuil: {prixDetail.prix_seuil.toLocaleString()} FCFA
                          </small>
                        </div>
                        <div className="prix-type">
                          <span className="type-label">
                            <FontAwesomeIcon icon={faPallet} className="type-icone" />
                            Gros:
                          </span>
                          <span className="prix-valeur">{prixGros.prix.toLocaleString()} FCFA</span>
                          <small>
                            <FontAwesomeIcon icon={faMoneyBillWave} className="seuil-icone" />
                            Seuil: {prixGros.prix_seuil.toLocaleString()} FCFA
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="actions-produit">
                      <button
                        onClick={() => ajouterAuPanier(produit, 'détail')}
                        className="bouton-ajouter detail"
                        title="Ajouter en vente détail"
                      >
                        <FontAwesomeIcon icon={faShoppingBag} className="bouton-ajouter-icone" />
                        Détail
                      </button>
                      <button
                        onClick={() => ajouterAuPanier(produit, 'gros')}
                        className="bouton-ajouter gros"
                        title="Ajouter en vente gros"
                      >
                        <FontAwesomeIcon icon={faPallet} className="bouton-ajouter-icone" />
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
        <div className="section-droite">
          {/* Informations client */}
          <div className="section-client">
            <h3>
              <FontAwesomeIcon icon={faUser} className="section-icone" />
              Informations Client
            </h3>
            <div className="formulaire-client">
              <div className="input-group">
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  ref={inputNomClientRef}
                  type="text"
                  placeholder="Nom complet *"
                  value={client.nom}
                  onChange={(e) => setClient({...client, nom: e.target.value})}
                  className="input-client"
                  required
                />
              </div>
              <div className="input-group">
                <FontAwesomeIcon icon={faPhone} className="input-icon" />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={client.telephone}
                  onChange={(e) => setClient({...client, telephone: e.target.value})}
                  className="input-client"
                />
              </div>
              <div className="input-group">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" />
                <textarea
                  placeholder="Adresse"
                  value={client.adresse}
                  onChange={(e) => setClient({...client, adresse: e.target.value})}
                  className="textarea-adresse"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Panier */}
          <div className="section-panier">
            <div className="panier-entete">
              <h3>
                <FontAwesomeIcon icon={faShoppingCart} className="panier-icone" />
                Panier
              </h3>
              <div className="panier-statut">
                {panier.length} art. - {totalTTC.toLocaleString()} FCFA
              </div>
            </div>

            {panier.length === 0 ? (
              <div className="panier-vide">
                <FontAwesomeIcon icon={faCartArrowDown} className="panier-vide-icone" />
                <p>Panier vide</p>
                <small>Ajoutez des produits</small>
              </div>
            ) : (
              <>
                {/* Contrôle TVA */}
                <div className="controle-tva-panier">
                  <div className="checkbox-tva">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={tvaActive}
                        onChange={(e) => setTvaActive(e.target.checked)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom">
                        <FontAwesomeIcon 
                          icon={tvaActive ? faCheckSquare : faSquare} 
                          className={`checkbox-icon ${tvaActive ? 'checked' : ''}`}
                        />
                      </span>
                      <span className="checkbox-text">
                        <FontAwesomeIcon icon={faReceipt} className="checkbox-icone" />
                        TVA (18%)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Affichage groupé par type de vente */}
                {Object.entries(produitsParType).map(([typeVente, produits]) => (
                  <div key={typeVente} className="groupe-type-vente">
                    <div className="entete-groupe-type">
                      <h4>
                        {typeVente === 'détail' ? (
                          <>
                            <FontAwesomeIcon icon={faShoppingBag} className="groupe-icone" />
                            Détail
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPallet} className="groupe-icone" />
                            Gros
                          </>
                        )}
                      </h4>
                      <span className="badge-type">
                        {produits.length} prod.
                      </span>
                    </div>
                    
                    <div className="liste-panier-groupe">
                      {produits.map(item => (
                        <div key={`${item.id}-${item.type_vente}`} className="item-panier">
                          <div className="item-info">
                            <div className="item-nom">{item.nom}</div>
                            <div className="item-reference">
                              Ref: {item.reference}
                            </div>
                            
                            {/* ÉDITION DU PRIX */}
                            {editionPrix && editionPrix.produitId === item.id && editionPrix.typeVente === item.type_vente ? (
                              <div className="edition-prix">
                                <div className="controle-prix">
                                  <label>Nouveau prix:</label>
                                  <input
                                    type="number"
                                    value={editionPrix.nouveauPrix}
                                    onChange={(e) => changerPrixEdition(e.target.value)}
                                    className="input-prix"
                                    min={item.prix_seuil}
                                    step="100"
                                  />
                                  <span>FCFA</span>
                                </div>
                                <div className="limites-prix">
                                  <small>Min: {item.prix_seuil.toLocaleString()} FCFA</small>
                                  <small>Base: {item.prix_base.toLocaleString()} FCFA</small>
                                </div>
                                <div className="actions-edition">
                                  <button onClick={validerModificationPrix} className="bouton-confirmer-prix">
                                    <FontAwesomeIcon icon={faCheck} />
                                  </button>
                                  <button onClick={annulerEditionPrix} className="bouton-annuler-prix">
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="affichage-prix">
                                <span className={`prix-actuel ${item.prix_vente !== item.prix_base ? 'prix-modifie' : ''}`}>
                                  {item.prix_vente.toLocaleString()} × {item.quantite}
                                </span>
                                <div className="sous-total">
                                  {(item.prix_vente * item.quantite).toLocaleString()} FCFA
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="item-actions">
                            {/* ÉDITION DE LA QUANTITÉ */}
                            {editionQuantite && editionQuantite.produitId === item.id && editionQuantite.typeVente === item.type_vente ? (
                              <div className="edition-quantite">
                                <div className="controle-quantite-edition">
                                  <input
                                    type="number"
                                    value={editionQuantite.nouvelleQuantite}
                                    onChange={(e) => changerQuantiteEdition(e.target.value)}
                                    className="input-quantite-edition"
                                    min="1"
                                  />
                                  <div className="actions-edition-quantite">
                                    <button onClick={validerModificationQuantite} className="bouton-confirmer-quantite">
                                      <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button onClick={annulerEditionQuantite} className="bouton-annuler-quantite">
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="controle-quantite">
                                <button
                                  onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite - 1)}
                                  className="bouton-quantite"
                                  disabled={!!editionPrix}
                                >
                                  <FontAwesomeIcon icon={faMinus} />
                                </button>
                                <span 
                                  className="quantite"
                                  onClick={() => demarrerEditionQuantite(item)}
                                  title="Modifier quantité"
                                >
                                  {item.quantite}
                                </span>
                                <button
                                  onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite + 1)}
                                  className="bouton-quantite"
                                  disabled={!!editionPrix}
                                >
                                  <FontAwesomeIcon icon={faPlus} />
                                </button>
                              </div>
                            )}

                            <div className="actions-prix">
                              {!editionPrix && !editionQuantite && (
                                <button
                                  onClick={() => demarrerEditionPrix(item)}
                                  className="bouton-modifier-prix"
                                  title="Modifier prix"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                              )}
                              {!editionPrix && !editionQuantite && item.prix_vente !== item.prix_base && (
                                <button
                                  onClick={() => reinitialiserPrix(item.id, item.type_vente)}
                                  className="bouton-reinitialiser-prix"
                                  title="Rétablir prix"
                                >
                                  <FontAwesomeIcon icon={faRedo} />
                                </button>
                              )}
                              <button
                                onClick={() => retirerDuPanier(item.id, item.type_vente)}
                                className="bouton-supprimer"
                                disabled={!!editionPrix || !!editionQuantite}
                                title="Retirer"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Résumé */}
                <div className="resume-commande">
                  <h4>
                    <FontAwesomeIcon icon={faReceipt} className="resume-icone" />
                    Résumé
                  </h4>
                  <div className="ligne-total">
                    <span>Total HT:</span>
                    <span>{totalHT.toLocaleString()} FCFA</span>
                  </div>
                  {tvaActive && (
                    <div className="ligne-tva">
                      <span>TVA (18%):</span>
                      <span>{tva.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="ligne-total-ttc">
                    <strong>Total TTC:</strong>
                    <strong>{totalTTC.toLocaleString()} FCFA</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="actions-panier">
                  <button
                    onClick={validerCommande}
                    className="bouton-valider"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="bouton-icone" />
                    {envoiEnCours ? 'Envoi...' : 'Envoyer au Caissier'}
                  </button>
                  <button
                    onClick={annulerCommande}
                    className="bouton-annuler"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    <FontAwesomeIcon icon={faBan} className="bouton-icone" />
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 MODAL TICKET AVEC QR CODE (après validation) */}
      {commandePourTicket && (
        <div className="ticket-overlay">
          <div className="ticket-contenu">
            {/* Partie visible à l'écran uniquement (pas imprimée) */}
            <div className="ticket-texte-ecran">
              <h3>Ticket commande</h3>
              <p>Numéro : <strong>{commandePourTicket.numero_commande}</strong></p>
              <p>Vendeur : <strong>{commandePourTicket.vendeur}</strong></p>
              <p>Total TTC : <strong>{commandePourTicket.total_ttc.toLocaleString()} FCFA</strong></p>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                Le ticket imprimé contiendra uniquement le QR code.
              </p>
            </div>

            {/* Partie qui sera imprimée : uniquement ce bloc QR */}
            <div className="ticket-qrcode-print">
              <QRCodeCanvas 
                value={getValeurQRCode()}
                size={220}
                includeMargin={true}
              />
            </div>

            {/* Boutons (non imprimés) */}
            <div className="ticket-actions">
              <button className="bouton-imprimer-ticket" onClick={imprimerTicket}>
                <FontAwesomeIcon icon={faPrint} className="bouton-icone" />
                Imprimer le ticket
              </button>
              <button 
                className="bouton-fermer-ticket" 
                onClick={() => setCommandePourTicket(null)}
              >
                <FontAwesomeIcon icon={faTimes} className="bouton-icone" />
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
