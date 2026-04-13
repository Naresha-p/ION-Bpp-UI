import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout        from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ProductsPage  from './pages/ProductsPage'
import OrdersPage    from './pages/OrdersPage'

import PublishPage   from './pages/PublishPage'
import SettingsPage  from './pages/SettingsPage'
import HelpPage      from './pages/HelpPage'

export default function App() {
  return (
	   <BrowserRouter basename="/bpp-admin">
      <Routes>
        <Route element={<Layout />}>
          <Route index              element={<DashboardPage />} />
          <Route path="products"    element={<ProductsPage />}  />
          <Route path="orders"      element={<OrdersPage />}    />
          <Route path="publish"     element={<PublishPage />}   />
          <Route path="settings"    element={<SettingsPage />}  />
          <Route path="help"        element={<HelpPage />}      />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
