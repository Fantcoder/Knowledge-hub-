import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandPalette from '../common/CommandPalette'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            {/* Command Palette available always in Layout */}
            <CommandPalette />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
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
