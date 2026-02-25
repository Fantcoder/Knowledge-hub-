import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-surface-0">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-6 py-8 lg:px-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
