export type Role = 'gerant' | 'caissier'

export interface Store {
  id: string
  nom: string
  telephone: string | null
  adresse: string | null
  devise: string
  created_at: string
}

export interface Profile {
  id: string
  store_id: string
  role: Role
  nom: string
  actif: boolean
  created_at: string
}

export interface Categorie {
  id: string
  store_id: string
  nom: string
  couleur: string
  created_at: string
}

export interface Produit {
  id: string
  store_id: string
  nom: string
  code_barre: string | null
  categorie_id: string | null
  prix_achat: number
  prix_vente: number
  quantite: number
  quantite_min: number
  unite: string
  date_ajout: string
}

export interface Fournisseur {
  id: string
  store_id: string
  nom: string
  telephone: string
  created_at: string
}

export interface Vente {
  id: string
  store_id: string
  caissier_id: string
  date_heure: string
  total: number
  montant_recu: number
  monnaie_rendue: number
}

export interface LigneVente {
  id: string
  store_id: string
  vente_id: string
  produit_id: string | null
  nom_produit: string
  quantite: number
  prix_unitaire: number
  prix_achat: number
}

export interface Reception {
  id: string
  store_id: string
  fournisseur_id: string | null
  date_heure: string
}

export interface LigneReception {
  id: string
  store_id: string
  reception_id: string
  produit_id: string
  quantite: number
  prix_achat: number | null
}
