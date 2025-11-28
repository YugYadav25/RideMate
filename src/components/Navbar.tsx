import { useState } from 'react';
import { Menu, X, User, LogOut, Home, Search, PlusCircle, Car, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from './Button';
import Logo from './Logo';

export default function Navbar() {
    const { navigateTo, authToken, logout, userRole, userName } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigation = (screen: string) => {
        navigateTo(screen);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigateTo('landing');
        setIsMenuOpen(false);
    };

    const NavLink = ({ screen, icon: Icon, label }: { screen: string; icon: any; label: string }) => (
        <button
            onClick={() => handleNavigation(screen)}
            className="flex items-center gap-2 text-gray-600 hover:text-black font-medium transition-colors"
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    const MobileNavLink = ({ screen, icon: Icon, label }: { screen: string; icon: any; label: string }) => (
        <button
            onClick={() => handleNavigation(screen)}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 text-gray-700 hover:text-black font-medium transition-all"
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavigation(authToken ? 'dashboard' : 'landing')}>
                        <Logo className="h-10 w-10 sm:h-12 sm:w-12" />
                        <span className="ml-3 text-xl font-bold tracking-tight hidden sm:block">RideMate</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {authToken ? (
                            <>
                                <NavLink screen="dashboard" icon={Home} label="Dashboard" />
                                {userRole === 'rider' && (
                                    <NavLink screen="search-ride" icon={Search} label="Find Ride" />
                                )}
                                {userRole === 'driver' && (
                                    <NavLink screen="create-ride" icon={PlusCircle} label="Offer Ride" />
                                )}
                                <NavLink screen="ride-history" icon={History} label="History" />

                                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleNavigation('profile')}
                                        className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 hover:border-black transition-all group"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                            <User size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">{userName?.split(' ')[0]}</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleNavigation('landing')} className="text-gray-600 hover:text-black font-medium">
                                    Home
                                </button>
                                <button onClick={() => handleNavigation('login')} className="text-gray-600 hover:text-black font-medium">
                                    Log in
                                </button>
                                <Button onClick={() => handleNavigation('signup')} size="sm">
                                    Sign up
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 space-y-2">
                        {authToken ? (
                            <>
                                <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-black">{userName}</p>
                                        <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                                    </div>
                                </div>

                                <MobileNavLink screen="dashboard" icon={Home} label="Dashboard" />
                                {userRole === 'rider' && (
                                    <MobileNavLink screen="search-ride" icon={Search} label="Find a Ride" />
                                )}
                                {userRole === 'driver' && (
                                    <MobileNavLink screen="create-ride" icon={PlusCircle} label="Offer a Ride" />
                                )}
                                <MobileNavLink screen="ride-history" icon={History} label="Ride History" />
                                <MobileNavLink screen="profile" icon={User} label="My Profile" />

                                <div className="h-px bg-gray-100 my-2"></div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-all"
                                >
                                    <LogOut size={20} />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <Button fullWidth variant="outline" onClick={() => handleNavigation('login')}>
                                    Log in
                                </Button>
                                <Button fullWidth onClick={() => handleNavigation('signup')}>
                                    Sign up
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
