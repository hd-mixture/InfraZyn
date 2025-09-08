'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import React from 'react';

const CustomLogoIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <rect width="18" height="18" x="3" y="3" rx="4" ry="4" stroke="url(#logoGradient)" />
        <rect width="4" height="4" x="7" y="7" rx="1" ry="1" fill="url(#logoGradient)" stroke="none" />
        <rect width="4" height="4" x="13" y="7" rx="1" ry="1" fill="url(#logoGradient)" stroke="none" />
        <rect width="4" height="4" x="7" y="13" rx="1" ry="1" fill="url(#logoGradient)" stroke="none" />
        <rect width="4" height="4" x="13" y="13" rx="1" ry="1" fill="url(#logoGradient)" stroke="none" />
    </svg>
);


export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center space-x-2 py-1 font-normal text-black dark:text-white"
    >
        <CustomLogoIcon className="h-8 w-8" />
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold whitespace-pre text-black dark:text-white text-xl"
        >
            DevTeXhHub
        </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center space-x-2 py-1 text-sm font-normal text-black"
    >
        <CustomLogoIcon className="h-7 w-7" />
    </Link>
  );
};
