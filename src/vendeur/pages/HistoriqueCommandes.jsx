import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory,
  faFilter,
  faSearch,
  faCalendarAlt,
  faFileAlt,
  faUser,
  faPhone,
  faBox,
  faShoppingBag,
  faPallet,
  faSync,
  faEye,
  faTimes,
  faCheckCircle,
  faClock,
  faTimesCircle,
  faFileInvoiceDollar,
  faReceipt,
  faChartBar,
  faRedo,
  faCalendarDay,
  faCalendar,
  faBoxOpen,
  faCalculator,
  faList
} from '@fortawesome/free-solid-svg-icons';
import '../css/HistoriqueCommandes.css';

const HistoriqueCommandes = ({ commandes = [], sellerName = null }) => {
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreTypeVente, setFiltreTypeVente] = useState('tous');
  const [filtreDate, setFiltreDate] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [recherche, setRecherche] = useState('');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modalOuvert, setModalOuvert] = useState(false);

  // ---------- Données simulées (si aucune commande fournie) ----------
  const genererCommandesSimulees = () => {
    const aujourdhui = new Date();
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    const ilYa3Jours = new Date(aujourdhui);
    ilYa3Jours.setDate(ilYa3Jours.getDate() - 3);
    const ilYa5Jours = new Date(aujourdhui);
    ilYa5Jours.setDate(ilYa5Jours.getDate() - 5);

    return [
      {
        id: 1,
        numero_commande: 'CMD-2024-001',
        client: { nom: 'Marie Diop', telephone: '77 123 45 67', adresse: 'Dakar, Plateau' },
        total_ht: 40000,
        tva: 7200,
        total_ttc: 47200,
        statut: 'complétée',
        types_vente: ['détail', 'gros'],
        date: aujourdhui.toISOString(),
        vendeur: 'Vendeur Principal',
        produits: [
          { 
            nom: 'Bloc Note Mood diary', 
            quantite: 2, 
            prix_unitaire: 350, 
            prix_vente: 350, 
            reference: 'Mood diary',
            sous_total: 700,
            type_vente: 'détail'
          },
          { 
            nom: 'Kirene', 
            quantite: 10, 
            prix_unitaire: 3800, 
            prix_vente: 3800, 
            reference: 'Kirene',
            sous_total: 38000,
            type_vente: 'gros'
          }
        ]
      },
      {
        id: 2,
        numero_commande: 'CMD-2024-002',
        client: { nom: 'Jean Dupont', telephone: '76 234 56 78', adresse: 'Dakar, Almadies' },
        total_ht: 75000,
        tva: 13500,
        total_ttc: 88500,
        statut: 'en_attente_paiement',
        types_vente: ['gros'],
        date: hier.toISOString(),
        vendeur: 'Vendeur Principal',
        produits: [
          { 
            nom: 'Aggraffes', 
            quantite: 5, 
            prix_unitaire: 1000, 
            prix_vente: 1000, 
            reference: 'Agg-NO-384556',
            sous_total: 5000,
            type_vente: 'gros'
          },
          { 
            nom: 'Kirene', 
            quantite: 10, 
            prix_unitaire: 3800, 
            prix_vente: 3800, 
            reference: 'Kirene',
            sous_total: 38000,
            type_vente: 'gros'
          }
        ]
      },
      {
        id: 3,
        numero_commande: 'CMD-2024-003',
        client: { nom: 'Aissatou Fall', telephone: '78 345 67 89', adresse: 'Dakar, Ouakam' },
        total_ht: 15000,
        tva: 2700,
        total_ttc: 17700,
        statut: 'complétée',
        types_vente: ['détail'],
        date: ilYa3Jours.toISOString(),
        vendeur: 'Vendeur Principal',
        produits: [
          { 
            nom: 'Bloc Note Mood diary', 
            quantite: 3, 
            prix_unitaire: 350, 
            prix_vente: 350, 
            reference: 'Mood diary',
            sous_total: 1050,
            type_vente: 'détail'
          },
          { 
            nom: 'Bouteille d\'eau 1.5L', 
            quantite: 2, 
            prix_unitaire: 400, 
            prix_vente: 400, 
            reference: 'Paix-peace-1.5L',
            sous_total: 800,
            type_vente: 'détail'
          }
        ]
      },
      {
        id: 4,
        numero_commande: 'CMD-2024-004',
        client: { nom: 'Moussa Diallo', telephone: '70 123 45 67', adresse: 'Dakar, Fann' },
        total_ht: 25000,
        tva: 4500,
        total_ttc: 29500,
        statut: 'complétée',
        types_vente: ['détail'],
        date: ilYa5Jours.toISOString(),
        vendeur: 'Vendeur Principal',
        produits: [
          { 
            nom: 'Cahier 200 pages', 
            quantite: 2, 
            prix_unitaire: 1200, 
            prix_vente: 1200, 
            reference: 'CAH-200-M',
            sous_total: 2400,
            type_vente: 'détail'
          }
        ]
      }
    ];
  };

  const commandesAffichees = commandes.length > 0 ? commandes : genererCommandesSimulees();

  // ---------- Helpers ----------
  const normaliserDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } catch (error) {
      return null;
    }
  };

  const commandeCorrespondAuType = (commande, typeFiltre) => {
    if (typeFiltre === 'tous') return true;
    if (typeFiltre === 'mixte') {
      return commande.types_vente && commande.types_vente.length > 1;
    }
    if (commande.types_vente && Array.isArray(commande.types_vente)) {
      return commande.types_vente.includes(typeFiltre);
    }
    return commande.type_vente === typeFiltre;
  };

  const commandeCorrespondADate = (commande, dateFiltre) => {
    if (dateFiltre === 'tous') return true;
    const dateCommande = normaliserDate(commande.date);
    if (!dateCommande) return false;
    if (dateFiltre === 'personnalisee') {
      if (!dateDebut && !dateFin) return true;
      const debut = dateDebut ? normaliserDate(dateDebut) : null;
      const fin = dateFin ? normaliserDate(dateFin) : null;
      if (debut && !fin) return dateCommande.getTime() === debut.getTime();
      if (!debut && fin) return dateCommande.getTime() === fin.getTime();
      if (debut && fin) return dateCommande >= debut && dateCommande <= fin;
      return true;
    }
    const aujourdhui = normaliserDate(new Date());
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    switch (dateFiltre) {
      case 'aujourdhui':
        return dateCommande.getTime() === aujourdhui.getTime();
      case 'hier':
        return dateCommande.getTime() === hier.getTime();
      case '7jours': {
        const date7Jours = new Date(aujourdhui);
        date7Jours.setDate(date7Jours.getDate() - 7);
        return dateCommande >= date7Jours;
      }
      case '30jours': {
        const date30Jours = new Date(aujourdhui);
        date30Jours.setDate(date30Jours.getDate() - 30);
        return dateCommande >= date30Jours;
      }
      default:
        return true;
    }
  };

  const commandeCorrespondARecherche = (commande, termeRecherche) => {
    if (!termeRecherche.trim()) return true;
    const terme = termeRecherche.toLowerCase().trim();
    if (commande.numero_commande?.toLowerCase().includes(terme)) return true;
    if (commande.client?.nom?.toLowerCase().includes(terme)) return true;
    if (commande.client?.telephone?.includes(terme)) return true;
    if (commande.produits && Array.isArray(commande.produits)) {
      const produitTrouve = commande.produits.some(produit => 
        produit.nom?.toLowerCase().includes(terme) ||
        produit.reference?.toLowerCase().includes(terme)
      );
      if (produitTrouve) return true;
    }
    return false;
  };

  const commandesFiltrees = commandesAffichees.filter(commande => {
    const matchStatut = filtreStatut === 'tous' || commande.statut === filtreStatut;
    const matchTypeVente = commandeCorrespondAuType(commande, filtreTypeVente);
    const matchDate = commandeCorrespondADate(commande, filtreDate);
    const matchRecherche = commandeCorrespondARecherche(commande, recherche);
    return matchStatut && matchTypeVente && matchDate && matchRecherche;
  });

  const getAffichageTypesVente = (commande) => {
    if (commande.types_vente && Array.isArray(commande.types_vente)) {
      return commande.types_vente.length === 1 ? commande.types_vente[0] : 'mixte';
    }
    return commande.type_vente || 'détail';
  };

  const getStatutIcone = (statut) => {
    switch (statut) {
      case 'complétée': return <FontAwesomeIcon icon={faCheckCircle} className="statut-icone" />;
      case 'en_attente_paiement': return <FontAwesomeIcon icon={faClock} className="statut-icone" />;
      case 'annulée': return <FontAwesomeIcon icon={faTimesCircle} className="statut-icone" />;
      default: return <FontAwesomeIcon icon={faFileAlt} className="statut-icone" />;
    }
  };

  const getStatutClasse = (statut) => {
    switch (statut) {
      case 'complétée': return 'statut-completee';
      case 'en_attente_paiement': return 'statut-attente';
      case 'annulée': return 'statut-annulee';
      default: return 'statut-default';
    }
  };

  const getTypeVenteIcone = (type) => {
    switch (type) {
      case 'détail': return <FontAwesomeIcon icon={faShoppingBag} className="type-vente-icone" />;
      case 'gros': return <FontAwesomeIcon icon={faPallet} className="type-vente-icone" />;
      case 'mixte': return <FontAwesomeIcon icon={faSync} className="type-vente-icone" />;
      default: return <FontAwesomeIcon icon={faBox} className="type-vente-icone" />;
    }
  };

  const getTypeVenteClasse = (type) => {
    switch (type) {
      case 'détail': return 'type-detail';
      case 'gros': return 'type-gros';
      case 'mixte': return 'type-mixte';
      default: return 'type-default';
    }
  };

  const formaterDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formaterDateSimple = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const ouvrirDetails = (commande) => {
    setCommandeSelectionnee(commande);
    setModalOuvert(true);
  };

  const fermerDetails = () => {
    setModalOuvert(false);
    setCommandeSelectionnee(null);
  };

  const compterProduitsParType = (commande) => {
    const compteur = { détail: 0, gros: 0 };
    if (commande.produits && Array.isArray(commande.produits)) {
      commande.produits.forEach(produit => {
        if (produit.type_vente === 'détail') compteur.détail += produit.quantite || 0;
        else if (produit.type_vente === 'gros') compteur.gros += produit.quantite || 0;
      });
    }
    return compteur;
  };

  const calculerTotalParType = (commande) => {
    const totals = { détail: 0, gros: 0 };
    if (commande.produits && Array.isArray(commande.produits)) {
      commande.produits.forEach(produit => {
        const sousTotal = (produit.prix_vente || produit.prix_unitaire || 0) * (produit.quantite || 0);
        if (produit.type_vente === 'détail') totals.détail += sousTotal;
        else if (produit.type_vente === 'gros') totals.gros += sousTotal;
      });
    }
    return totals;
  };

  const reinitialiserDatesPersonnalisees = () => {
    setDateDebut('');
    setDateFin('');
  };

  // ---------- Statistiques ----------
  const commandesAujourdhui = commandesAffichees.filter(commande => {
    const dateCommande = normaliserDate(commande.date);
    const aujourdhui = normaliserDate(new Date());
    return dateCommande && dateCommande.getTime() === aujourdhui.getTime();
  }).length;

  // ---------- Fonction utilitaire pour obtenir le nom du vendeur (source Header/Sidebar) ----------
  const obtenirNomVendeurAffiche = (commande) => {
    // Priorité : champ commande.vendeur s'il existe et n'est pas le placeholder 'Vendeur Principal'
    if (commande?.vendeur && commande.vendeur !== 'Vendeur Principal') return commande.vendeur;
    // Sinon utiliser sellerName passé depuis Header / Sidebar
    if (sellerName) return sellerName;
    // Sinon fallback
    return 'Non spécifié';
  };

  return (
    <div className="historique-commandes">
      <div className="historique-entete">
        <div className="entete-principal">
          <h2>
            <FontAwesomeIcon icon={faHistory} className="entete-icone" />
            Historique des Commandes
          </h2>
          <p>Consultez l'historique complet des commandes clients</p>
        </div>
        <div className="entete-statistiques">
          <div className="statistique-globale">
            <span className="statistique-valeur">{commandesAffichees.length}</span>
            <span className="statistique-label">Commandes totales</span>
          </div>
          <div className="statistique-globale statut-attente">
            <span className="statistique-valeur">
              {commandesAffichees.filter(c => c.statut === 'en_attente_paiement').length}
            </span>
            <span className="statistique-label">En attente</span>
          </div>
          <div className="statistique-globale aujourdhui">
            <span className="statistique-valeur">{commandesAujourdhui}</span>
            <span className="statistique-label">Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="controles-historique">
        <div className="filtres-groupe">
          <div className="filtre-item">
            <label>
              <FontAwesomeIcon icon={faFilter} className="filtre-icone" />
              Statut :
            </label>
            <select 
              value={filtreStatut} 
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="select-filtre"
            >
              <option value="tous">Tous les statuts</option>
              <option value="complétée">Complétées</option>
              <option value="en_attente_paiement">En attente</option>
              <option value="annulée">Annulées</option>
            </select>
          </div>

          <div className="filtre-item">
            <label>
              <FontAwesomeIcon icon={faBoxOpen} className="filtre-icone" />
              Type de vente :
            </label>
            <select 
              value={filtreTypeVente} 
              onChange={(e) => setFiltreTypeVente(e.target.value)}
              className="select-filtre"
            >
              <option value="tous">Tous les types</option>
              <option value="détail">Détail uniquement</option>
              <option value="gros">Gros uniquement</option>
              <option value="mixte">Ventes mixtes</option>
            </select>
          </div>

          <div className="filtre-item">
            <label>
              <FontAwesomeIcon icon={faCalendarAlt} className="filtre-icone" />
              Période :
            </label>
            <select 
              value={filtreDate} 
              onChange={(e) => {
                setFiltreDate(e.target.value);
                if (e.target.value !== 'personnalisee') reinitialiserDatesPersonnalisees();
              }}
              className="select-filtre"
            >
              <option value="tous">Toutes les dates</option>
              <option value="aujourdhui">Aujourd'hui</option>
              <option value="hier">Hier</option>
              <option value="7jours">7 derniers jours</option>
              <option value="30jours">30 derniers jours</option>
              <option value="personnalisee">
                <FontAwesomeIcon icon={faCalendar} /> Période personnalisée
              </option>
            </select>
          </div>

          {filtreDate === 'personnalisee' && (
            <div className="periode-personnalisee">
              <div className="date-input-groupe">
                <label>Du :</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="input-date"
                />
              </div>
              <div className="date-input-groupe">
                <label>Au :</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="input-date"
                />
              </div>
              {(dateDebut || dateFin) && (
                <button 
                  className="bouton-reinitialiser-dates"
                  onClick={reinitialiserDatesPersonnalisees}
                  title="Réinitialiser les dates"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="recherche-historique">
          <input
            type="text"
            placeholder="Rechercher par numéro, client, téléphone ou produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="input-recherche-historique"
          />
          <FontAwesomeIcon icon={faSearch} className="icone-recherche" />
        </div>
      </div>

      {/* Résumé période sélectionnée */}
      {filtreDate === 'personnalisee' && (dateDebut || dateFin) && (
        <div className="resume-periode">
          <p>
            <FontAwesomeIcon icon={faCalendarAlt} className="resume-icone" />
            Période sélectionnée : 
            {dateDebut && ` Du ${formaterDateSimple(dateDebut)}`}
            {dateFin && ` Au ${formaterDateSimple(dateFin)}`}
            {!dateDebut && dateFin && ` Date exacte : ${formaterDateSimple(dateFin)}`}
            {dateDebut && !dateFin && ` Date exacte : ${formaterDateSimple(dateDebut)}`}
            {dateDebut && dateFin && dateDebut === dateFin && ` Date exacte : ${formaterDateSimple(dateDebut)}`}
          </p>
        </div>
      )}

      {/* Liste des commandes */}
      <div className="liste-commandes">
        {commandesFiltrees.length === 0 ? (
          <div className="aucune-commande">
            <FontAwesomeIcon icon={faBox} className="aucune-commande-icone" />
            <h3>Aucune commande trouvée</h3>
            <p>Aucune commande ne correspond à vos critères de recherche.</p>
            {(recherche || filtreStatut !== 'tous' || filtreTypeVente !== 'tous' || filtreDate !== 'tous') && (
              <button 
                className="bouton-reinitialiser"
                onClick={() => {
                  setRecherche('');
                  setFiltreStatut('tous');
                  setFiltreTypeVente('tous');
                  setFiltreDate('tous');
                  reinitialiserDatesPersonnalisees();
                }}
              >
                <FontAwesomeIcon icon={faRedo} className="bouton-icone" />
                Réinitialiser tous les filtres
              </button>
            )}
          </div>
        ) : (
          commandesFiltrees.map(commande => {
            const typesAffichage = getAffichageTypesVente(commande);
            const compteurProduits = compterProduitsParType(commande);
            const totalsParType = calculerTotalParType(commande);
            const nomVendeurCarte = obtenirNomVendeurAffiche(commande);

            return (
              <div key={commande.id} className="carte-commande">
                <div className="commande-entete">
                  <div className="commande-info-principale">
                    <h3 className="numero-commande">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="numero-commande-icone" />
                      {commande.numero_commande}
                    </h3>
                    <div className="commande-meta">
                      <span className="commande-date">
                        <FontAwesomeIcon icon={faCalendarAlt} className="meta-icone" />
                        {formaterDate(commande.date)}
                      </span>
                      <span className="separateur">•</span>
                      <span className={`statut-commande ${getStatutClasse(commande.statut)}`}>
                        {getStatutIcone(commande.statut)} {commande.statut}
                      </span>
                      <span className="separateur">•</span>
                      <span className={`type-vente-commande ${getTypeVenteClasse(typesAffichage)}`}>
                        {getTypeVenteIcone(typesAffichage)} {typesAffichage}
                      </span>
                      {/* Affichage du vendeur sur la carte (lecture seule) */}
                      <span className="separateur">•</span>
                      <span className="vendeur-carte" title={`Vendeur: ${nomVendeurCarte}`}>
                        <FontAwesomeIcon icon={faUser} className="meta-icone" /> {nomVendeurCarte}
                      </span>
                    </div>
                  </div>
                  
                  <div className="commande-total">
                    <div className="total-ttc">{commande.total_ttc?.toLocaleString() || '0'} FCFA</div>
                    <div className="details-total">
                      HT: {commande.total_ht?.toLocaleString() || '0'} FCFA • TVA: {commande.tva?.toLocaleString() || '0'} FCFA
                    </div>
                  </div>
                </div>

                <div className="commande-client">
                  <div className="info-client">
                    <strong>
                      <FontAwesomeIcon icon={faUser} className="client-icone" />
                      {commande.client?.nom || 'Client non spécifié'}
                    </strong>
                    {commande.client?.telephone && (
                      <span className="client-telephone">
                        <FontAwesomeIcon icon={faPhone} className="telephone-icone" />
                        {commande.client.telephone}
                      </span>
                    )}
                    <span className="client-date">
                      <FontAwesomeIcon icon={faCalendarDay} className="date-icone" />
                      {formaterDateSimple(commande.date)}
                    </span>
                  </div>
                </div>

                <div className="commande-produits">
                  <h4>
                    <FontAwesomeIcon icon={faBox} className="produits-icone" />
                    Détails des produits et prix :
                  </h4>
                  <div className="repartition-types">
                    {compteurProduits.détail > 0 && (
                      <span className="badge-type detail">
                        <FontAwesomeIcon icon={faShoppingBag} className="badge-icone" />
                        {compteurProduits.détail} produit(s) détail - {totalsParType.détail.toLocaleString()} FCFA
                      </span>
                    )}
                    {compteurProduits.gros > 0 && (
                      <span className="badge-type gros">
                        <FontAwesomeIcon icon={faPallet} className="badge-icone" />
                        {compteurProduits.gros} produit(s) gros - {totalsParType.gros.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  <div className="liste-produits-commande">
                    {commande.produits?.slice(0, 3).map((produit, index) => {
                      const prixUnitaire = produit.prix_vente || produit.prix_unitaire || 0;
                      const sousTotal = prixUnitaire * (produit.quantite || 0);
                      
                      return (
                        <div key={index} className="produit-commande">
                          <span className="produit-nom">{produit.nom}</span>
                          <span className="produit-quantite">× {produit.quantite}</span>
                          <span className={`produit-type ${produit.type_vente}`}>
                            {produit.type_vente === 'détail' ? 
                              <FontAwesomeIcon icon={faShoppingBag} /> : 
                              <FontAwesomeIcon icon={faPallet} />
                            }
                          </span>
                          <span className="produit-prix-unitaire">{prixUnitaire.toLocaleString()} FCFA</span>
                          <span className="produit-sous-total-preview">{sousTotal.toLocaleString()} FCFA</span>
                        </div>
                      );
                    })}
                    {commande.produits?.length > 3 && (
                      <div className="plus-produits">
                        + {commande.produits.length - 3} autre(s) produit(s) - 
                        Total: {commande.total_ttc?.toLocaleString()} FCFA
                      </div>
                    )}
                  </div>
                </div>

                <div className="commande-actions">
                  <button 
                    className="bouton-details"
                    onClick={() => ouvrirDetails(commande)}
                  >
                    <FontAwesomeIcon icon={faEye} className="bouton-details-icone" />
                    Voir détails complets
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Résumé des filtres */}
      {commandesFiltrees.length > 0 && (
        <div className="resume-filtres">
          <p>
            <FontAwesomeIcon icon={faChartBar} className="resume-icone" />
            Affichage de <strong>{commandesFiltrees.length}</strong> commande(s) sur {commandesAffichees.length} total
            {filtreStatut !== 'tous' && ` • Statut: ${filtreStatut}`}
            {filtreTypeVente !== 'tous' && ` • Type: ${filtreTypeVente}`}
            {filtreDate !== 'tous' && ` • Période: ${filtreDate}`}
            {recherche && ` • Recherche: "${recherche}"`}
          </p>
        </div>
      )}

      {/* Modal des détails */}
      {modalOuvert && commandeSelectionnee && (
        <div className="modal-overlay" onClick={fermerDetails}>
          <div className="modal-contenu" onClick={(e) => e.stopPropagation()}>
            <div className="modal-entete">
              <h2>
                <FontAwesomeIcon icon={faReceipt} className="modal-icone" />
                Détails complets de la commande
              </h2>
              <button className="bouton-fermer" onClick={fermerDetails}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-corps">
              {/* Informations générales */}
              <div className="section-modal">
                <h3>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  Informations de la commande
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Numéro:</strong>
                    <span>{commandeSelectionnee.numero_commande}</span>
                  </div>
                  <div className="info-item">
                    <strong>Date:</strong>
                    <span>{formaterDate(commandeSelectionnee.date)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Statut:</strong>
                    <span className={`statut-commande ${getStatutClasse(commandeSelectionnee.statut)}`}>
                      {getStatutIcone(commandeSelectionnee.statut)} {commandeSelectionnee.statut}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Vendeur:</strong>
                    <span>
                      { (commandeSelectionnee.vendeur && commandeSelectionnee.vendeur !== 'Vendeur Principal')
                          ? commandeSelectionnee.vendeur
                          : (sellerName || 'Non spécifié')
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Type(s) de vente:</strong>
                    <span>
                      {commandeSelectionnee.types_vente && Array.isArray(commandeSelectionnee.types_vente) 
                        ? commandeSelectionnee.types_vente.map(type => (
                            <span key={type} className={`badge-type ${type}`} style={{marginLeft: '5px'}}>
                              {type === 'détail' ? 'Détail' : 'Gros'}
                            </span>
                          ))
                        : 'Détail'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations client */}
              <div className="section-modal">
                <h3>
                  <FontAwesomeIcon icon={faUser} />
                  Informations client
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Nom:</strong>
                    <span>{commandeSelectionnee.client?.nom || 'Non spécifié'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Téléphone:</strong>
                    <span>{commandeSelectionnee.client?.telephone || 'Non spécifié'}</span>
                  </div>
                  <div className="info-item full-width">
                    <strong>Adresse:</strong>
                    <span>{commandeSelectionnee.client?.adresse || 'Non spécifié'}</span>
                  </div>
                </div>
              </div>

              {/* Détails des produits */}
              <div className="section-modal">
                <h3>
                  <FontAwesomeIcon icon={faList} />
                  Produits commandés ({commandeSelectionnee.produits?.length || 0})
                </h3>
                <div className="tableau-produits">
                  <div className="entete-tableau">
                    <div className="colonne-produit">Produit</div>
                    <div className="colonne-reference">Référence</div>
                    <div className="colonne-type">Type</div>
                    <div className="colonne-quantite">Quantité</div>
                    <div className="colonne-prix">Prix unitaire</div>
                    <div className="colonne-total">Sous-total</div>
                  </div>
                  {commandeSelectionnee.produits?.map((produit, index) => {
                    const prixUnitaire = produit.prix_vente || produit.prix_unitaire || 0;
                    const sousTotal = prixUnitaire * (produit.quantite || 0);
                    return (
                      <div key={index} className="ligne-produit">
                        <div className="colonne-produit"><strong>{produit.nom}</strong></div>
                        <div className="colonne-reference">{produit.reference || 'N/A'}</div>
                        <div className="colonne-type">
                          <span className={`badge-type ${produit.type_vente}`}>
                            {produit.type_vente === 'détail' ? 
                              <><FontAwesomeIcon icon={faShoppingBag} /> Détail</> : 
                              <><FontAwesomeIcon icon={faPallet} /> Gros</>
                            }
                          </span>
                        </div>
                        <div className="colonne-quantite">{produit.quantite}</div>
                        <div className="colonne-prix">{prixUnitaire.toLocaleString()} FCFA</div>
                        <div className="colonne-total"><strong>{sousTotal.toLocaleString()} FCFA</strong></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totaux */}
              <div className="section-modal">
                <h3>
                  <FontAwesomeIcon icon={faCalculator} />
                  Totaux de la commande
                </h3>
                <div className="totaux-commande">
                  <div className="ligne-total-modal">
                    <span>Total HT:</span>
                    <span>{commandeSelectionnee.total_ht?.toLocaleString() || '0'} FCFA</span>
                  </div>
                  <div className="ligne-total-modal">
                    <span>TVA (18%):</span>
                    <span>{commandeSelectionnee.tva?.toLocaleString() || '0'} FCFA</span>
                  </div>
                  <div className="ligne-total-modal total-ttc-modal">
                    <strong>Total TTC:</strong>
                    <strong>{commandeSelectionnee.total_ttc?.toLocaleString() || '0'} FCFA</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-pied">
              <button className="bouton-fermer-modal" onClick={fermerDetails}>
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

export default HistoriqueCommandes;
