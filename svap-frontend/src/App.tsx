import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import './App.css'
import { supabase } from './services/supabase'
import { NotificationProvider, useNotifications } from './context/NotificationContext'
import Navbar from './components/Main-components/Navbar'
import Homemain from './components/Home-page/Homemain'
import ProductDetailPage from './components/Product-detail/ProductDetailPage.tsx'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import Profile from './components/Profile/Profile'
import UserProfile from './components/Profile/UserProfile'
import Requests from './components/Requests/Requests'
import CartPage from './components/Cart/CartPage'
import CategoryPage from './components/Category/CategoryPage'
import AllCategoriesPage from './components/Category/AllCategoriesPage'
import AllProductGrid from './components/Category/AllProductGrid'
import OrdersPage from './components/Orders/OrdersPage'
import ListProductPage from './components/ListProduct/ListProductPage'
import CheckoutPage from './components/Checkout/CheckoutPage'
import SearchPage from './components/Search/SearchPage'
import ReelsPage from './components/Reels/ReelsPage'
import NotificationsPage from './components/Notifications/NotificationsPage'
import CreatePage from './components/Create/CreatePage'
import CreateReelPage from './components/Create/CreateReel/CreateReelPage'
import EditProfilePage from './components/Profile/EditProfilePage'
import EditProductPage from './components/ListProduct/EditProductPage'
import MobileNav from './components/Main-components/MobileNav.tsx'
import TopNavbar from './components/Main-components/TopNavbar.tsx'
import AboutUs from './components/Footer-pages/AboutUs'
import HelpCenter from './components/Footer-pages/HelpCenter'
import SafetyTips from './components/Footer-pages/SafetyTips'
import ReportProblem from './components/Footer-pages/ReportProblem'
import ContactUs from './components/Footer-pages/ContactUs'
// import PrivacyPolicy from './components/Footer-pages/PrivacyPolicy'
import TermsOfService from './components/Footer-pages/TermsOfService'
import CookiePolicy from './components/Footer-pages/CookiePolicy'

export const lenisRef: { current: Lenis | null } = { current: null }

// ── Global Toast Component ─────────────────────────────────────────────────
function GlobalToasts() {
  const { toasts, dismissToast } = useNotifications()
  const navigate = useNavigate()

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, width: '90vw' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => { dismissToast(t.id); navigate('/order') }}
          style={{
            background: 'rgba(20,20,20,0.95)',
            border: '1px solid rgba(228,88,33,0.35)',
            borderRadius: 14,
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            animation: 'toast-slide-in 0.3s ease-out',
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(228,88,33,0.2)', border: '1px solid rgba(228,88,33,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
            🔔
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 3px', fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>New Swap Request</p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Poppins', sans-serif", lineHeight: 1.4 }}>{t.body}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismissToast(t.id) }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>
      ))}
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])
  return null
}

// Pages that should NOT have sidebar offset (full-screen)
const FULL_SCREEN_ROUTES = ['/reels', '/reel-upload', '/create-reel', '/login', '/signup']

function AppInner() {
  const lenisInstanceRef = useRef<Lenis | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const metadata = user.user_metadata || {};
          const name = metadata.full_name || metadata.name || "User";
          const username = name ? `@${name.replace(/\\s+/g, "").toLowerCase()}` : "@user";
          
          const existingUser = localStorage.getItem("sz_user");
          if (!existingUser) {
            localStorage.setItem("sz_user", JSON.stringify({
              id: user.id,
              name: name,
              username: username,
              city: "Pakistan",
              email: user.email,
              avatar: metadata.avatar_url || metadata.picture || null
            }));
            window.dispatchEvent(new Event("sz_auth_change"));
            navigate("/");
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem("sz_user");
          window.dispatchEvent(new Event("sz_auth_change"));
        }
      }
    );
    return () => {
      subscription?.unsubscribe();
    }
  }, [navigate]);

  useEffect(() => {
    if (isFullScreen) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })
    lenisRef.current = lenis
    lenisInstanceRef.current = lenis

    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    const id = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [isFullScreen])

  return (
    <>
      <GlobalToasts />
      <Navbar />
      <TopNavbar />
      <ScrollToTop />

      {isFullScreen ? (
        <Routes>
          <Route path="/reels"       element={<ReelsPage />} />
          <Route path="/reel-upload" element={<CreateReelPage />} />
          <Route path="/create-reel" element={<CreateReelPage />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/signup"      element={<Signup />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <main className="app-main">
            <Routes>
              <Route path="/"                   element={<Homemain />} />
              <Route path="/categories"         element={<AllCategoriesPage />} />
              <Route path="/all-listings"       element={<AllProductGrid />} />
              <Route path="/product/:id"        element={<ProductDetailPage />} />
              <Route path="/user/:userId"       element={<UserProfile />} />
              <Route path="/category/:name"     element={<CategoryPage />} />
              <Route path="/profile"            element={<Profile />} />
              <Route path="/profile/edit"       element={<EditProfilePage />} />
              <Route path="/edit-product/:id"   element={<EditProductPage />} />
              <Route path="/requests"           element={<Requests />} />
              <Route path="/order"              element={<OrdersPage />} />
              <Route path="/orders"             element={<OrdersPage />} />
              <Route path="/list-product"       element={<ListProductPage />} />
              <Route path="/cart"               element={<CartPage />} />
              <Route path="/checkout"           element={<CheckoutPage />} />
              <Route path="/search"             element={<SearchPage />} />
              <Route path="/notifications"      element={<NotificationsPage />} />
              <Route path="/create"             element={<CreatePage />} />
              <Route path="/about"              element={<AboutUs />} />
              <Route path="/help-center"        element={<HelpCenter />} />
              <Route path="/safety-tips"        element={<SafetyTips />} />
              <Route path="/report-a-problem"   element={<ReportProblem />} />
              <Route path="/contact-us"         element={<ContactUs />} />
              {/* <Route path="/privacy-policy"     element={<PrivacyPolicy />} /> */}
              <Route path="/terms-of-service"   element={<TermsOfService />} />
              <Route path="/cookie-policy"      element={<CookiePolicy />} />
            </Routes>
          </main>
          <MobileNav />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
