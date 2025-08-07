
'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import React from 'react';
import { CodeXml } from "lucide-react";

export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center space-x-2 py-1 font-normal text-black dark:text-white"
    >
        <CodeXml className="h-8 w-8 text-primary" />
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
        <CodeXml className="h-6 w-6 text-primary" />
    </Link>
  );
};
