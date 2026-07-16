import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import Produits from "@/pages/Produits";
import ProduitDetail from "@/pages/ProduitDetail";
import MetierDetail from "@/pages/MetierDetail";
import Realisations from "@/pages/Realisations";
import Actualites from "@/pages/Actualites";
import ArticleDetail from "@/pages/ArticleDetail";
import Certifications from "@/pages/Certifications";
import Partenaires from "@/pages/Partenaires";
import RSE from "@/pages/RSE";
import Contact from "@/pages/Contact";
import Devis from "@/pages/Devis";
import Activites from "@/pages/Activites";
import ActiviteDetail from "@/pages/ActiviteDetail";
import PublicPage from "@/pages/PublicPage";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminArticles from "@/pages/admin/AdminArticles";
import AdminRealisations from "@/pages/admin/AdminRealisations";
import AdminPartners from "@/pages/admin/AdminPartners";
import AdminCertifications from "@/pages/admin/AdminCertifications";
import AdminContacts from "@/pages/admin/AdminContacts";
import AdminQuotes from "@/pages/admin/AdminQuotes";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminPages from "@/pages/admin/AdminPages";
import PageEditor from "@/pages/admin/PageEditor";
import AdminMenus from "@/pages/admin/AdminMenus";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminSocials from "@/pages/admin/AdminSocials";

function App() {
  return (
    <div className="App">
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/metiers/:key" element={<MetierDetail />} />
                <Route path="/activites" element={<Activites />} />
                <Route path="/activites/:key" element={<ActiviteDetail />} />
                <Route path="/produits" element={<Produits />} />
                <Route path="/produits/:id" element={<ProduitDetail />} />
                <Route path="/realisations" element={<Realisations />} />
                <Route path="/actualites" element={<Actualites />} />
                <Route path="/actualites/:slug" element={<ArticleDetail />} />
                <Route path="/certifications" element={<Certifications />} />
                <Route path="/partenaires" element={<Partenaires />} />
                <Route path="/rse" element={<RSE />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/devis" element={<Devis />} />
                <Route path="/p/:slug" element={<PublicPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="pages/nouveau" element={<PageEditor />} />
                <Route path="pages/:id" element={<PageEditor />} />
                <Route path="menus" element={<AdminMenus />} />
                <Route path="medias" element={<AdminMedia />} />
                <Route path="reseaux" element={<AdminSocials />} />
                <Route path="produits" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="articles" element={<AdminArticles />} />
                <Route path="realisations" element={<AdminRealisations />} />
                <Route path="partenaires" element={<AdminPartners />} />
                <Route path="certifications" element={<AdminCertifications />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="devis" element={<AdminQuotes />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
              </Route>
            </Routes>
            <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </div>
  );
}

export default App;
