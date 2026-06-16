import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from '@/auth/AuthProvider'
import { ProtectedRoute }  from '@/auth/ProtectedRoute'
import { RoleRoute }       from '@/auth/RoleRoute'
import { AppShell }        from '@/components/layout/AppShell'
import { LoginPage }       from '@/features/auth/LoginPage'
import { RegisterPage }    from '@/features/auth/RegisterPage'
import { RoleRedirect }    from '@/features/auth/RoleRedirect'
import { DashboardPage }   from '@/features/dashboard/DashboardPage'
import { CaissePage }      from '@/features/caisse/CaissePage'
import { RecuPage }        from '@/features/recu/RecuPage'
import { ProduitsPage }    from '@/features/produits/ProduitsPage'
import { ProduitForm }     from '@/features/produits/ProduitForm'
import { CategoriesPage }  from '@/features/categories/CategoriesPage'
import { AlertesPage }     from '@/features/alertes/AlertesPage'
import { ReceptionPage }   from '@/features/reception/ReceptionPage'
import { HistoriquePage }  from '@/features/historique/HistoriquePage'
import { ParametresPage }  from '@/features/parametres/ParametresPage'
import { StaffPage }       from '@/features/parametres/StaffPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<RoleRedirect />} />

              {/* Gérant-only */}
              <Route element={<RoleRoute allow={['gerant']} />}>
                <Route path="/dashboard"        element={<DashboardPage />} />
                <Route path="/produits"         element={<ProduitsPage />} />
                <Route path="/produits/nouveau" element={<ProduitForm />} />
                <Route path="/produits/:id"     element={<ProduitForm />} />
                <Route path="/categories"       element={<CategoriesPage />} />
                <Route path="/alertes"          element={<AlertesPage />} />
                <Route path="/reception"        element={<ReceptionPage />} />
                <Route path="/parametres"       element={<ParametresPage />} />
                <Route path="/parametres/staff" element={<StaffPage />} />
              </Route>

              {/* Both roles */}
              <Route path="/caisse"          element={<CaissePage />} />
              <Route path="/historique"      element={<HistoriquePage />} />
              <Route path="/recu/:venteId"   element={<RecuPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
