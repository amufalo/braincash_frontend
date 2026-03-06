import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-1">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar text-sidebar-foreground w-[min(20rem,85vw)] max-w-[20rem]">
                <AppSidebar onNavigate={() => setOpen(false)} className="w-full h-full" />
            </SheetContent>
        </Sheet>
    );
}
