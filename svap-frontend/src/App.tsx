import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import './App.css'
import { supabase } from './services/supabase'
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

export const lenisRef: { current: Lenis | null } = { current: null }

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
      (event, session) => {
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
              <Route path="/orders"             element={<OrdersPage />} />
              <Route path="/list-product"       element={<ListProductPage />} />
              <Route path="/cart"               element={<CartPage />} />
              <Route path="/checkout"           element={<CheckoutPage />} />
              <Route path="/search"             element={<SearchPage />} />
              <Route path="/notifications"      element={<NotificationsPage />} />
              <Route path="/create"             element={<CreatePage />} />
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
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

export default App
