import React from 'react'
   import AdminPanel from './AdminPanel'
   import Viewer from './Viewer'

   export default function App() {
     const isViewer = window.location.pathname.startsWith('/view')
     return isViewer ? <Viewer /> : <AdminPanel />
   }
