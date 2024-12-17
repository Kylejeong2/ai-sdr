import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Layout/app-sidebar";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const [defaultOpen, setDefaultOpen] = useState(true);

    useEffect(() => {
        const sidebarState = Cookies.get("sidebar:state");
        setDefaultOpen(sidebarState === "true");
    }, []);

    const handleSidebarChange = (open: boolean) => {
        Cookies.set("sidebar:state", String(open));
    };

    return (
        <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleSidebarChange}>
            <AppSidebar />
            <main className="h-full w-full py-2 overflow-y-auto">
                <SidebarTrigger />
                {children}
            </main>
        </SidebarProvider>
    );
}