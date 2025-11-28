import React from 'react';
import Logo from './Logo';
import { useApp } from '../context/AppContext';

export default function Footer() {
    const { navigateTo } = useApp();

    return (
        <footer className="footer">
            <div className="max-w-7xl mx-auto">
                <div className="footer-grid">
                    <div className="footer-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Logo className="h-8 w-8 bg-white rounded-full text-black p-1" />
                            <span className="font-bold text-lg">RideMate</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Reimagining urban mobility with a focus on safety, efficiency, and community.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Platform</h4>
                        <button onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">How it Works</button>
                        <button onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Safety Standards</button>
                        <button onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Cities</button>
                        <button onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Fleet</button>
                    </div>

                    <div className="footer-col">
                        <h4>Company</h4>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">About Us</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Careers</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Press</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Contact</a>
                    </div>

                    <div className="footer-col">
                        <h4>Legal</h4>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Terms of Service</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Privacy Policy</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="footer-link cursor-default opacity-50">Cookie Policy</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} RideMate Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors cursor-default opacity-50">Twitter</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors cursor-default opacity-50">LinkedIn</a>
                        <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors cursor-default opacity-50">Instagram</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
