import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate leading-none font-black uppercase tracking-tighter italic text-base">
                    Maki Desu
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-tight mt-0.5">
                    Restaurant Operations
                </span>
            </div>
        </>
    );
}
